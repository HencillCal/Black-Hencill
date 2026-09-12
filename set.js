/* if you're using pannel carefully edit this part

There's no need to configure this if you're deploying via Heroku — just set them in the environment variables.*/

const fs = require('fs');
const path = require('path');
const runtimeSettingsPath = path.join(__dirname, '.bot-settings.json');

function readRuntimeSettings() {
  try {
    return JSON.parse(fs.readFileSync(runtimeSettingsPath, 'utf8')) || {};
  } catch {
    return {};
  }
}

function getSetting(key, fallback = '') {
  const settings = readRuntimeSettings();
  return process.env[key] ?? settings[key] ?? fallback;
}

function setSetting(key, value) {
  const settings = readRuntimeSettings();
  settings[key] = String(value).trim();
  fs.writeFileSync(runtimeSettingsPath, JSON.stringify(settings, null, 2) + '\n');
  process.env[key] = settings[key];
  return settings[key];
}

const sessionName = 'session';
// Panel users can paste the complete session string between these quotes.
// Leave it empty only when using the SESSION environment variable instead.
const SESSION_IN_SET_JS = '';
// Leave empty to prompt for the number in the panel console when no session exists.
const PAIRING_NUMBER_IN_SET_JS = '';
const session = SESSION_IN_SET_JS.trim() || getSetting('SESSION');
const pairingNumber = getSetting('PAIRING_NUMBER', PAIRING_NUMBER_IN_SET_JS);
const pairingCode = getSetting('PAIRING_CODE', 'TRUE');
const qrAuth = getSetting('QR_AUTH', 'TRUE');
const autobio = getSetting('AUTOBIO', 'FALSE');
const autolike = getSetting('AUTOLIKE_STATUS', 'FALSE');
const autoviewstatus = getSetting('AUTOVIEW_STATUS', 'TRUE');
const autorecord = getSetting('AUTORECORD', 'FALSE');
const autotyping = getSetting('AUTOTYPING', 'FALSE');
const welcomegoodbye = getSetting('WELCOMEGOODBYE', 'FALSE');
const prefix = getSetting('PREFIX', '.');
const appname = getSetting('APP_NAME');
const herokuapi = getSetting('HEROKU_API');
// Set the bot owner's WhatsApp number here. Keep country code, no + sign.
const OWNER_NUMBER = '254784320958';
// Fixed developer contact. This is intentionally not read from environment variables.
const DEV_NUMBER = '254769365617';
const gptdm = getSetting('GPT_INBOX', 'FALSE');
const mode = getSetting('MODE', 'PRIVATE');
const anticall = getSetting('AUTOREJECT_CALL', 'TRUE');
const botname = getSetting('BOTNAME', 'JINWIIL');
const antibot = getSetting('ANTIBOT', 'FALSE');
const author = getSetting('STICKER_AUTHOR', 'Jinwiil Onginjo');
const packname = getSetting('STICKER_PACKNAME', 'JINWIIL');
const antitag = getSetting('ANTITAG', 'TRUE');
const dev = DEV_NUMBER;
const owner = OWNER_NUMBER;
const menulink = getSetting('MENU_LINK', 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663940572214/bQLohrCdxEXTEjOh.png');
const menu = getSetting('MENU_TYPE', 'IMAGE');
const DevRaven = owner.split(",");
const badwordkick = getSetting('BAD_WORD_KICK', 'FALSE');
const bad = getSetting('BAD_WORD', 'fuck');
const autoread = getSetting('AUTOREAD', 'FALSE');
const antidel = getSetting('ANTIDELETE', 'TRUE');
const antistatusdelete = getSetting('ANTIDELETE_STATUS', 'TRUE');
const admin = getSetting('ADMIN_MSG', '𝗖𝗼𝗺𝗺𝗮𝗻𝗱 𝗿𝗲𝘀𝗲𝗿𝘃𝗲𝗱 𝗳𝗼𝗿 𝗔𝗱𝗺𝗶𝗻𝘀!');
const group = getSetting('GROUP_ONLY_MSG', '𝗖𝗼𝗺𝗺𝗮𝗻𝗱 𝗺𝗲𝗮𝗻𝘁 𝗳𝗼𝗿 𝗚𝗿𝗼𝘂𝗽𝘀!');
const botAdmin = getSetting('BOT_ADMIN_MSG', '𝗜 𝗻𝗲𝗲𝗱 𝗮𝗱𝗺𝗶𝗻 𝗽𝗿𝗲𝘃𝗶𝗹𝗲𝗴𝗲𝘀!');
const NotOwner = getSetting('NOT_OWNER_MSG', '𝗖𝗼𝗺𝗺𝗮𝗻𝗱 𝗺𝗲𝗮𝗻𝘁 𝗳𝗼𝗿 𝘁𝗵𝗲 𝗼𝘄𝗻𝗲𝗿!');
const wapresence = getSetting('WA_PRESENCE', 'online');
const antilink = getSetting('ANTILINK', 'TRUE');
const mycode = getSetting('CODE', '254');
const antiforeign = getSetting('ANTIFOREIGN', 'FALSE');
const port = getSetting('PORT', 10000);
const antilinkall = getSetting('ANTILINK_ALL', 'TRUE');

const SETTING_ALIASES = {
  AUTOSTATUS: 'AUTOVIEW_STATUS',
  AUTO_STATUS: 'AUTOVIEW_STATUS',
  AUTOVIEW: 'AUTOVIEW_STATUS',
  AUTO_LIKE: 'AUTOLIKE_STATUS',
  AUTOLIKE: 'AUTOLIKE_STATUS',
  AUTO_RECORD: 'AUTORECORD',
  AUTO_TYPING: 'AUTOTYPING',
  ANTIDELETE_STATUS: 'ANTIDELETE_STATUS',
  ANTISTATUSDELETE: 'ANTIDELETE_STATUS'
};

const DISPLAY_SETTINGS = [
  'PREFIX', 'MODE', 'AUTOVIEW_STATUS', 'AUTOLIKE_STATUS', 'AUTORECORD', 'AUTOTYPING', 'ANTIDELETE',
  'ANTIDELETE_STATUS', 'AUTOREAD', 'ANTILINK', 'ANTILINK_ALL', 'ANTITAG',
  'AUTOREJECT_CALL', 'WELCOMEGOODBYE', 'GPT_INBOX', 'BAD_WORD_KICK'
];

function normalizeSettingKey(key) {
  const normalized = String(key || '').trim().toUpperCase().replace(/[ -]+/g, '_');
  return SETTING_ALIASES[normalized] || normalized;
}

function getDisplaySettings() {
  return Object.fromEntries(DISPLAY_SETTINGS.map(key => [key, getSetting(key, 'UNSET')]));
}

module.exports = { session, sessionName, pairingNumber, pairingCode, qrAuth, autobio, author, packname, dev, owner, DevRaven, badwordkick, bad, mode, group, NotOwner, botname, botAdmin, antiforeign, menu, autoread, antilink, admin, mycode, antilinkall, anticall, antitag, antidel, antistatusdelete, wapresence, welcomegoodbye, antibot, herokuapi, prefix, port, gptdm, appname, autolike, autoviewstatus, autorecord, autotyping, getSetting, setSetting, normalizeSettingKey, getDisplaySettings };
