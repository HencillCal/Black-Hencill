'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const pino = require('pino');
const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  Browsers,
  DisconnectReason,
  delay
} = require('@whiskeysockets/baileys');

const PAIR_ROOT = path.join(__dirname, '..', '.pairing-sessions');
const SESSION_PREFIX = 'Jinwiil~';
const MAX_RECONNECTS = 5;

function normalizePairNumber(value) {
  const number = String(value || '').replace(/[^0-9]/g, '');
  if (!/^\d{8,15}$/.test(number)) {
    throw new Error('Use a WhatsApp number with country code, for example: 2547XXXXXXXX');
  }
  return number;
}

function sessionFromCredentials(file) {
  const credentials = fs.readFileSync(file);
  if (!credentials || credentials.length < 100) {
    throw new Error('WhatsApp credentials were not saved yet');
  }
  return SESSION_PREFIX + zlib.gzipSync(credentials).toString('base64');
}

async function removePairDirectory(directory) {
  await fs.promises.rm(directory, { recursive: true, force: true }).catch(() => {});
}

/**
 * Start one temporary Baileys socket, request a WhatsApp pairing code, and
 * send the resulting Jinwiil~ session to the newly linked number's own DM.
 * The bot's primary socket is never replaced or logged out.
 */
async function startJinwiilPairing(numberInput) {
  const number = normalizePairNumber(numberInput);
  fs.mkdirSync(PAIR_ROOT, { recursive: true });
  const id = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
  const directory = path.join(PAIR_ROOT, id);
  fs.mkdirSync(directory, { recursive: true });

  let socket;
  let codeSent = false;
  let finished = false;
  let reconnects = 0;

  const createSocket = async () => {
    const { state, saveCreds } = await useMultiFileAuthState(directory);
    const { version } = await fetchLatestBaileysVersion();
    const logger = pino({ level: 'silent' });

    socket = makeWASocket({
      version,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger)
      },
      logger,
      browser: Browsers.macOS('Safari'),
      printQRInTerminal: false,
      syncFullHistory: false,
      markOnlineOnConnect: true,
      generateHighQualityLinkPreview: false,
      connectTimeoutMs: 60000,
      keepAliveIntervalMs: 30000
    });

    socket.ev.on('creds.update', saveCreds);
    socket.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
      if (connection === 'open') {
        reconnects = 0;
        if (finished) return;
        try {
          const credsPath = path.join(directory, 'creds.json');
          for (let attempt = 0; attempt < 20; attempt += 1) {
            if (fs.existsSync(credsPath) && fs.statSync(credsPath).size > 100) break;
            await delay(1000);
          }
          const session = sessionFromCredentials(credsPath);
          // WhatsApp may assign a LID instead of the phone-number JID.
          // The socket's own user ID is therefore the reliable DM target.
          const targetJid = socket.user?.id || `${number}@s.whatsapp.net`;
          const message = [
            '*JINWIIL SESSION GENERATED*',
            '',
            session,
            '',
            'Paste the complete value between the quotes in set.js:',
            "const SESSION_IN_SET_JS = 'Jinwiil~...';",
            '',
            'Keep this session private. Anyone who has it can use the linked account.'
          ].join('\n');
          await socket.sendMessage(targetJid, { text: message });
          finished = true;
          console.log(`[pair] Jinwiil session sent to ${number}`);
          await delay(1500);
          try { socket.ws.close(); } catch (_) {}
          await removePairDirectory(directory);
        } catch (error) {
          console.error('[pair] session generation failed:', error.message);
          finished = true;
          try { socket.ws.close(); } catch (_) {}
          await removePairDirectory(directory);
        }
        return;
      }

      if (connection === 'close' && !finished) {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        if (statusCode === DisconnectReason.loggedOut || reconnects >= MAX_RECONNECTS) {
          finished = true;
          await removePairDirectory(directory);
          return;
        }
        reconnects += 1;
        await delay(Math.min(5000 * reconnects, 15000));
        if (!finished) await createSocket();
      }
    });

    if (!state.creds.registered && !codeSent) {
      await delay(1500);
      const code = await socket.requestPairingCode(number);
      codeSent = true;
      return String(code);
    }
    return '';
  };

  try {
    const code = await createSocket();
    if (!code) throw new Error('WhatsApp did not return a pairing code');
    return {
      code,
      number,
      close: async () => {
        finished = true;
        try { socket?.ws?.close(); } catch (_) {}
        await removePairDirectory(directory);
      }
    };
  } catch (error) {
    await removePairDirectory(directory);
    throw error;
  }
}

module.exports = { startJinwiilPairing, normalizePairNumber };
