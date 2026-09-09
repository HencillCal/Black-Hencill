// Copy paste 🤏🏼😁😁
const { BufferJSON, WA_DEFAULT_EPHEMERAL, generateWAMessageFromContent, proto, generateWAMessageContent, generateWAMessage, prepareWAMessageMedia, areJidsSameUser, getContentType, downloadContentFromMessage } = require("@whiskeysockets/baileys");
const fs = require("fs");
const path = require('path');
const util = require("util");
const mumaker = require("mumaker");
global.axios = require('axios').default
const chalk = require("chalk");
const uploadToCatbox = require('./lib/catbox.js');
const speed = require("performance-now");
const Genius = require("genius-lyrics");
const yts = require("yt-search");
let lastTextTime = 0;
const messageDelay = 3000;
const { DateTime } = require('luxon');
const uploadtoimgur = require('./lib/imgur');
const advice = require("badadvice");
const BASE_URL = 'https://noobs-api.top';
const acrcloud = require("acrcloud"); 
const ytdl = require("ytdl-core");
const Client = new Genius.Client(process.env.GENIUS_ACCESS_TOKEN || ""); // Scrapes if no key is provided
const { TelegraPh, UploadFileUgu, webp2mp4File, floNime } = require('./lib/ravenupload');
const { Configuration, OpenAI } = require("openai");
const { menu, autoread, mode, antidel, antitag, appname, herokuapi, gptdm, botname, antibot, prefix, author, packname, mycode, admin, botAdmin, dev, owner, group, bad, DevRaven, NotOwner, antilink, antilinkall, wapresence, badwordkick, getDisplaySettings, setSetting, normalizeSettingKey } = require("./set.js");
const { smsg, runtime, fetchUrl, isUrl, processTime, formatp, tanggal, formatDate, getTime,  sleep, generateProfilePicture, clockString, fetchJson, getBuffer, jsonformat, format, parseMention, getRandom } = require('./lib/ravenfunc');
const { exec, spawn, execSync } = require("child_process");
let updateInProgress = false;
let updateRepoRoot = __dirname;
const forwardedViewOnceIds = new Set();

function extractYouTubeUrl(value) {
  const match = String(value || "").match(/https?:\/\/(?:www\.|m\.)?(?:youtube\.com\/watch\?[^\s]+|youtu\.be\/[^\s]+|youtube\.com\/(?:shorts|embed)\/[^\s]+)/i);
  return match ? match[0].replace(/[),]+$/, "") : null;
}

async function resolveYouTubeUrl(query) {
  const directUrl = extractYouTubeUrl(query);
  if (directUrl) return directUrl;
  const search = await yts(String(query || ""));
  return search?.videos?.[0]?.url || null;
}

async function fetchSilvaYouTubeDownload(url, kind) {
  const http = require("axios");
  const endpoint = kind === "audio" ? "ytmp3" : "ytmp4";
  const response = await http.get(`https://api.silvatech.co.ke/download/${endpoint}`, {
    params: { url }, timeout: 90000
  });
  const result = response.data?.result || {};
  const downloadUrl = kind === "audio"
    ? (result.dl_link || result.download_url || result.url)
    : (result.download_url || result.dl_link || result.url);
  if (!response.data?.status || !downloadUrl) throw new Error(`SilvaTech returned no ${kind} download URL`);
  return { url: downloadUrl, title: result.title || "YouTube download" };
}

async function fetchDavidYouTubeDownload(url, kind) {
  const http = require("axios");
  const endpoint = kind === "audio" ? "ytmp3" : "ytmp4";
  const response = await http.get(`https://apis.davidcyril.name.ng/download/${endpoint}`, {
    params: { url }, timeout: 90000
  });
  const result = response.data?.result || {};
  const downloadUrl = result.download_url || result.dl_link || result.url;
  if (!response.data?.success || !downloadUrl) throw new Error(`David Cyril returned no ${kind} download URL`);
  return { url: downloadUrl, title: result.title || "YouTube download" };
}

async function fetchYouTubeDownload(url, kind) {
  const http = require("axios");
  const route = kind === "audio" ? "audio" : "video";
  const providers = [
    async () => {
      const response = await http.get(`https://apiskeith2-production-3020.up.railway.app/download/${route}`, {
        params: { url }, timeout: 90000
      });
      const mediaUrl = typeof response.data?.result === "string"
        ? response.data.result
        : response.data?.result?.url || response.data?.result?.download_url;
      if (!response.data?.status || !mediaUrl) throw new Error("Keith2 returned no media URL");
      return { url: mediaUrl, title: "YouTube download" };
    },
    () => fetchDavidYouTubeDownload(url, kind),
    () => fetchSilvaYouTubeDownload(url, kind)
  ];
  let lastError;
  for (const provider of providers) {
    try { return await provider(); } catch (error) { lastError = error; }
  }
  throw lastError || new Error(`No ${kind} download provider is available`);
}

async function sendSearchAudio(client, chat, query, quoted, label) {
  const url = await resolveYouTubeUrl(query);
  if (!url) throw new Error("No matching song was found");
  const media = await fetchYouTubeDownload(url, "audio");
  const safeTitle = (media.title || label || "song").replace(/[\/:*?"<>|]/g, "_");
  await client.sendMessage(chat, {
    audio: { url: media.url }, mimetype: "audio/mpeg", fileName: safeTitle + ".mp3"
  }, { quoted });
}

async function fetchSocialMedia(url, type) {
  const http = require("axios");
  const providers = type === "facebook" ? [
    async () => {
      const r = await http.get("https://apis.davidcyril.name.ng/facebook", { params: { url }, timeout: 90000 });
      const d = r.data?.result?.downloads || {};
      const mediaUrl = d.hd?.url || d.sd?.url;
      if (!r.data?.success || !mediaUrl) throw new Error("David Cyril returned no Facebook media");
      return { kind: "video", url: mediaUrl };
    },
    async () => {
      const r = await http.get("https://apiskeith2-production-3020.up.railway.app/download/fbdown", { params: { url }, timeout: 90000 });
      const media = r.data?.result?.media || {};
      const mediaUrl = media.hd || media.sd || r.data?.result?.url;
      if (!r.data?.status || !mediaUrl) throw new Error("Keith2 returned no Facebook media");
      return { kind: "video", url: mediaUrl };
    }
  ] : type === "tiktok" ? [
    async () => {
      const r = await http.get("https://apis.davidcyril.name.ng/download/tiktok", { params: { url }, timeout: 90000 });
      const mediaUrl = r.data?.result?.video || r.data?.result?.video_hd || r.data?.result?.video_sd;
      if (!r.data?.success || !mediaUrl) throw new Error("David Cyril returned no TikTok media");
      return { kind: "video", url: mediaUrl };
    },
    async () => {
      const r = await http.get("https://apiskeith2-production-3020.up.railway.app/download/tiktokdl3", { params: { url }, timeout: 90000 });
      const mediaUrl = typeof r.data?.result === "string" ? r.data.result : r.data?.result?.url;
      if (!r.data?.status || !mediaUrl) throw new Error("Keith2 returned no TikTok media");
      return { kind: "video", url: mediaUrl };
    }
  ] : type === "instagram" ? [
    async () => {
      const r = await http.get("https://apiskeith2-production-3020.up.railway.app/download/instagramdl", { params: { url }, timeout: 90000 });
      const mediaUrl = typeof r.data?.result === "string" ? r.data.result : r.data?.result?.url;
      if (!r.data?.status || !mediaUrl) throw new Error("Keith2 returned no Instagram media");
      return { kind: "video", url: mediaUrl };
    },
    async () => {
      const r = await http.get("https://apiskeith2-production-3020.up.railway.app/download/instadl", { params: { url }, timeout: 90000 });
      const mediaUrl = r.data?.download?.video_mp4 || r.data?.result?.video || r.data?.result?.url;
      if (!r.data?.status || !mediaUrl) throw new Error("Keith2 alternate Instagram route returned no media");
      return { kind: "video", url: mediaUrl };
    }
  ] : [
    async () => {
      const r = await http.get("https://apiskeith2-production-3020.up.railway.app/download/pindl3", { params: { url }, timeout: 90000 });
      const d = r.data?.result || {};
      if (!r.data?.status || (!d.video && !d.image)) throw new Error("Keith2 returned no Pinterest media");
      return d.video ? { kind: "video", url: d.video } : { kind: "image", url: d.image };
    },
    async () => {
      const r = await http.get("https://apis.davidcyril.name.ng/download/snapsaver", { params: { url }, timeout: 90000 });
      const videos = r.data?.result?.videos || [];
      const imageUrl = r.data?.result?.thumbnail;
      const mediaUrl = videos[0]?.url || imageUrl;
      if (!r.data?.success || !mediaUrl) throw new Error("David Cyril returned no Pinterest media");
      return { kind: videos[0]?.url ? "video" : "image", url: mediaUrl };
    }
  ];
  let lastError;
  for (const provider of providers) {
    try { return await provider(); } catch (error) { lastError = error; }
  }
  throw lastError || new Error(`No ${type} provider is available`);
}

async function sendYouTubeVideoFallback(client, chat, url, quoted) {
  const media = await fetchYouTubeDownload(url, "video");
  await client.sendMessage(chat, {
    video: { url: media.url }, mimetype: "video/mp4", fileName: `${media.title}.mp4`,
    caption: "DOWNLOADED BY BLACK DEMON"
  }, { quoted });
}

async function sendYouTubeAudioFallback(client, chat, url, quoted) {
  const media = await fetchYouTubeDownload(url, "audio");
  await client.sendMessage(chat, {
    audio: { url: media.url }, mimetype: "audio/mpeg", fileName: `${media.title}.mp3`, ptt: false
  }, { quoted });
}

function findUpdateRepoRoot() {
  const candidates = new Set([
    __dirname,
    process.cwd(),
    process.env.BOT_DIR,
    process.env.PROJECT_DIR,
    process.env.RENDER_SOURCE_DIR,
    "/home/container/Black-Hencill-main",
    "/home/container/Black-Hencill",
    "/home/Black-Hencill-main",
    "/home/Black-Hencill"
  ].filter(Boolean));

  for (const base of ["/home", "/home/container", process.cwd()]) {
    try {
      for (const entry of fs.readdirSync(base, { withFileTypes: true })) {
        if (entry.isDirectory()) candidates.add(path.join(base, entry.name));
      }
    } catch {}
  }

  for (const candidate of candidates) {
    try {
      if (fs.existsSync(path.join(candidate, ".git")) && fs.existsSync(path.join(candidate, "package.json"))) {
        return candidate;
      }
    } catch {}
  }
  return null;
}

function findProjectRoot() {
  const candidates = new Set([
    __dirname, process.cwd(), process.env.BOT_DIR, process.env.PROJECT_DIR,
    process.env.RENDER_SOURCE_DIR, "/home/container/Black-Hencill-main",
    "/home/container/Black-Hencill", "/home/Black-Hencill-main", "/home/Black-Hencill"
  ].filter(Boolean));
  for (const base of ["/home", "/home/container", process.cwd()]) {
    try {
      for (const entry of fs.readdirSync(base, { withFileTypes: true })) {
        if (entry.isDirectory()) candidates.add(path.join(base, entry.name));
      }
    } catch {}
  }
  for (const candidate of candidates) {
    try {
      if (fs.existsSync(path.join(candidate, "package.json"))) return candidate;
    } catch {}
  }
  return null;
}

async function updateFromGitHubArchive(projectRoot, axios) {
  const tempRoot = fs.mkdtempSync(path.join(require("os").tmpdir(), "black-demon-update-"));
  const archivePath = path.join(tempRoot, "main.tar.gz");
  const extractRoot = path.join(tempRoot, "extract");
  fs.mkdirSync(extractRoot, { recursive: true });
  try {
    let commitSha = "";
    try {
      const refOutput = await runUpdateShell("git ls-remote https://github.com/HencillCal/Black-Hencill.git refs/heads/main");
      commitSha = refOutput.stdout.trim().split(/\s+/)[0];
    } catch {}
    if (!commitSha) {
      const refResponse = await axios.get("https://api.github.com/repos/HencillCal/Black-Hencill/git/ref/heads/main", {
        timeout: 30000, headers: { "User-Agent": "Black-Demon-Updater", "Cache-Control": "no-cache" }
      });
      commitSha = refResponse.data?.object?.sha;
    }
    if (!commitSha) throw new Error("GitHub did not return the main branch commit SHA.");
    const response = await axios.get(`https://github.com/HencillCal/Black-Hencill/archive/refs/heads/main.tar.gz?ts=${Date.now()}`, {
      responseType: "arraybuffer", timeout: 120000, maxContentLength: 50 * 1024 * 1024,
      headers: { "Cache-Control": "no-cache", "User-Agent": "Black-Demon-Updater" }
    });
    fs.writeFileSync(archivePath, Buffer.from(response.data));
    const tarCommand = 'tar -xzf ' + JSON.stringify(archivePath) + ' -C ' + JSON.stringify(extractRoot);
    await new Promise((resolve, reject) => exec(tarCommand, { timeout: 120000 }, error => error ? reject(error) : resolve()));
    const extracted = fs.readdirSync(extractRoot).find(name => fs.existsSync(path.join(extractRoot, name, "package.json")));
    if (!extracted) throw new Error("GitHub archive did not contain a valid package.json.");
    const sourceRoot = path.join(extractRoot, extracted);
    const preserved = new Set(["node_modules", ".git", "auth_info_baileys", "session", "message_data", ".bot-settings.json", "set.js"]);
    for (const name of fs.readdirSync(sourceRoot)) {
      if (preserved.has(name)) continue;
      fs.cpSync(path.join(sourceRoot, name), path.join(projectRoot, name), { recursive: true, force: true });
    }
    updateRepoRoot = projectRoot;
    return {
      commitSha,
      version: JSON.parse(fs.readFileSync(path.join(sourceRoot, "package.json"), "utf8")).version || "latest"
    };
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

function runUpdateShell(command) {
  return new Promise((resolve, reject) => {
    exec(command, {
      cwd: updateRepoRoot,
      timeout: 120000,
      maxBuffer: 2 * 1024 * 1024
    }, (error, stdout, stderr) => {
      if (error) {
        error.stdout = stdout;
        error.stderr = stderr;
        return reject(error);
      }
      resolve({ stdout, stderr });
    });
  });
}

async function gitRefIsAncestor(olderRef, newerRef) {
  try {
    await runUpdateShell(`git merge-base --is-ancestor ${olderRef} ${newerRef}`);
    return true;
  } catch {
    return false;
  }
}

async function restartUpdatedProcess() {
  // Allow Baileys to flush the completion message before the process exits.
  await sleep(5000);
  process.exit(0);
}

// Only commands shown in the menu are enabled. Legacy switch cases remain
// isolated below, but removed commands can never reach them.
const MENU_COMMANDS = new Set([
  "menu",
  "ping", "owner", "dev", "idch", "cekidch",
  "autostatus", "autolike", "autorecord", "autotyping",
  "video", "ytmp4", "fbdl", "movie", "ytmp3", "tiktok", "song", "song2",
  "play", "play2", "yts", "spotify", "imgsearch", "web2zip", "twitter",
  "pinterest", "lyrics", "insta",
  "sticker", "photo", "retrieve", "vv2", "vv3", "mix", "😍", "tweet", "smeme", "mp4",
  "vv", "screenshots", "take",
  "approve", "promote", "delete", "close", "closetime", "disp-off", "disp-1",
  "disp-7", "disp-90", "icon", "subject", "leave", "tagall", "revoke",
  "unmute", "reject", "demote", "remove", "foreigners", "open", "opentime",
  "gcprofile", "desc", "add", "hidetag", "mute",
  "ai", "ai2", "vision", "gemini", "gpt", "gpt2", "gpt3", "gpt4", "define",
  "google", "dalle",
  "restart", "cast", "join", "redeploy", "setvar", "fullpp", "unlock",
  "admin", "broadcast", "getvar", "settings", "update", "botpp", "block", "save",
  "encrypt", "weather", "gitclone",
  "removebg", "tts", "facts", "quotes", "inspect", "github",
  "advice", "remin", "trt", "catfact", "pickupline",
  "cat", "golg", "child",
  "pair", "credits", "upload", "attp", "url", "fancy", "image", "system",
  "jinwiilvmd"
]);

const GROUP_METADATA_COMMANDS = new Set([
  "approve", "promote", "delete", "del", "close", "closetime", "disp-off", "disp-1",
  "disp-7", "disp-90", "icon", "subject", "changesubject", "leave", "tagall", "revoke",
  "newlink", "reset", "unmute", "mute", "reject", "demote", "remove", "kick", "foreigners",
  "open", "opentime", "gcprofile", "desc", "setdesc", "add", "hidetag", "tag", "vcf", "group-vcf"
]);

const messageCache = new Map();
const messageIdIndex = new Map();
const pendingMessageWrites = new Map();
const groupMetadataCache = new Map();
const MAX_CACHED_MESSAGES = 2000;
const messageDataDir = path.join(__dirname, "message_data");

async function getGroupMetadataFast(client, jid) {
  const cached = groupMetadataCache.get(jid);
  if (cached && Date.now() - cached.timestamp < 30000) return cached.metadata;
  const metadata = await Promise.race([
    client.groupMetadata(jid).catch(() => null),
    new Promise(resolve => setTimeout(() => resolve(null), 3000))
  ]);
  if (metadata) groupMetadataCache.set(jid, { metadata, timestamp: Date.now() });
  return metadata;
}

function stylishReply(text) {
  return `\`\`\`\n${text}\n\`\`\``;
}

function messageCacheKey(remoteJid, messageId) {
  return `${remoteJid}:${messageId}`;
}

function unwrapMessageContent(message) {
  let content = message?.message || message;
  while (
    content?.ephemeralMessage?.message ||
    content?.viewOnceMessage?.message ||
    content?.viewOnceMessageV2?.message ||
    content?.viewOnceMessageV2Extension?.message
  ) {
    content = content.ephemeralMessage?.message ||
      content.viewOnceMessage?.message ||
      content.viewOnceMessageV2?.message ||
      content.viewOnceMessageV2Extension?.message;
  }
  return content || {};
}

function getViewOnceContent(message) {
  let content = message?.message || message;
  for (let depth = 0; depth < 8 && content; depth += 1) {
    if (content.ephemeralMessage?.message) {
      content = content.ephemeralMessage.message;
      continue;
    }
    const wrapper = content.viewOnceMessage ||
      content.viewOnceMessageV2 ||
      content.viewOnceMessageV2Extension;
    if (wrapper?.message) return unwrapMessageContent(wrapper.message);
    const mediaKey = ["imageMessage", "videoMessage", "audioMessage", "documentMessage", "stickerMessage"]
      .find(key => content[key]?.viewOnce === true);
    if (mediaKey) return { [mediaKey]: content[mediaKey] };
    return null;
  }
  return null;
}

function normalizeEditedMessage(message) {
  const content = unwrapMessageContent(message);
  const protocolMessage = content?.protocolMessage;
  const editType = protocolMessage?.type;
  const isEdit = editType === 14 || editType === "MESSAGE_EDIT" || editType === "message_edit";
  if (!isEdit || !protocolMessage?.editedMessage) return message;

  return {
    ...message,
    key: protocolMessage.key || message.key,
    message: protocolMessage.editedMessage
  };
}

async function sendViewOnceCopy(client, message, destination, captionPrefix) {
  const quotedMessage = getViewOnceContent(message) ||
    (message?.mtype ? { [message.mtype]: message } : unwrapMessageContent(message));
  const mediaTypes = [
    ["imageMessage", "image"],
    ["videoMessage", "video"],
    ["audioMessage", "audio"],
    ["documentMessage", "document"],
    ["stickerMessage", "sticker"]
  ];
  const media = mediaTypes.find(([key]) => quotedMessage?.[key]);
  if (!media) return false;

  const [messageType, mediaType] = media;
  const mediaMessage = quotedMessage[messageType];
  console.log(`[VIEW-ONCE] detected ${mediaType} ${message.key?.id || "unknown"}`);
  const buffer = await downloadStoredMedia(mediaMessage, mediaType, client);
  const caption = mediaMessage.caption
    ? `${captionPrefix}\n${mediaMessage.caption}`
    : captionPrefix;

  if (mediaType === "image") {
    await client.sendMessage(destination, { image: buffer, caption });
  } else if (mediaType === "video") {
    await client.sendMessage(destination, { video: buffer, caption });
  } else if (mediaType === "audio") {
    await client.sendMessage(destination, {
      audio: buffer,
      ptt: mediaMessage.ptt === true,
      mimetype: mediaMessage.mimetype || "audio/mpeg"
    });
  } else if (mediaType === "document") {
    await client.sendMessage(destination, {
      document: buffer,
      fileName: mediaMessage.fileName || "view-once-file",
      mimetype: mediaMessage.mimetype || "application/octet-stream",
      caption
    });
  } else {
    await client.sendMessage(destination, { sticker: buffer });
  }
  return true;
}

async function forwardViewOnceToBot(client, message) {
  if (!message?.key || message.key.fromMe) return;
  if (message.key.remoteJid === "status@broadcast") return;
  const content = getViewOnceContent(message);
  if (!content) return;

  const eventId = `${message.key.remoteJid || ""}:${message.key.id || ""}`;
  if (eventId !== ":" && forwardedViewOnceIds.has(eventId)) return;
  if (eventId !== ":") forwardedViewOnceIds.add(eventId);

  const destination = client.decodeJid(client.user.id);
  if (!destination) return;

  try {
    const sender = firstJid(
      message.key.participant,
      message.participant,
      message.sender,
      message.key.remoteJid?.endsWith("@s.whatsapp.net") ? message.key.remoteJid : ""
    );
    let senderMention = "unknown sender";
    try {
      senderMention = await formatSenderMention(client, sender);
    } catch (identityError) {
      console.warn("Unable to format view-once sender:", identityError.message);
    }
    const forwarded = await sendViewOnceCopy(
      client,
      message,
      destination,
      `👁️ View-once message from ${senderMention}`
    );
    if (!forwarded) throw new Error("view-once wrapper contained no supported media");
    console.log(`[VIEW-ONCE] forwarded ${message.key.id || "unknown"} to owner DM`);
  } catch (error) {
    if (eventId !== ":") forwardedViewOnceIds.delete(eventId);
    console.error("Unable to forward view-once message:", error.message);
  }
}

function normalizeUploadResult(result) {
  if (typeof result === "string" && /^https?:\/\//i.test(result)) return result;
  const candidates = [
    result?.url,
    result?.link,
    result?.data?.url,
    result?.data?.link,
    result?.files?.[0]?.url,
    result?.files?.[0]?.link,
    result?.files?.[0]
  ];
  return candidates.find(value => typeof value === "string" && /^https?:\/\//i.test(value)) || null;
}

async function uploadMediaWithFallback(filePath) {
  const providers = [
    ["Catbox", () => uploadToCatbox(filePath)],
    ["Imgur", () => uploadtoimgur(filePath)],
    ["Uguu", () => UploadFileUgu(filePath)],
    ["Telegraph", () => TelegraPh(filePath)]
  ];
  const failures = [];

  for (const [name, upload] of providers) {
    try {
      const result = await Promise.race([
        upload(),
        new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 20000))
      ]);
      const url = normalizeUploadResult(result);
      if (url) return { name, url };
      failures.push(`${name}: invalid response`);
    } catch (error) {
      failures.push(`${name}: ${error.message}`);
      console.error(`${name} upload failed:`, error.message);
    }
  }

  throw new Error(failures.join("; "));
}

function messageFilePath(remoteJid, messageId) {
  return path.join(
    messageDataDir,
    encodeURIComponent(remoteJid),
    `${encodeURIComponent(messageId)}.json`
  );
}

async function loadStoredMessage(remoteJid, messageId) {
  const exactKey = remoteJid && messageCacheKey(remoteJid, messageId);
  const cached = exactKey && messageCache.get(exactKey);
  if (cached) return cached;

  const candidateKeys = [];
  if (exactKey) candidateKeys.push(exactKey);
  for (const key of messageIdIndex.get(messageId) || []) {
    if (!candidateKeys.includes(key)) candidateKeys.push(key);
  }

  for (const key of candidateKeys) {
    const pending = pendingMessageWrites.get(key);
    if (pending) await pending.catch(() => {});
    const storedRemoteJid = key.slice(0, key.lastIndexOf(":"));
    try {
      const data = fs.readFileSync(
        messageFilePath(storedRemoteJid, messageId),
        "utf8"
      );
      const parsed = JSON.parse(data, BufferJSON.reviver);
      const message = Array.isArray(parsed) ? parsed[0] : parsed;
      if (message) {
        messageCache.set(key, message);
        return message;
      }
    } catch {}
  }
  return null;
}

function fastHandleIncomingMessage(message) {
  const updateMessage = message?.update?.message;
  if (updateMessage) message = { ...message, message: updateMessage };
  message = normalizeEditedMessage(message);

  const remoteJid = message?.key?.remoteJid;
  const messageId = message?.key?.id;
  if (!remoteJid || !messageId) return;

  const key = messageCacheKey(remoteJid, messageId);
  messageCache.set(key, message);
  if (!messageIdIndex.has(messageId)) messageIdIndex.set(messageId, new Set());
  messageIdIndex.get(messageId).add(key);
  while (messageCache.size > MAX_CACHED_MESSAGES) {
    const oldestKey = messageCache.keys().next().value;
    const oldestMessage = messageCache.get(oldestKey);
    messageCache.delete(oldestKey);
    const oldestId = oldestMessage?.key?.id;
    if (oldestId && messageIdIndex.has(oldestId)) {
      messageIdIndex.get(oldestId).delete(oldestKey);
      if (!messageIdIndex.get(oldestId).size) messageIdIndex.delete(oldestId);
    }
  }

  const write = fs.promises.mkdir(path.dirname(messageFilePath(remoteJid, messageId)), {
    recursive: true
  }).then(() => fs.promises.writeFile(
    messageFilePath(remoteJid, messageId),
    JSON.stringify(message, BufferJSON.replacer)
  )).catch(error => {
    console.error("Unable to cache message for antidelete:", error.message);
  });
  pendingMessageWrites.set(key, write);
  write.finally(() => {
    if (pendingMessageWrites.get(key) === write) pendingMessageWrites.delete(key);
  });
}

function getRevocationKey(message) {
  const content = unwrapMessageContent(message);
  const protocolMessage = content?.protocolMessage;
  if (!protocolMessage) return null;

  const type = protocolMessage.type;
  if (type !== undefined && type !== 0 && type !== "REVOKE" && type !== "revoke") return null;
  return protocolMessage.key ?? null;
}

function isMessageRevocation(message) {
  return Boolean(getRevocationKey(message)?.id);
}

function isStatusRevocation(message) {
  const deletedKey = getRevocationKey(message);
  return deletedKey?.remoteJid === "status@broadcast" ||
    message?.key?.remoteJid === "status@broadcast";
}

function firstJid(...values) {
  return values.find(value => typeof value === "string" && value.includes("@")) || "";
}

async function normalizeSenderJid(client, jid) {
  if (!jid) return "";
  const decoded = client.decodeJid(jid);
  if (!/@lid$/i.test(decoded)) return decoded;

  try {
    const mapping = client.signalRepository?.lidMapping;
    if (mapping?.getPNForLID) {
      const phoneJid = await mapping.getPNForLID(decoded);
      if (phoneJid) return client.decodeJid(phoneJid);
    }
    if (client.getPNForLID) {
      const phoneJid = await client.getPNForLID(decoded);
      if (phoneJid) return client.decodeJid(phoneJid);
    }
  } catch (error) {
    console.warn("Unable to resolve sender LID:", error.message);
  }
  return decoded;
}

async function formatSenderMention(client, jid) {
  const normalized = await normalizeSenderJid(client, jid);
  const user = normalized.split("@")[0].split(":")[0].replace(/[^0-9]/g, "");
  return user ? `@${user}` : "unknown sender";
}

async function downloadStoredMedia(mediaMessage, mediaType, client) {
  try {
    const stream = await downloadContentFromMessage(mediaMessage, mediaType);
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    const downloaded = Buffer.concat(chunks);
    if (downloaded.length) return downloaded;
  } catch (error) {
    console.warn(`Direct ${mediaType} view-once download failed:`, error.message);
  }
  if (client?.downloadMediaMessage) return client.downloadMediaMessage(mediaMessage);
  throw new Error(`Unable to download view-once ${mediaType}`);
}

function getTextFromStoredMessage(message) {
  const content = unwrapMessageContent(message);
  return content.conversation ||
    content.extendedTextMessage?.text ||
    content.imageMessage?.caption ||
    content.videoMessage?.caption ||
    content.documentMessage?.caption ||
    content.buttonsResponseMessage?.selectedButtonId ||
    content.listResponseMessage?.singleSelectReply?.selectedRowId ||
    "";
}

async function fastHandleMessageRevocation(client, revocationMessage) {
  const receivedAt = Date.now();
  const deletedKey = getRevocationKey(revocationMessage);
  if (!deletedKey?.id) return;

  const remoteJid = firstJid(
    deletedKey.remoteJid,
    revocationMessage.key?.remoteJid,
    revocationMessage.remoteJid
  );
  const originalMessage = await loadStoredMessage(remoteJid, deletedKey.id);
  if (!originalMessage) {
    console.log(`Deleted message ${deletedKey.id} was not cached in time (${Date.now() - receivedAt}ms).`);
    return;
  }

  const revocationContent = unwrapMessageContent(revocationMessage);
  const deletedBy = firstJid(
    revocationMessage.revokedBy,
    revocationMessage.key?.participant,
    revocationMessage.participant,
    revocationMessage.sender,
    revocationContent?.protocolMessage?.participant,
    revocationContent?.protocolMessage?.sender,
    revocationContent?.protocolMessage?.senderKey?.participant,
    revocationMessage.message?.protocolMessage?.participant,
    revocationMessage.message?.protocolMessage?.sender,
    revocationMessage.message?.protocolMessage?.senderKey?.participant,
    remoteJid?.endsWith("@s.whatsapp.net") ? remoteJid : ""
  );
  const botJid = client.decodeJid(client.user.id);

  const deletedByFormatted = await formatSenderMention(client, deletedBy);
  const isStatus = remoteJid === "status@broadcast";
  let notificationText =
    `░ 🛒 ${isStatus ? "STATUS ANTI-DELETE" : "ANTIDELETE"} 🛒 ░\n\n 𝗗𝗲𝗹𝗲𝘁𝗲𝗱 𝗯𝘆 : ${deletedByFormatted}\n\n`;
  const content = unwrapMessageContent(originalMessage);
  const mediaTypes = [
    ["imageMessage", "image"],
    ["videoMessage", "video"],
    ["audioMessage", "audio"],
    ["documentMessage", "document"],
    ["stickerMessage", "sticker"]
  ];
  const media = mediaTypes.find(([key]) => content[key]);
  const destination = botJid || client.user.id;

  try {
    const text = getTextFromStoredMessage(originalMessage);
    if (text && !media) {
      await client.sendMessage(destination, {
        text: stylishReply(`${notificationText} 𝗗𝗲𝗹𝗲𝘁𝗲𝗱 𝗠𝗲𝘀𝘀𝗮𝗴𝗲 : ${text}`)
      });
      console.log(`Antidelete text sent in ${Date.now() - receivedAt}ms.`);
      return;
    }

    if (!media) {
      await client.sendMessage(destination, {
        text: stylishReply(`${notificationText} 𝗗𝗲𝗹𝗲𝘁𝗲𝗱 𝗖𝗼𝗻𝘁𝗲𝗻𝘁 : [Unsupported message]`)
      });
      return;
    }

    const [messageType, mediaType] = media;
    const mediaMessage = content[messageType];
    const mediaLabel = {
      image: "image",
      video: "video",
      audio: "audio",
      document: mediaMessage.fileName || "document",
      sticker: "sticker"
    }[mediaType] || mediaType;
    notificationText += ` 𝗗𝗲𝗹𝗲𝘁𝗲𝗱 𝗠𝗲𝗱𝗶𝗮 : [${mediaLabel}]`;

    // Audio and sticker messages cannot reliably carry a WhatsApp caption.
    // Send their identity notice before downloading so it is never lost if
    // media decryption or recovery fails.
    if (mediaType === "audio" || mediaType === "sticker") {
      await client.sendMessage(destination, {
        text: stylishReply(notificationText)
      });
    }

    const buffer = await downloadStoredMedia(mediaMessage, mediaType, client);

    if (mediaType === "image") {
      await client.sendMessage(destination, {
        image: buffer,
        caption: stylishReply(`${notificationText}\n\n${mediaMessage.caption || ""}`)
      });
    } else if (mediaType === "video") {
      await client.sendMessage(destination, {
        video: buffer,
        caption: stylishReply(`${notificationText}\n\n${mediaMessage.caption || ""}`)
      });
    } else if (mediaType === "audio") {
      await client.sendMessage(destination, {
        audio: buffer,
        ptt: mediaMessage.ptt === true,
        mimetype: mediaMessage.mimetype || "audio/mpeg"
      });
    } else if (mediaType === "document") {
      await client.sendMessage(destination, {
        document: buffer,
        fileName: mediaMessage.fileName || "deleted-file",
        mimetype: mediaMessage.mimetype || "application/octet-stream",
        caption: stylishReply(notificationText)
      });
    } else {
      await client.sendMessage(destination, { sticker: buffer });
    }
    console.log(`Antidelete media sent in ${Date.now() - receivedAt}ms.`);
  } catch (error) {
    console.error("Error recovering deleted content:", error);
    await client.sendMessage(destination, {
      text: stylishReply(`${notificationText}\n\n⚠️ Media could not be recovered.`)
    });
  }
}

const ravenHandler = async (client, m, chatUpdate, store) => {
  try {
    var body =
      m.mtype === "conversation"
        ? m.message.conversation
        : m.mtype == "extendedTextMessage"
        ? m.message.extendedTextMessage.text
        : m.mtype == "buttonsResponseMessage"
        ? m.message.buttonsResponseMessage.selectedButtonId
        : m.mtype == "listResponseMessage"
        ? m.message.listResponseMessage.singleSelectReply.selectedRowId
        : m.mtype == "templateButtonReplyMessage"
        ? m.message.templateButtonReplyMessage.selectedId
        : m.mtype === "messageContextInfo"
        ? m.message.buttonsResponseMessage?.selectedButtonId || m.message.listResponseMessage?.singleSelectReply.selectedRowId || m.text
        : "";
    var budy = typeof m.text == "string" ? m.text : "";
	  var msgR = m.message.extendedTextMessage?.contextInfo?.quotedMessage;  
//========================================================================================================================//
//========================================================================================================================//	  
    const Heroku = require("heroku-client");  
    const command = body.replace(prefix, "").trim().split(/ +/).shift().toLowerCase();
    const args = body.trim().split(/ +/).slice(1);
    const pushname = m.pushName || "No Name";
    const botNumber = await client.decodeJid(client.user.id);
	const senderJid = m.key.participant || m.key.remoteJid;
	const senderAlternates = [
      senderJid,
      m.key.participantAlt,
      m.key.remoteJidAlt,
      m.participant,
      m.sender
    ].filter(Boolean);
	const normalizedSenderJids = await Promise.all(senderAlternates.map(jid => normalizeSenderJid(client, jid)));
    const isOwner = senderJid === botNumber;
    const itsMe = m.sender == botNumber ? true : false;
    let text = (q = args.join(" "));
    const arg = budy.trim().substring(budy.indexOf(" ") + 1);
    const arg1 = arg.trim().substring(arg.indexOf(" ") + 1);
    m.isBaileys = m.id.startsWith("BAE5") && m.id.length === 16;
    const from = m.chat;
	const reply = (text) => client.sendMessage(from, { text: stylishReply(text) }, { quoted: m });
    //const reply = m.reply;
    const sender = m.sender;
    const mek = chatUpdate.messages[0];
    const getGroupAdmins = (participants) => { 
       let admins = []; 
       for (let i of participants) { 
         i.admin === "superadmin" ? admins.push(i.id) : i.admin === "admin" ? admins.push(i.id) : ""; 
       } 
       return admins || []; 
     };
//========================================================================================================================//
//========================================================================================================================//	  
    const nicki = (m.quoted || m); 
    const quoted = (nicki.mtype == 'buttonsMessage') ? nicki[Object.keys(nicki)[1]] : (nicki.mtype == 'templateMessage') ? nicki.hydratedTemplate[Object.keys(nicki.hydratedTemplate)[1]] : (nicki.mtype == 'product') ? nicki[Object.keys(nicki)[0]] : m.quoted ? m.quoted : m; 

    const color = (text, color) => {
      return !color ? chalk.green(text) : chalk.keyword(color)(text);
    };
//========================================================================================================================//	  
    
	  const mime = (quoted.msg || quoted).mimetype || "";
    const qmsg = (quoted.msg || quoted);
    const cmd = body.startsWith(prefix);
    const badword = bad.split(",");

//========================================================================================================================//
//========================================================================================================================//	      
    const needsGroupMetadata = m.isGroup && (
      GROUP_METADATA_COMMANDS.has(command) ||
      (badwordkick === "TRUE" && Boolean(body)) ||
      (antilink === "TRUE" && body.includes("chat.whatsapp.com")) ||
      (antilinkall === "TRUE" && body.includes("https://")) ||
      (antitag === "TRUE" && (m.mentionedJid?.length || 0) > 10)
    );
    const groupMetadata = needsGroupMetadata ? await getGroupMetadataFast(client, m.chat) : null;
    const groupName = groupMetadata?.subject || "";
    const participantJid = participant => client.decodeJid(
      participant?.id || participant?.jid || participant?.pn || ""
    );
    const participants = m.isGroup && groupMetadata
      ? groupMetadata.participants
          .map(participant => ({ ...participant, id: participantJid(participant) }))
          .filter(participant => participant.id)
      : [];
    const groupAdmin = participants
      .filter(participant => participant.admin)
      .map(participant => participant.id);
    const isBotAdmin = m.isGroup
      ? groupAdmin.some(jid => client.decodeJid(jid) === client.decodeJid(botNumber))
      : false;
    const groupSender = m.isGroup && groupMetadata
  ? (() => {
      const found = participants.find(p =>
        p.id === sender || client.decodeJid(p.id) === client.decodeJid(sender)
      );
      return found?.id || client.decodeJid(sender);
    })()
  : sender;
     const isAdmin = m.isGroup
       ? groupAdmin.some(jid => client.decodeJid(jid) === client.decodeJid(groupSender))
       : false;
     const Dev = '254769365617'.split(",");
     const senderDigitsList = [...senderAlternates, ...normalizedSenderJids]
       .map(jid => String(jid).split("@")[0].split(":")[0].replace(/[^0-9]/g, ""))
       .filter(Boolean);
     const ownerDigits = String(groupSender || "").split("@")[0].replace(/[^0-9]/g, "");
     const isDeveloper = Dev.some((v) => senderDigitsList.includes(v.replace(/[^0-9]/g, "")));
     const Owner = itsMe || isDeveloper || DevRaven.some((v) => v.replace(/[^0-9]/g, "") === ownerDigits);
     const date = new Date()  
     const timestamp = speed(); 
     const Rspeed = speed() - timestamp 
//========================================================================================================================//
//========================================================================================================================//
 const baseDir = path.join(__dirname, "message_data");
function stylishReply(text) {
    return `\`\`\`\n${text}\n\`\`\``;
}
function loadChatData(remoteJid, messageId) {
  const chatFilePath = path.join(baseDir, remoteJid, `${messageId}.json`);
  try {
    const data = fs.readFileSync(chatFilePath, 'utf8');
    return JSON.parse(data) || [];
  } catch (error) {
    return [];
  }
}

function saveChatData(remoteJid, messageId, chatData) {
  const chatDir = path.join(baseDir, remoteJid);

  if (!fs.existsSync(chatDir)) {
    fs.mkdirSync(chatDir, { recursive: true });
  }

  const chatFilePath = path.join(chatDir, `${messageId}.json`);

  try {
    fs.writeFileSync(chatFilePath, JSON.stringify(chatData, null, 2));
  } catch (error) {
    console.error('Error saving chat data:', error);
  }
}

function handleIncomingMessage(message) {
  const remoteJid = message.key.remoteJid;
  const messageId = message.key.id;

  const chatData = loadChatData(remoteJid, messageId);
  chatData.push(message);
  saveChatData(remoteJid, messageId, chatData);
}

async function handleMessageRevocation(client, revocationMessage) {
  const remoteJid = revocationMessage.key.remoteJid;
  const messageId = revocationMessage.message.protocolMessage.key.id;

  const chatData = loadChatData(remoteJid, messageId);
  const originalMessage = chatData[0];

  if (originalMessage) {
    const deletedBy = revocationMessage.participant || revocationMessage.key.participant || revocationMessage.key.remoteJid;
    const sentBy = originalMessage.key.participant || originalMessage.key.remoteJid;

    const deletedByFormatted = `@${deletedBy.split('@')[0]}`;
    const sentByFormatted = `@${sentBy.split('@')[0]}`;

    if (deletedBy.includes(client.user.id) || sentBy.includes(client.user.id)) return;

    let notificationText = `░ 🛒 ANTIDELETE 🛒 ░\n\n` +
      ` 𝗗𝗲𝗹𝗲𝘁𝗲𝗱 𝗯𝘆 : ${deletedByFormatted}\n\n`;

    try {
      if (originalMessage.message?.conversation) {
        // Text message
        const messageText = originalMessage.message.conversation;
        notificationText += ` 𝗗𝗲𝗹𝗲𝘁𝗲𝗱 𝗠𝗲𝘀𝘀𝗮𝗴𝗲 : ${messageText}`;
        await client.sendMessage(client.user.id, { text: stylishReply(notificationText) });
      } 
      else if (originalMessage.message?.extendedTextMessage) {
        // Extended text message (quoted messages)
        const messageText = originalMessage.message.extendedTextMessage.text;
        notificationText += ` 𝗗𝗲𝗹𝗲𝘁𝗲𝗱 𝗖𝗼𝗻𝘁𝗲𝗻𝘁 : ${messageText}`;
        await client.sendMessage(client.user.id, { text: stylishReply(notificationText) });
      }
      else if (originalMessage.message?.imageMessage) {
        // Image message
        notificationText += ` 𝗗𝗲𝗹𝗲𝘁𝗲𝗱 𝗠𝗲𝗱𝗶𝗮 : [Image]`;
        try {
          const buffer = await client.downloadMediaMessage(originalMessage.message.imageMessage);
          await client.sendMessage(client.user.id, { 
            image: buffer,
	    caption: stylishReply(`${notificationText}\n\nImage caption: ${originalMessage.message.imageMessage.caption}`)
          });
        } catch (mediaError) {
          console.error('Failed to download image:', mediaError);
          notificationText += `\n\n⚠️ Could not recover deleted image (media expired)`;
          await client.sendMessage(client.user.id, { text: stylishReply(notificationText) });
        }
      } 
      else if (originalMessage.message?.videoMessage) {
        // Video message
        notificationText += ` 𝗗𝗲𝗹𝗲𝘁𝗲𝗱 𝗠𝗲𝗱𝗶𝗮 : [Video]`;
        try {
          const buffer = await client.downloadMediaMessage(originalMessage.message.videoMessage);
          await client.sendMessage(client.user.id, { 
            video: buffer, 
            caption: stylishReply(`${notificationText}\n\nVideo caption: ${originalMessage.message.videoMessage.caption}`)
          });
        } catch (mediaError) {
          console.error('Failed to download video:', mediaError);
          notificationText += `\n\n⚠️ Could not recover deleted video (media expired)`;
          await client.sendMessage(client.user.id, { text: stylishReply(notificationText) });
        }
      } else if (originalMessage.message?.stickerMessage) {
	 notificationText += ` 𝗗𝗲𝗹𝗲𝘁𝗲𝗱 𝗠𝗲𝗱𝗶𝗮 : [Sticker]`;
      // Sticker message
      const buffer = await client.downloadMediaMessage(originalMessage.message.stickerMessage);      
      await client.sendMessage(client.user.id, { sticker: buffer, 
contextInfo: {
          externalAdReply: {
          title: notificationText,
          body: `DELETED BY : ${deletedByFormatted}`,
          thumbnailUrl: "https://files.catbox.moe/b15b6u.jpg",
          sourceUrl: '',
          mediaType: 1,
          renderLargerThumbnail: true
          }}});
      } else if (originalMessage.message?.documentMessage) {
        notificationText += ` 𝗗𝗲𝗹𝗲𝘁𝗲𝗱 𝗠𝗲𝗱𝗶𝗮 : [Document]`;
        // Document message
        const docMessage = originalMessage.message.documentMessage;
        const fileName = docMessage.fileName || `document_${Date.now()}.dat`;
        console.log('Attempting to download document...');
        const buffer = await client.downloadMediaMessage(docMessage);
        
       if (!buffer) {
            console.log('Download failed - empty buffer');
            notificationText += ' (Download Failed)';
            return;
        }
        
        console.log('Sending document back...');
        await client.sendMessage(client.user.id, { 
            document: buffer, 
            fileName: fileName,
            mimetype: docMessage.mimetype || 'application/octet-stream',
contextInfo: {
          externalAdReply: {
          title: notificationText,
          body: `DELETED BY: \n\n ${deletedByFormatted}`,
          thumbnailUrl: "https://files.catbox.moe/rl4qpe.jpg",
          sourceUrl: '',
          mediaType: 1,
          renderLargerThumbnail: true
          }}});
      } else if (originalMessage.message?.audioMessage) {
	      notificationText += ` 𝗗𝗲𝗹𝗲𝘁𝗲𝗱 𝗠𝗲𝗱𝗶𝗮: \n\n [Audio]`;
      // Audio message
      const buffer = await client.downloadMediaMessage(originalMessage.message.audioMessage);
      const isPTT = originalMessage.message.audioMessage.ptt === true;
      await client.sendMessage(client.user.id, { audio: buffer, ptt: isPTT, mimetype: 'audio/mpeg', 
contextInfo: {
          externalAdReply: {
          title: notificationText,
          body: `DELETED BY: \n\n ${deletedByFormatted}`,
          thumbnailUrl: "https://files.catbox.moe/b15b6u.jpg",
          sourceUrl: '',
          mediaType: 1,
          renderLargerThumbnail: true
          }}});
      }	      
    } catch (error) {
      console.error('Error handling deleted message:', error);
      notificationText += `\n\n⚠️ Error recovering deleted content 😓`;
      await client.sendMessage(client.user.id, { text: stylishReply(notificationText) });
    }
  }
}
//========================================================================================================================//
//========================================================================================================================//	  
    // Push Message To Console
    let argsLog = budy.length > 30 ? `${q.substring(0, 30)}...` : budy;
	  
//========================================================================================================================//
const Grace = mek.key.remoteJid;
if (cmd && wapresence === 'online') { 
             client.sendPresenceUpdate('available', Grace);
	
} else if (cmd && wapresence === 'typing') { 
             client.sendPresenceUpdate('composing', Grace);
	
      }	else if (cmd && wapresence === 'recording') { 
             client.sendPresenceUpdate('recording', Grace);
             
    } else if (cmd) {
             client.sendPresenceUpdate('unavailable', Grace);
    }
//========================================================================================================================//    
if (cmd && mode === 'PRIVATE' && !Owner) {
return;
}
//========================================================================================================================//	  
//========================================================================================================================//	  
if (autoread === 'TRUE' && !m.isGroup) { 
             client.readMessages([m.key])
    }
      if (itsMe && mek.key.id.startsWith("BAE5") && mek.key.id.length === 16 && !m.isGroup) return;
//========================================================================================================================//
//========================================================================================================================//

  client.sendContact = async (jid, numbers, quoted, options = {}) => {
    const { labels = {}, displayName, ...messageOptions } = options;
    const contactNumbers = Array.isArray(numbers) ? numbers : [numbers];
    const contacts = await Promise.all(contactNumbers.map(async number => {
      const phone = String(number).replace(/[^0-9+]/g, "");
      const label = labels[phone] ||
        (typeof client.getName === "function"
          ? await Promise.resolve(client.getName(`${phone}@s.whatsapp.net`))
          : "") || phone;
      return {
        displayName: label,
        vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:${label}\nTEL;type=CELL;type=VOICE;waid=${phone}:${phone}\nEND:VCARD`
      };
    }));
    return client.sendMessage(jid, {
      contacts: { displayName: displayName || contacts.map(contact => contact.displayName).join(" and "), contacts },
      ...messageOptions
    }, { quoted });
  };

  if (antibot === "TRUE" && mek.key?.id?.startsWith("BAE5") && m.isGroup && !isAdmin && isBotAdmin) {
    const botMessageSender = m.sender;
    await client.sendMessage(m.chat, {
      text: `BLACK DEMON BOT detected an unnecessary bot message from @${botMessageSender.split("@")[0]}.`,
      mentions: [botMessageSender]
    }, { quoted: m });
    await client.groupParticipantsUpdate(m.chat, [botMessageSender], "remove");
  }


//========================================================================================================================//
//========================================================================================================================//	  
/*if (budy.startsWith('>')) { 
   if (!Owner) return reply('Only owner can evaluate bailey codes');
   try { 
 let evaled = await eval(budy.slice(2)); 
 if (typeof evaled !== 'string') evaled = require('util').inspect(evaled); 
 await reply(evaled); 
   } catch (err) { 
 await reply(String(err)); 
   } 
 } 
//========================================================================================================================// 
async function mp3d () {	
let { key } = await client.sendMessage(m.chat, {audio: fs.readFileSync('./Media/wutiwant.mp3'), mimetype:'audio/mp4', ptt: true}, {quoted: m })

}
//========================================================================================================================// 

	async function mp4d () {	
let { key } = await client.sendMessage(m.chat, {video: fs.readFileSync('./Media/get_rich.mp4'), mimetype:'video/mp4', ptt: true}, {quoted: m })

	}  */
//=======================================================================================================================
//========================================================================================================================// 
    if (gptdm === 'TRUE' && m.chat.endsWith("@s.whatsapp.net")) {
	    
try {
  const { default: Gemini } = await import('gemini-ai');

        const gemini = new Gemini("AIzaSyDJUtskTG-MvQdlT4tNE319zBqLMFei8nQ");
        const chat = gemini.createChat();

        const res = await chat.ask(text);

        await m.reply(res);
    } catch (e) {
        m.reply("I am unable to generate responses\n\n" + e);
    }
}
//========================================================================================================================//
if (antitag === 'TRUE' && !Owner && isBotAdmin && !isAdmin && m.mentionedJid && m.mentionedJid.length > 10) {
        if (itsMe) return;

        const cate = m.sender;

        await client.sendMessage(m.chat, {
            text: `@${cate.split("@")[0]}, Antitag is Active🔨`,
            contextInfo: { mentionedJid: [cate] }
        }, { quoted: m });

        await client.sendMessage(m.chat, {
            delete: {
                remoteJid: m.chat,
                fromMe: false,
                id: m.key.id,
                participant: cate            }
        });
        await client.groupParticipantsUpdate(m.chat, [cate], "remove");
    }
//========================================================================================================================//
//========================================================================================================================//	  
async function loading () {
var lod = [
"🖤",
"🤬",
"❤",	
	"✅",
" ```🩸Checking responce```"	
]
let { key } = await client.sendMessage(from, {text:('Latency')})

for (let i = 0; i < lod.length; i++) {
await client.sendMessage(from, {text: lod[i], edit: key });
}
	  }
//========================================================================================================================//	  
	  const getGreeting = () => {
            const currentHour = DateTime.now().setZone('Africa/Nairobi').hour;

            if (currentHour >= 5 && currentHour < 12) {
                return 'Good Morning 🌅';
            } else if (currentHour >= 12 && currentHour < 16) {
                return 'Good Afternoon ☀️';
            } else if (currentHour >= 16 && currentHour < 20) {
                return 'Good Evening 🌇';
            } else {
                return 'Good Night 😴';
            }
        };
//========================================================================================================================//
//========================================================================================================================//
        const getCurrentTimeInNairobi = () => {
            return DateTime.now().setZone('Africa/Nairobi').toLocaleString(DateTime.TIME_SIMPLE);
        };
//========================================================================================================================//	
if (badwordkick === 'TRUE' && isBotAdmin && !isAdmin && body && (new RegExp('\\b' + badword.join('\\b|\\b') + '\\b')).test(body.toLowerCase())) {
	
       reply("Hey niggah.\n\nMy owner hates usage of bad words in my presence!")
                 
     client.groupParticipantsUpdate(from, [sender], 'remove')
            
          }
//========================================================================================================================//	  
    if (antilink === 'TRUE' && body.includes('chat.whatsapp.com') && !Owner && isBotAdmin && !isAdmin && m.isGroup) { 
  
 kid = m.sender; 
  
 client.sendMessage(m.chat, { 
  
                delete: { 
                   remoteJid: m.chat, 
                   fromMe: false, 
                   id: m.key.id, 
                   participant: kid 
                } 
             }).then(() => client.groupParticipantsUpdate(m.chat, [kid], 'remove')); 
 client.sendMessage(m.chat, {text:`Hey @${kid.split("@")[0]}👋\n\nSending Group links is Prohibited in this Group !`, contextInfo:{mentionedJid:[kid]}}, {quoted:m}); 
       }   
//========================================================================================================================//
if (antilinkall === 'TRUE' && body.includes('https://') && !Owner && isBotAdmin && !isAdmin && m.isGroup) { 
  
 ki = m.sender; 
  
 client.sendMessage(m.chat, { 
  
                delete: { 
                   remoteJid: m.chat, 
                   fromMe: false, 
                   id: m.key.id, 
                   participant: ki
                } 
             }).then(() => client.groupParticipantsUpdate(m.chat, [ki], 'remove')); 
 client.sendMessage(m.chat, {text:`𝗛𝗲𝘆 @${ki.split("@")[0]}👋\n\nSending Group links is Prohibited in this Group !`, contextInfo:{mentionedJid:[ki]}}, {quoted:m}); 
       }   
  
  //========================================================================================================================//
  //========================================================================================================================//

    if (cmd && !m.isGroup) {
      console.log(chalk.black(chalk.bgWhite("[ BLACK DEMON ♠♣]")), color(argsLog, "turquoise"), chalk.magenta("From"), chalk.green(pushname), chalk.yellow(`[ ${m.sender.replace("@s.whatsapp.net", "")} ]`));
    } else if (cmd && m.isGroup) {
      console.log(
        chalk.black(chalk.bgWhite("[ LOGS ]")),
        color(argsLog, "turquoise"),
        chalk.magenta("From"),
        chalk.green(pushname),
        chalk.yellow(`[ ${m.sender.replace("@s.whatsapp.net", "")} ]`),
        chalk.blueBright("IN"),
        chalk.green(groupName)
      );
    }

//========================================================================================================================//

	// Your platform detection function
function detectPlatform() {
  if (process.env.DYNO) return "Heroku";
  if (process.env.RENDER) return "Render";
  if (process.env.PREFIX && process.env.PREFIX.includes("termux")) return "Termux";
  if (process.env.PORTS && process.env.CYPHERX_HOST_ID) return "CypherX Platform";
  if (process.env.P_SERVER_UUID) return "Panel";
  if (process.env.LXC) return "Linux Container (LXC)";

  switch (os.platform()) {
    case "win32":
      return "Windows";
    case "darwin":
      return "macOS";
    case "linux":
      return "Linux";
    default:
      return "Unknown";
  }
}
const host = detectPlatform();
const caseFile = path.join(__dirname, 'blacks.js');
const caseContent = fs.readFileSync(caseFile, 'utf8');
const totalCommands = MENU_COMMANDS.size - 1; // exclude the menu command itself

	  //==========================================nairobi===
	 
	  
//========================================================================================================================//

   if (cmd) {
  
      switch (command) {
        case "menu":
		     
		      

let cap = `
 High there😊,
 ${getGreeting()}\n\n【BLACK-DEMON
 ⚡ 𝙹𝙸𝙽𝚆𝙸𝙸𝙻𝚃𝙴𝙲𝙷𝚅 ⚡         
 ───────────────────────╢
 ✦ User: ${m.pushName}
 ✦ Prefix : ${prefix}
 ✦ Mode: ${mode}
 ✦ Speed: ${Rspeed.toFixed(4)} Ms
 ✦ Time: ${getCurrentTimeInNairobi()} on ${date.toLocaleString('en-US', { weekday: 'long', timeZone: 'Africa/Nairobi'})} 
 ✦ Server: ${host}
 ✦ Commands: ${totalCommands}
 ════════════════════╣
 Jinwiil Onginjo      
 ════════════════════╣
  ══════════════════════════╗
  BOT STATUS
  ══════════════════════════╣
  📶 ping
  ══════════════════════════╝

 ══════════════════════════╗
 DOUNLOAD MENU   
 ══════════════════════════╣  
 🎬 video
 🎬 ytmp4
 📱 fbdl
 🎬 movie
 🎵 ytmp3
 🎥 tiktok
 🎵 song
 🎶 song2
 🎧 play
 🎤 play2
 📹 yts
 🎙 spotify
 📷 imgsearch
 📁 web2zip
 🐦 twitter
 📌 pinterest
 🎼 lyrics
 📸 insta
 ═══════════════════════════╝

 ═══════════════════════════╗
 EDIT MODULES    
 ═══════════════════════════╣
 🖼 sticker
 📷 photo
 🔄 retrieve
 🎬 vv2
 🎬 vv3
 😍 view-once → bot DM
 🎚 mix
 🐦 tweet
 🎭 smeme
 🎥 mp4
 🎬 vv
 📸 screenshots
 ✂ take
 ═══════════════════════════╝

 ═══════════════════════════╗
 GROUP MANAGEMENT
 ═══════════════════════════╣
 ✅ approve
 ⬆ promote
 🗑 delete
 🔒 close
 ⏰ closetime
 🔕 disp-off
 🔔 disp-1
 🔔 disp-7
 🔔 disp-90
 🖼 icon
 ✏ subject
 🚪 leave
 @ tagall
 🔄 revoke
 🔊 unmute
 ❌ reject
 ⬇ demote
 🚪 remove
 🌍 foreigners
 🔓 open
 ⏳ opentime
 📋 gcprofile
 📝 desc
 ➕ add
 👻 hidetag
 🔇 mute
 ══════════════════════════╝

 ══════════════════════════╗
 AI MODULES      
 ══════════════════════════╣
 🤖 ai
 🧠 ai2
 👁 vision
 💎 gemini
 🗣 gpt
 🗣 gpt2
 🗣 gpt3
 🗣 gpt4
 📖 define
 🔍 google
 🏸 dalle
 ══════════════════════════╝
 ══════════════════════════╗
	 OWNER COMMANDS
	 ══════════════════════════╣
	  👑 owner
	 🛠 dev
	 🔄 restart
 📢 cast
 ➕ join
 ♻ redeploy
 ⚙ setvar
 🖼 fullpp
 ✅ unlock
 👑 admin
 📢 broadcast
 📊 getvar
 🔄 update
 🤖 botpp
 ⛔ block
 💾 save
 ══════════════════════════╝

 ══════════════════════════╗
 TOOLS && UTILITIES 
 ══════════════════════════╣
 🔒 encrypt
 🌦 weather
 📥 gitclone
 🖼 removebg
 🔊 tts
 ℹ facts
 💬 quotes
 🔍 inspect
 📊 github
 💡 advice
 🎨 remin
 🌐 trt
 😺 catfact
 💘 pickupline
 ❔ define
 ═══════════════════════════╝
 
 ══════════════════════════╗
 LOGO MAKER   
 ══════════════════════════╣
 😸 cat
 🧱 golg
 👩🏾‍🎤 child
  ═══════════════════════════╝
  
 ═══════════════════════════╗
 ASSORTED ITEMS
 ═══════════════════════════╣
 👫 pair
 💳 credits
 📤 upload
 📎 attp
 🔗 url
 🔡fancy
 🖼 image
 💻 system
 🤖 jinwiilvmd
 ═══════════════════════════╝

 Made By Jinwiil Tech
 Made with Love😘
 Owner:${Dev}
 ═══════════════════════════╝`;
		       
if (menu === 'VIDEO') {

                   client.sendMessage(m.chat, {
                        video: fs.readFileSync('./Media/get_rich.mp4'),
                        caption: stylishReply(cap),
                        gifPlayback: true
                    }, {
                        quoted: m
                    })
                } else if (menu === 'TEXT') {
client.sendMessage(from, { text: stylishReply(cap)}, {quoted: m})

} else if (menu === 'IMAGE') {
client.sendMessage(m.chat, { image: { url: 'https://files.catbox.moe/m38sqm.jpg' }, caption: stylishReply(cap), fileLength: "9999999999"}, { quoted: m })
} else if (menu === 'LINK') {
client.sendMessage(m.chat, {
                        text: stylishReply(cap),
                        contextInfo: {
                            externalAdReply: {
                                showAdAttribution: true,
                                title: `BLACK DEMON 😈`,
                                body: `${runtime(process.uptime())}`,
                                thumbnail: fs.readFileSync('./Media/blackmachant.jpg'),
                                sourceUrl: 'https://wa.me/254769365617?text=Hello👋+Jinwiil+Nihostie+Bot+Mkuu+😔',
                                mediaType: 1,
                                renderLargerThumbnail: true
                            }
                        }
                    }, {
                        quoted: m
                    })

}
break;
		      
//========================================================================================================================//
			  
//========================================================================================================================//
case "advice":
reply(advice());
console.log(advice());

break;
case "facts": {
  try {
    const response = await fetch("https://uselessfacts.jsph.pl/api/v2/facts/random?language=en");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    await m.reply(`💡 ${data.text}`);
  } catch (error) {
    await m.reply("I could not fetch a fact right now. Please try again later.");
  }
}
break;
//========================================================================================================================//		      

case "idch": case "cekidch": {
  if (!text) return reply("Channel link?");
  const match = text.trim().match(/^https?:\/\/whatsapp\.com\/channel\/([^\s/?#]+)/i);
  if (!match) return reply("Link must be valid. Example: .idch https://whatsapp.com/channel/xxxxxxxx");
  if (typeof client.newsletterMetadata !== "function") {
    return reply("This Baileys version does not support WhatsApp Channel metadata lookup.");
  }

  try {
    const result = await client.newsletterMetadata("invite", match[1]);
    const verified = result?.verification === "VERIFIED" ? "Verified" : "Not verified";
    const details = `*CHANNEL INFORMATION*\n\n` +
      `*ID:* ${result?.id || "Unavailable"}\n` +
      `*Name:* ${result?.name || "Unavailable"}\n` +
      `*Followers:* ${result?.subscribers ?? "Unavailable"}\n` +
      `*Status:* ${result?.state || "Unavailable"}\n` +
      `*Verification:* ${verified}`;
    const generated = generateWAMessageFromContent(m.chat, {
      viewOnceMessage: {
        message: {
          messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
          interactiveMessage: {
            body: { text: details },
            footer: { text: "BLACK-DEMON" },
            nativeFlowMessage: {
              buttons: [{
                name: "cta_copy",
                buttonParamsJson: JSON.stringify({
                  display_text: "Copy channel ID",
                  copy_code: result?.id || ""
                })
              }]
            }
          }
        }
      }
    }, { quoted: m });
    await client.relayMessage(generated.key.remoteJid, generated.message, {
      messageId: generated.key.id
    });
  } catch (error) {
    console.error("Channel metadata lookup failed:", error.message);
    return reply(`Unable to read channel metadata: ${error.message}`);
  }
}
break;
case "owner": {
await client.sendContact(from, [...new Set([owner, dev])], m, { labels: { [dev]: "Dev" } })
}
break;

case "dev":
await client.sendContact(from, [dev], m, { labels: { [dev]: "Dev" } })
break;
		      
//========================================================================================================================//
		      case "lyrics2": 
 try { 
 if (!text) return reply("Provide a song name!"); 
 const searches = await Client.songs.search(text); 
 const firstSong = searches[0]; 
 //await client.sendMessage(from, {text: firstSong}); 
 const lyrics = await firstSong.lyrics(); 
 await client.sendMessage(from, { text: lyrics}, { quoted: m }); 
 } catch (error) { 
             reply(`I did not find any lyrics for ${text}. Try searching a different song.`); 
             console.log(error); 
         }
        break;
		      
//========================================================================================================================//	      
	// ================= PLAY2 =================
case 'play2': {
  try {
    const query = args.join(' ').trim();
    if (!query) return reply("⚠️ Usage: .play2 <song name>");
    await reply('🔎 Searching for your song...🔍');
    await sendSearchAudio(client, from, query, m, 'song');
  } catch (err) {
    console.error('play2 error:', err);
    await reply("💥 Download failed: " + err.message);
  }
  break;
}
            // ================= SPOTIFY =================
case 'spotify': {
  try {
    const query = args.join(' ').trim();
    if (!query) return reply("⚠️ Usage: .spotify <song name>");
    await reply('🔎 Searching for your track...🔍');
    await sendSearchAudio(client, from, query, m, 'spotify-track');
  } catch (err) {
    console.error('spotify error:', err);
    await reply("💥 Download failed: " + err.message);
  }
  break;
}
//========================================================================================================================//
case 'song': {
  try {
    if (!args.length) return reply("🎵 Provide a song name or link!");
    await sendSearchAudio(client, m.chat, args.join(" "), m, 'song');
  } catch (error) {
    console.error('song error:', error);
    await reply("❌ Error downloading audio: " + error.message);
  }
}
break;
//========================================================================================================================//
 // ================= IMAGES =================
case "imgsearch":
case "image": {
  const q = args.join(" ") || (m.quoted && m.quoted.text);
  if (!q) return m.reply("❌ Please provide a search query!");
  await reply("🔍 Searching for images...🔎");
  try {
    const response = await axios.get("https://apiskeith2-production-3020.up.railway.app/search/images", { params: { query: q }, timeout: 60000 });
    const results = response.data?.result || [];
    const img = results.find(item => item.url || item.image);
    if (!response.data?.status || !img) throw new Error("No images found");
    await client.sendMessage(m.chat, { image: { url: img.url || img.image }, caption: "📸 Details for: *" + q + "*" }, { quoted: m });
  } catch (error) {
    console.error("image search error:", error);
    await m.reply("❌ Image search failed: " + error.message);
  }
  break;
}
//========================================================================================================================//
      case "pair": case "rent":
case "pair": case "rent": {
if (!q) return await reply("Boss please reply with your Whtasapp nummer... Example- pair 25476936XXX");

	try {	
const numbers = q.split(',') .map((v) => v.replace(/[^0-9]/g, '')) 
            .filter((v) => v.length > 5 && v.length < 20); 

   if (numbers.length === 0) {
            return m.reply("Invalid number❌️ Please use the  correct format!");
        }

for (const number of numbers) {
            const whatsappID = number + '@s.whatsapp.net';
    const result = await client.onWhatsApp(whatsappID); 

            if (!result[0]?.exists) {
                return m.reply(`That number is not registered on WhatsApp❗️`);
	    }
	
m.reply("Wait for a moment Black-Demon🎈 is generating your session")
	
        let { data } = await axios(`https://test-pair-cmxx.onrender.com/code?number=${number}`);
        let code = data.code;
		
const Code = ` ${code}`
await sleep(3000);
	
 await m.reply(Code);
	}
    } catch (error) {
        console.error(error);
        await reply("An error occurred. Please try again later.");
    }
};
break;	      
//========================================================================================================================//		      
//========================================================================================================================//
	      case "song2": {
  try {
    if (!text) return m.reply("What song do you want to download?");
    await reply("🎧 Searching for the song... ⏳");
    await sendSearchAudio(client, m.chat, text, m, "song");
  } catch (error) {
    console.error("song2 error:", error);
    await reply("❌ Error downloading audio: " + error.message);
  }
}
break;
//========================================================================================================================//
              case "credits": {
  await m.reply("╔══ BLACK DEMON CREDITS ══╗\n\nOwner: https://github.com/HencillCal\nLibrary: WhiskeySockets Baileys\nhttps://github.com/WhiskeySockets/Baileys\n\nDeveloper: +254769365617\n╚══════════════════════════╝");
}
break;

case 'poll': {
		  let [poll, opt] = text.split("|")

if (text.split("|") < 2)
                return m.reply(`Wrong format::\nExample:- poll who is the best president|Putin, Ruto`);

let options = []
            for (let i of opt.split(',')) {
                options.push(i)
            }
            await client.sendMessage(m.chat, {
                poll: {
                    name: poll,
                    values: options
                }
         
   })

	  }
		break;

//========================================================================================================================//		      
	 
//=========================================================================
			   // ================= PLAY =================
            case 'play': {
  try {
    const query = args.join(' ').trim();
    if (!query) return reply("🎵 Provide a song name!");
    await reply("🎧 Searching for the track... ⏳");
    await sendSearchAudio(client, from, query, m, 'song');
  } catch (error) {
    console.error("play command error:", error);
    await reply("💥 Download failed: " + error.message);
  }
  break;
}
case "inspect": {
		      const fetch = require('node-fetch');
const cheerio = require('cheerio');

    if (!text) return m.reply("Provide a valid web link to fetch! The bot will crawl the website and fetch its HTML, CSS, JavaScript, and any media embedded in it.");

    if (!/^https?:\/\//i.test(text)) {
        return m.reply("Please provide a URL starting with http:// or https://");
    }

    try {
        const response = await fetch(text);
        const html = await response.text();
        const $ = cheerio.load(html);

        const mediaFiles = [];
        $('img[src], video[src], audio[src]').each((i, element) => {
            let src = $(element).attr('src');
            if (src) {
                mediaFiles.push(src);
            }
        });

        const cssFiles = [];
        $('link[rel="stylesheet"]').each((i, element) => {
            let href = $(element).attr('href');
            if (href) {
                cssFiles.push(href);
            }
        });

        const jsFiles = [];
        $('script[src]').each((i, element) => {
            let src = $(element).attr('src');
            if (src) {
                jsFiles.push(src);
            }
        });

        await m.reply(`**Full HTML Content**:\n\n${html}`);

        if (cssFiles.length > 0) {
            for (const cssFile of cssFiles) {
                const cssResponse = await fetch(new URL(cssFile, text));
                const cssContent = await cssResponse.text();
                await m.reply(`**CSS File Content**:\n\n${cssContent}`);
            }
        } else {
            await m.reply("No external CSS files found.");
        }

        if (jsFiles.length > 0) {
            for (const jsFile of jsFiles) {
                const jsResponse = await fetch(new URL(jsFile, text));
                const jsContent = await jsResponse.text();
                await m.reply(`**JavaScript File Content**:\n\n${jsContent}`);
            }
        } else {
            await m.reply("No external JavaScript files found.");
        }

        if (mediaFiles.length > 0) {
            await m.reply(`**Media Files Found**:\n${mediaFiles.join('\n')}`);
        } else {
            await m.reply("No media files (images, videos, audios) found.");
        }

    } catch (error) {
        console.error(error);
        return m.reply("An error occurred while fetching the website content.");
    }
}
	break;

//========================================================================================================================//		      
	      
//========================================================================================================================//		      
	     
//========================================================================================================================//		      
//========================================================================================================================//
//========================================================================================================================//		      
	     
//========================================================================================================================//		      
//========================================================================================================================//
//========================================================================================================================//		      
	      case 'cat': {
		   var mumaker = require("mumaker");
		  if (!text || text == "") { m.reply("Example usage : * " + prefix + "cat Jin");
    return;
  }
  try {
    let nick = await mumaker.ephoto("https://en.ephoto360.com/handwritten-text-on-foggy-glass-online-680.html", text);
    m.reply("*Wait a moment...*");
    await client.sendMessage(m.chat, {
      image: {
        url: nick.image
      },
      caption: `GENERATED BY BLACK DEMON🐈‍⬛`
    }, {
      quoted: m
    });
  } catch (_0x27e2e5) {
    m.reply("🥵🥵 " + _0x27e2e5);
  }
    }
        break;

//========================================================================================================================//		      
//========================================================================================================================//
//========================================================================================================================//		      
              case 'gold': case 'golg': {
	    var mumaker = require("mumaker");
		     
		      if (!text || text == "") {
    m.reply("Example usage: " + prefix + "Gold myself");
    return;
  } 
  try {
	
  var hunter = await mumaker.ephoto("https://en.ephoto360.com/modern-gold-4-213.html", text);
m.reply("*Wait a moment...*");
    await client.sendMessage(m.chat, {
      image: {
        url: hunter.image
      },
      caption: `GENERATED BY BLACK DEMON🐈‍⬛`
    }, {
      quoted: m
    });
  } catch(_0x29ddf9) {
    m.reply("💀💀" + _0x29ddf9);
  }
}
	 break;

//========================================================================================================================//		      
//========================================================================================================================//
//========================================================================================================================//		      
              case 'child': {
	    var mumaker = require("mumaker");
		     
		      if (!text || text == "") {
    m.reply("Example usage: " + prefix + "Child Jin");
    return;
  } 
  try {
	
  var tumba = await mumaker.ephoto("https://en.ephoto360.com/write-text-on-wet-glass-online-589.html", text);
m.reply("*Wait a moment...*");
    await client.sendMessage(m.chat, {
      image: {
        url: tumba.image
      },
      caption: `GENERATED BY BLACK DEMON🐈‍⬛`
    }, {
      quoted: m
    });
  } catch(_0x29ddf) {
    m.reply("💀💀" + _0x29ddf);
  }
	    }
		break;
	
//========================================================================================================================//		      
//========================================================================================================================//	      
//========================================================================================================================//
              case "jinwiiltech": case "jinwiilvmd":
		{
        if (!text) return reply(`Hello I'm BLACK DEMON🐈‍⬛ AI. How can i help u?`);
          let d = await fetchJson(
            `https://bk9.fun/ai/llama?q=${text}`
          );
          if (!d.BK9) {
            return reply(
              "An error occurred while fetching the AI chatbot response. Please try again later."
            );
          } else {
            reply(d.BK9);
          }
      }
                break;
//========================================================================================================================//
case "gpt4":
           {
        if (!text) return reply(`Hello there, what's your question?`);
          let d = await fetchJson(
            `https://bk9.fun/ai/Aoyo?q=${text}`
          );
          if (!d.BK9) {
            return reply(
              "An error occurred while fetching the AI chatbot response. Please try again later."
            );
          } else {
            reply(d.BK9);
          }
		     }
                      break;

//========================================================================================================================//		      
//========================================================================================================================//
//========================================================================================================================//
case "support": {
    // 𝗖𝗢𝗡𝗙𝗜𝗚𝗨𝗥𝗔𝗧𝗜𝗢𝗡 (Framed links)
    const 𝕭𝖑𝖆𝖈𝖐𝖞 = {
        links: {
            group: "https://chat.whatsapp.com/KoK02NUGIdsL0vqY7U9DjY",
            channel: "https://whatsapp.com/channel/0029VaxZbeSDTkJwBgUb9u3N",
            email: "jinwiilerror@gmail.com",
            github: "https://github.com/Finjohns/issues",
            developer: "https://wa.me/254769365617"
        },
        media: {
            banner: "https://files.catbox.moe/rl4qpe.jpg"
        }
    };

    // 𝗩𝗜𝗦𝗨𝗔𝗟 𝗗𝗘𝗦𝗜𝗚𝗡 (With framed links)
    await client.sendPresenceUpdate('composing', m.chat);
    
    const 𝗌𝗎𝗉𝗉𝗈𝗋𝗍𝖬𝖾𝗌𝗌𝖺𝗀𝖾 = `

      𝙹𝙸𝙽𝚆𝙸𝙸𝙻𝚃𝙴𝙲𝙷𝚅   

✧ GROUP » ┏━━━━━━━━━━━━━━━━┓
             ┃ ${𝕭𝖑𝖆𝖈𝖐𝖞.links.group} ┃
             ┗━━━━━━━━━━━━━━━━┛

✧ CHANNEL » ┏━━━━━━━━━━━━━━━━┓
               ┃ ${𝕭𝖑𝖆𝖈𝖐𝖞.links.channel} ┃
               ┗━━━━━━━━━━━━━━━━┛

✧ EMAIL » ┏━━━━━━━━━━━━━━━━┓
             ┃ ${𝕭𝖑𝖆𝖈𝖐𝖞.links.email} ┃
             ┗━━━━━━━━━━━━━━━━┛

✧ GITHUB » ┏━━━━━━━━━━━━━━━━┓
              ┃ ${𝕭𝖑𝖆𝖈𝖐𝖞.links.github} ┃
              ┗━━━━━━━━━━━━━━━━┛

✧ DEVELOPER » ┏━━━━━━━━━━━━━━━━┓
                 ┃ ${𝕭𝖑𝖆𝖈𝖐𝖞.links.developer} ┃
                 ┗━━━━━━━━━━━━━━━━┛

  𝙹𝙸𝙽𝚆𝙸𝙸𝙻𝚃𝙴𝙲𝙷𝚅 
`.trim();

    // 𝗦𝗘𝗡𝗗 𝗠𝗘𝗦𝗦𝗔𝗚𝗘
    await client.sendMessage(m.chat, {
        image: { url: 𝕭𝖑𝖆𝖈𝖐𝖞.media.banner },
        caption: 𝗌𝗎𝗉𝗉𝗈𝗋𝗍𝖬𝖾𝗌𝗌𝖺𝗀𝖾,
        contextInfo: {
            externalAdReply: {
                title: "🅿🆁🅴🅼🅸🆄🅼 🆂🆄🅿🅿🅾🆁🆃",
                body: "BLACK DEMON♠♣ v2.0 | Instant Response",
                thumbnail: { url: 𝕭𝖑𝖆𝖈𝖐𝖞.media.banner },
                sourceUrl: 𝕭𝖑𝖆𝖈𝖐𝖞.links.channel
            }
        }
    });
    break;
}

//========================================================================================================================//		      
//========================================================================================================================//		      
//========================================================================================================================//		      
		      case "gpt2":
		{
        if (!text) return reply(`What's your question ?`);
          let d = await fetchJson(
            `https://bk9.fun/ai/jeeves-chat?q=${text}`
          );
          if (!d.BK9) {
            return reply(
              "An error occurred while fetching the AI chatbot response. Please try again later."
            );
          } else {
            reply(d.BK9);
          }
      }
                break;

//========================================================================================================================//		      
//========================================================================================================================//
//========================================================================================================================//		      
	      case 'trt': case 'translate':{
  	try {
        // Ensure that there is a language code and text to translate
        const args = text.split(' ');
        if (args.length < 2) {
            return m.reply(" Please provide a language code and text to translate !");
        }

        // Extract the language code and the text to translate
        const targetLang = args[0];  // First part is the language code
        const textToTranslate = args.slice(1).join(' ');  // Join the rest as the text to translate

        // Fetch data from the translation API
        const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(textToTranslate)}&langpair=en|${targetLang}`);

        // Check if the response is ok
        if (!response.ok) {
            return m.reply('Failed to fetch data. Please try again later.');
        }

        // Parse the response JSON
        const data = await response.json();

        // Check if the translation is available in the response
        if (!data.responseData || !data.responseData.translatedText) {
            return m.reply('No translation found for the provided text.');
        }

        // Extract the translated text
        const translatedText = data.responseData.translatedText;

        // Prepare the message to send
        const message = ` ${translatedText}`;

        // Send the translated message back to the user
        await client.sendMessage(m.chat, { text: message }, { quoted: m });

    } catch (error) {
        console.error("Error occurred:", error);
        m.reply('An error occurred while fetching the data. Please try again later.\n' + error);
    }
}
    break;

//========================================================================================================================//		      
//========================================================================================================================//
//========================================================================================================================//		      
		      case 'cast': {
    if (!Owner) throw NotOwner;
      if (!m.isGroup) throw group;
    if (!text) return m.reply(`provide a text to cast !`);
    let mem = await participants.filter(v => v.id.endsWith('.net')).map(v => v.id)
    m.reply(`Success in casting the message to contacts\n\nDo not allways use this Command to avoid WA-bans ! `);
    for (let pler of mem) {
    client.sendMessage(pler, { text: q})
     }  
     m.reply(`Casting completed successfully😁`)
      }
      break;

//========================================================================================================================//		      
//========================================================================================================================//
//========================================================================================================================//		      
	      case "image":{
		      var gis = require('g-i-s');
		      if (!text) return m.reply("Provide a text");

    try {
        // Use the 'text' as the search term for images
        gis(text, async (error, results) => {
            if (error) {
                return m.reply("An error occurred while searching for images.\n" + error);
            }

            // Check if results are found
            if (results.length === 0) {
                return m.reply("No images found.");
            }

            // Limit the number of images to send (e.g., 5)
            const numberOfImages = Math.min(results.length, 5);
            const imageUrls = results.slice(0, numberOfImages).map(result => result.url);

            // Send the images
            const messages = imageUrls.map(url => ({
                image: { url },
                caption: `Downloaded by ${botname}`
            }));

            for (const message of messages) {
                await client.sendMessage(m.chat, message, { quoted: m });
            }
        });
    } catch (e) {
        m.reply("An error occurred.\n" + e);
    }
}
	break;

//========================================================================================================================//		      
//========================================================================================================================//
//========================================================================================================================//		      
	      case "foreigners": {
	if (!m.isGroup) throw group;	      
	if (!isAdmin) throw admin;
	if (!isBotAdmin) throw botAdmin;
		      
		let _0x2f8982 = participants.filter(_0x3c9d8b => !_0x3c9d8b.admin).map(_0x1db3fb => _0x1db3fb.id).filter(_0x475052 => !_0x475052.startsWith(mycode) && _0x475052 != client.decodeJid(client.user.id));
    if (!args || !args[0]) {
      if (_0x2f8982.length == 0) {
        return m.reply("No foreigners detected.");
      }
      let _0x2d7d67 = `𝗙𝗼𝗿𝗲𝗶𝗴𝗻𝗲𝗿𝘀 𝗮𝗿𝗲 𝗺𝗲𝗺𝗯𝗲𝗿𝘀 𝘄𝗵𝗼𝘀𝗲 𝗰𝗼𝘂𝗻𝘁𝗿𝘆 𝗰𝗼𝗱𝗲 𝗶𝘀 𝗻𝗼𝘁 ${mycode}. 𝗧𝗵𝗲 𝗳𝗼𝗹𝗹𝗼𝘄𝗶𝗻𝗴  ${_0x2f8982.length} 𝗳𝗼𝗿𝗲𝗶𝗴𝗻𝗲𝗿𝘀 𝘄𝗲𝗿𝗲 𝗱𝗲𝘁𝗲𝗰𝘁𝗲𝗱:- \n`;
      for (let _0x28761c of _0x2f8982) {
        _0x2d7d67 += `𓅂 @${_0x28761c.split("@")[0]}\n`;
      }
      _0x2d7d67 += `\n𝗧𝗼 𝗿𝗲𝗺𝗼𝘃𝗲 𝘁𝗵𝗲𝗺 𝘀𝗲𝗻𝗱 foreigners -x`;
      client.sendMessage(m.chat, {
        text: _0x2d7d67,
        mentions: _0x2f8982
      }, {
        quoted: m
      });
    } else if (args[0] == "-x") {
      setTimeout(() => {
        client.sendMessage(m.chat, {
          text: `BLACK DEMOZ 𝘄𝗶𝗹𝗹 𝗻𝗼𝘄 𝗿𝗲𝗺𝗼𝘃𝗲 𝗮𝗹𝗹 ${_0x2f8982.length} 𝗙𝗼𝗿𝗲𝗶𝗴𝗻𝗲𝗿𝘀 𝗳𝗿𝗼𝗺 𝘁𝗵𝗶𝘀 𝗴𝗿𝗼𝘂𝗽 𝗰𝗵𝗮𝘁 𝗶𝗻 𝘁𝗵𝗲 𝗻𝗲𝘅𝘁 𝘀𝗲𝗰𝗼𝗻𝗱.\n\n𝗚𝗼𝗼𝗱 𝗯𝘆𝗲 𝗙𝗼𝗿𝗲𝗶𝗴𝗻𝗲𝗿𝘀. 𝗧𝗵𝗶𝘀 𝗽𝗿𝗼𝗰𝗲𝘀𝘀 𝗰𝗮𝗻𝗻𝗼𝘁 𝗯𝗲 𝘁𝗲𝗿𝗺𝗶𝗻𝗮𝘁𝗲𝗱⚠️`
        }, {
          quoted: m
        });
        setTimeout(() => {
          client.groupParticipantsUpdate(m.chat, _0x2f8982, "remove");
          setTimeout(() => {
            m.reply("𝗔𝗻𝘆 𝗿𝗲𝗺𝗮𝗶𝗻𝗶𝗻𝗴 𝗙𝗼𝗿𝗲𝗶𝗴𝗻𝗲𝗿 ?🌚.");
          }, 1000);
        }, 1000);
      }, 1000);
    }
  }
	break;

//========================================================================================================================//
	      case 'dalle': {
  if (!text) return m.reply(`*This command generates images from text prompts*\n\n*𝙴xample usage*\n*${prefix + command} Beautiful anime girl*\n*${prefix + command} girl in pink dress*`);
  try {
  	m.reply('Please wait, i am generating your image...')
    const endpoint = `https://www.arch2devs.ct.ws/api/fluxaws?query=${encodeURIComponent(text)}`
    const response = await fetch(endpoint)
    if (response.ok) {
      const imageBuffer = await response.buffer()
      await client.sendMessage(m.chat, { image: imageBuffer }, {quoted: m})
    } else {
      throw '*Aarrhhhg Image generation failed*';
    }
  } catch {
    m.reply('Oops! Something went wrong while generating your image. Please try again later.')
  }
		      }
		 break;

//========================================================================================================================//		      
//========================================================================================================================//		      
//========================================================================================================================//		      
		      case "ai": {
			      const {
    GoogleGenerativeAI: _0x817910
  } = require("@google/generative-ai");
  const _0xc0423b = require("axios");
		      
  try {
    if (!m.quoted) {
      return m.reply("𝗤𝘂𝗼𝘁𝗲 𝗮𝗻 𝗶𝗺𝗮𝗴𝗲 𝘄𝗶𝘁𝗵 𝘁𝗵𝗲 𝗶𝗻𝘀𝘁𝗿𝘂𝗰𝘁𝗶𝗼𝗻𝘀 𝗲𝗵!");
    }
    if (!text) {
      return m.reply("𝗣𝗿𝗼𝘃𝗶𝗱𝗲 𝘀𝗼𝗺𝗲 𝗶𝗻𝘀𝘁𝗿𝘂𝗰𝘁𝗶𝗼𝗻𝘀 𝗲𝗵! 𝗧𝗵𝗶𝘀 𝗶𝘀 BLACK DEMON, 𝘂𝘀𝗶𝗻𝗴 𝗴𝗲𝗺𝗶𝗻𝗶-𝗽𝗿𝗼-𝘃𝗶𝘀𝗶𝗼𝗻 𝘁𝗼 𝗮𝗻𝗮𝗹𝘆𝘀𝗲 𝗶𝗺𝗮𝗴𝗲𝘀.");
    }
    if (!/image/.test(mime)) {
      return m.reply("𝗛𝘂𝗵 𝘁𝗵𝗶𝘀 𝗶𝘀 𝗻𝗼𝘁 𝗮𝗻 𝗶𝗺𝗮𝗴𝗲! 𝗣𝗹𝗲𝗮𝘀𝗲 𝗧𝗮𝗴 𝗮𝗻 𝗶𝗺𝗮𝗴𝗲 𝘄𝗶𝘁𝗵 𝘁𝗵𝗲 𝗶𝗻𝘀𝘁𝗿𝘂𝗰𝘁𝗶𝗼𝗻𝘀 𝗲𝗵 !");
    }
    let _0x3439a2 = await client.downloadAndSaveMediaMessage(m.quoted);
    let _0x3dfb7c = await uploadToCatbox(_0x3439a2);
    m.reply("𝗔 𝗺𝗼𝗺𝗲𝘁, 𝗹𝗲𝗺𝗺𝗲 𝗮𝗻𝗮𝗹𝘆𝘀𝗲 𝘁𝗵𝗲 𝗰𝗼𝗻𝘁𝗲𝗻𝘁𝘀 𝗼𝗳 𝘁𝗵𝗲 𝗜𝗺𝗮𝗴𝗲...");
    const _0x4e9e6a = new _0x817910("AIzaSyDJUtskTG-MvQdlT4tNE319zBqLMFei8nQ");
    async function _0x309a3c(_0x1400ed, _0x1a081e) {
      const _0x53e4b2 = {
        responseType: "arraybuffer"
      };
      const _0x1175d9 = await _0xc0423b.get(_0x1400ed, _0x53e4b2);
      const _0x2a4862 = Buffer.from(_0x1175d9.data).toString("base64");
      const _0x2f6e31 = {
        data: _0x2a4862,
        mimeType: _0x1a081e
      };
      const _0x14b65d = {
        inlineData: _0x2f6e31
      };
      return _0x14b65d;
    }
    const _0x22a6bb = {
      model: "gemini-1.5-flash"
    };
    const _0x42849d = _0x4e9e6a.getGenerativeModel(_0x22a6bb);
    const _0x2c743f = [await _0x309a3c(_0x3dfb7c, "image/jpeg")];
    const _0xcf53e3 = await _0x42849d.generateContent([text, ..._0x2c743f]);
    const _0x195f9c = await _0xcf53e3.response;
    const _0x3db5a3 = _0x195f9c.text();
    await m.reply(_0x3db5a3);
  } catch (_0x4b3921) {
    m.reply("I am unable to analyze images at the moment\n" + _0x4b3921);
  }
}
 break;

//========================================================================================================================//		      
//========================================================================================================================//
//========================================================================================================================//		      
	      case "ai2": {
		const axios = require("axios");

try {

if (!m.quoted) return m.reply("Send the image then tag it with the instruction.");

if (!text) return m.reply("𝗣𝗿𝗼𝘃𝗶𝗱𝗲 𝘀𝗼𝗺𝗲 𝗶𝗻𝘀𝘁𝗿𝘂𝗰𝘁𝗶𝗼𝗻𝘀 𝗲𝗵! 𝗧𝗵𝗶𝘀 Back Demon  𝗨𝘀𝗲 𝗚𝗲𝗺𝗶𝗻𝗶-𝗽𝗿𝗼-𝘃𝗶𝘀𝗶𝗼𝗻 𝘁𝗼 𝗮𝗻𝗮𝗹𝘆𝘀𝗲 𝗶𝗺𝗮𝗴𝗲𝘀.");



   if (!/image/.test(mime)) return m.reply("That is not an image, try again while quoting an actual image.");             

let fdr = await client.downloadAndSaveMediaMessage(m.quoted)


                    let fta = await uploadToCatbox(fdr)
                    m.reply("𝗔 𝗠𝗼𝗺𝗲𝗻𝘁, Gvg [Blacks Demon] 𝗶𝘀 𝗮𝗻𝗮𝗹𝘆𝘇𝗶𝗻𝗴 𝘁𝗵𝗲 𝗰𝗼𝗻𝘁𝗲𝗻𝘁𝘀 𝗼𝗳 𝘁𝗵𝗲 𝗶𝗺𝗮𝗴𝗲. . .");


const data = await fetchJson(`https://api.dreaded.site/api/gemini-vision?url=${fta}&instruction=${text}`);

let res = data.result

await m.reply(res);

  

} catch (e) {

m.reply("I am unable to analyze images at the moment\n" + e)

}
	      }
		break;

//========================================================================================================================//		      

//========================================================================================================================//		      
	      case "vision": {
		      if (!msgR || !text) {
    m.reply("𝗤𝘂𝗼𝘁𝗲 𝗮𝗻 𝗶𝗺𝗮𝗴𝗲 𝗮𝗻𝗱 𝗴𝗶𝘃𝗲 𝘀𝗼𝗺𝗲 𝗶𝗻𝘀𝘁𝗿𝘂𝗰𝘁𝗶𝗼𝗻𝘀 , 𝗶 𝘂𝘀𝗲 𝗕𝗮𝗿𝗱 𝘁𝗼 𝗮𝗻𝗮𝗹𝘆𝘇𝗲 𝗶𝗺𝗮𝗴𝗲𝘀.");
    return;
  }
  ;
  let _0x44b3e0;
  if (msgR.imageMessage) {
    _0x44b3e0 = msgR.imageMessage;
  } else {
    m.reply("𝗛𝘂𝗵, 𝗧𝗵𝗮𝘁'𝘀 𝗻𝗼𝘁 𝗮𝗻 𝗶𝗺𝗮𝗴𝗲, 𝗦𝗲𝗻𝗱 𝗮𝗻 𝗶𝗺𝗮𝗴𝗲 𝘁𝗵𝗲𝗻 𝘁𝗮𝗴 𝗶𝘁 𝘄𝗶𝘁𝗵 𝘁𝗵𝗲 𝗶𝗻𝘀𝘁𝗿𝘂𝗰𝘁𝗶𝗼𝗻𝘀 !");
    return;
  }
  ;
  try {
    let _0x11f50e = await client.downloadAndSaveMediaMessage(_0x44b3e0);
    let _0x45392d = await uploadToCatbox(_0x11f50e);
    m.reply("𝗔 𝗺𝗼𝗺𝗲𝗻𝘁, 𝗟𝗲𝗺𝗺𝗲 𝗮𝗻𝗮𝗹𝘆𝘇𝗲 𝘁𝗵𝗲 𝗰𝗼𝗻𝘁𝗲𝗻𝘁𝘀 𝗼𝗳 𝘁𝗵𝗲 𝗶𝗺𝗮𝗴𝗲. . .");
    let _0x4f137e = await (await fetch("https://bk9.fun/ai/geminiimg?url=" + _0x45392d + "&q=" + text)).json();
    const _0x4bfd63 = {
      text: _0x4f137e.BK9
    };
    await client.sendMessage(m.chat, _0x4bfd63, {
      quoted: m
    });
  } catch (_0x1be711) {
    m.reply("An error occured\n" + _0x1be711);
  }
}
	 break;

//========================================================================================================================//		      
//========================================================================================================================//
//========================================================================================================================//		      
              case 'remini': case 'remin': {
			if (!quoted) return reply(`𝗪𝗵𝗲𝗿𝗲 𝗶𝘀 𝘁𝗵𝗲 𝗶𝗺𝗮𝗴𝗲 ?`)
			if (!/image/.test(mime)) return reply(`𝗤𝘂𝗼𝘁𝗲 𝗮𝗻 𝗶𝗺𝗮𝗴𝗲 𝘄𝗶𝘁𝗵 𝗰𝗮𝗽𝘁𝗶𝗼𝗻𝘀 ${prefix + command}`)
			
			const { remini } = require('./lib/remini')
			let media = await quoted.download()
			let proses = await remini(media, "enhance")
			client.sendMessage(m.chat, { image: proses, caption: '𝗚𝗲𝗻𝗲𝗿𝗮𝘁𝗲𝗱 𝗯𝘆 𝙹𝙸𝙽𝚆𝙸𝙸𝙻𝚃𝙴𝙲𝙷𝚅'}, { quoted: m })
			}
			break;

//========================================================================================================================//		      
	      case "kill2": case "kickall2": {
	if (!Owner) throw NotOwner;

    if (!text) {
      return m.reply("Provide a valid group link. Ensure the bot is in that group with admin privileges !");
    }

    let groupId;
    let groupName;
    try {
      let inviteCode = args[0].split("https://chat.whatsapp.com/")[1];
      const groupInfo = await client.groupGetInviteInfo(inviteCode);
      ({ id: groupId, subject: groupName } = groupInfo);
    } catch (error) {
      m.reply("Why are you giving me an invalid group link?");
      return;
    }

    try {
      const groupMetadata = await client.groupMetadata(groupId);
      const participants = await groupMetadata.participants;
      let participantIds = participants
        .filter(participant => participant.id !== client.decodeJid(client.user.id))
        .map(participant => participant.id);

      await m.reply("☠️Initializing and Preparing to kill☠️ " + groupName);
      await client.groupSettingUpdate(groupId, "announcement");
      await client.removeProfilePicture(groupId);
      await client.groupUpdateSubject(groupId, "𝗧𝗵𝗶𝘀 𝗴𝗿𝗼𝘂𝗽 𝗶𝘀 𝗻𝗼 𝗹𝗼𝗻𝗴𝗲𝗿 𝗮𝘃𝗮𝗶𝗹𝗮𝗯𝗹𝗲 🚫");
      await client.groupUpdateDescription(groupId, "//𝗕𝘆 𝘁𝗵𝗲 𝗼𝗿𝗱𝗲𝗿 𝗼𝗳 h 𝗗𝗲𝘃 !");
      await client.groupRevokeInvite(groupId);

      
      await client.sendMessage(
        groupId,
        {
          text: `At this time, My owner has initiated kill command remotely.\nThis has triggered me to remove all ${participantIds.length} group participants in the next second.\n\nGoodbye Everyone! 👋\n\n⚠️THIS PROCESS CANNOT BE TERMINATED⚠️`,
          mentions: participants.map(participant => participant.id)
        });

      await client.groupParticipantsUpdate(groupId, participantIds, "remove");

      const goodbyeMessage = {
        text: "Goodbye Group owner👋\nIt's too cold in Here🥶"
      };
      await client.sendMessage(groupId, goodbyeMessage);

      await client.groupLeave(groupId);
      await m.reply("```Successfully Killed💀```");
    } catch (error) {
      m.reply("```Kill command failed, bot is either not in that group, or not an admin```.");
    }
  }
		      break;

//========================================================================================================================//		      
//========================================================================================================================//		      
//========================================================================================================================//		      
		      case 'carbon': {
		      const fetch = require('node-fetch');

  let cap = `Converted By ${botname}`;

  if (m.quoted && m.quoted.text) {
    const forq = m.quoted.text;

    try {
      let response = await fetch('https://carbonara.solopov.dev/api/cook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: forq,
          backgroundColor: '#1F816D',
        }),
      });

      if (!response.ok) return m.reply('API failed to fetch a valid response.')

      let per = await response.buffer();

      await client.sendMessage(m.chat, { image: per, caption: cap }, { quoted: m });
    } catch (error) {
      m.reply("An error occured\n" + error)
    }
  } else {
    m.reply('Quote a code message');
  }
}
	 break;

//========================================================================================================================//		      
case 'zodiac': {
  if (!text) {
    return reply('Please provide your birth month and date\n*Example:* zodiac 8 23 (for August 23)');
  }

  const input = text.split(' ');
  if (input.length !== 2 || isNaN(input[0]) || isNaN(input[1])) {
    return reply('Incorrect format. Use: month day (e.g. zodiac 5 15 for May 15)');
  }

  const month = parseInt(input[0]);
  const day = parseInt(input[1]);

  // Validate date
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return reply('Invalid date. Please check your month (1-12) and day (1-31)');
  }

  // Determine zodiac sign
  let zodiacSign = '';
  let traits = '';

  if ((month == 3 && day >= 21) || (month == 4 && day <= 19)) {
    zodiacSign = 'Aries';
    traits = 'Adventurous, energetic, courageous, enthusiastic, confident, dynamic, quick-witted';
  } else if ((month == 4 && day >= 20) || (month == 5 && day <= 20)) {
    zodiacSign = 'Taurus';
    traits = 'Patient, reliable, warmhearted, loving, persistent, determined, placid, security loving';
  } else if ((month == 5 && day >= 21) || (month == 6 && day <= 20)) {
    zodiacSign = 'Gemini';
    traits = 'Adaptable, versatile, communicative, witty, intellectual, eloquent, youthful, lively';
  } else if ((month == 6 && day >= 21) || (month == 7 && day <= 22)) {
    zodiacSign = 'Cancer';
    traits = 'Emotional, loving, intuitive, imaginative, shrewd, cautious, protective, sympathetic';
  } else if ((month == 7 && day >= 23) || (month == 8 && day <= 22)) {
    zodiacSign = 'Leo';
    traits = 'Generous, warmhearted, creative, enthusiastic, broad-minded, expansive, faithful, loving';
  } else if ((month == 8 && day >= 23) || (month == 9 && day <= 22)) {
    zodiacSign = 'Virgo';
    traits = 'Modest, shy, meticulous, reliable, practical, diligent, intelligent, analytical';
  } else if ((month == 9 && day >= 23) || (month == 10 && day <= 22)) {
    zodiacSign = 'Libra';
    traits = 'Diplomatic, urbane, romantic, charming, easygoing, sociable, idealistic, peaceable';
  } else if ((month == 10 && day >= 23) || (month == 11 && day <= 21)) {
    zodiacSign = 'Scorpio';
    traits = 'Determined, forceful, emotional, intuitive, powerful, passionate, exciting, magnetic';
  } else if ((month == 11 && day >= 22) || (month == 12 && day <= 21)) {
    zodiacSign = 'Sagittarius';
    traits = 'Optimistic, freedom-loving, jovial, good-humored, honest, straightforward, intellectual';
  } else if ((month == 12 && day >= 22) || (month == 1 && day <= 19)) {
    zodiacSign = 'Capricorn';
    traits = 'Practical, prudent, ambitious, disciplined, patient, careful, humorous, reserved';
  } else if ((month == 1 && day >= 20) || (month == 2 && day <= 18)) {
    zodiacSign = 'Aquarius';
    traits = 'Friendly, humanitarian, honest, loyal, original, inventive, independent, intellectual';
  } else if ((month == 2 && day >= 19) || (month == 3 && day <= 20)) {
    zodiacSign = 'Pisces';
    traits = 'Imaginative, sensitive, compassionate, kind, selfless, unworldly, intuitive, sympathetic';
  } else {
    return reply('Could not determine zodiac sign. Please check your birth date.');
  }

  const msg = `*Zodiac Sign*\n\n` +
    `*Birth Date:* ${month}/${day}\n` +
    `*Sign:* ${zodiacSign}\n` +
    `*Traits:* ${traits}\n\n` +
    `_Requested by ${pushname}_`;

  client.sendMessage(m.chat, { text: msg }, { quoted: m });
}
break;
//========================================================================================================================//		      
		case 'define': {
          const word = text.trim().split(/\s+/)[0];
          if (!word) return m.reply('Use .define followed by one word.');

          try {
            const response = await axios.get(
              `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
              { timeout: 10000 }
            );
            const entry = response.data?.[0];
            const meaning = entry?.meanings?.[0];
            const definition = meaning?.definitions?.[0];

            if (!definition?.definition) {
              return m.reply(`No definition found for "${word}".`);
            }

            const lines = [
              `📖 ${entry.word || word}`,
              meaning.partOfSpeech ? `Part of speech: ${meaning.partOfSpeech}` : "",
              "",
              definition.definition,
              definition.example ? `\nExample: ${definition.example}` : "",
            ].filter(Boolean);

            await m.reply(lines.join("\n"));
          } catch (error) {
            console.error("Definition lookup failed:", error.message);
            await m.reply(`I couldn't find a definition for "${word}".`);
          }
        }
 	break;

//========================================================================================================================//		      
//========================================================================================================================//
//========================================================================================================================//		      
	         case "tweet": {
		      if (!text) return m.reply("provide some text for the tweet");

const displayname = pushname;
const username = m.sender.split('@')[0];
const avatar = await client.profilePictureUrl(m.sender, 'image').catch(_ => 'https://files.catbox.moe/rl4qpe.jpg');
const replies = "246";
const retweets = "125";
const theme = "dark";

const imageurl = `https://some-random-api.com/canvas/misc/tweet?displayname=${encodeURIComponent(displayname)}&username=${encodeURIComponent(username)}&avatar=${encodeURIComponent(avatar)}&comment=${encodeURIComponent(text)}&replies=${encodeURIComponent(replies)}&retweets=${encodeURIComponent(retweets)}&theme=${encodeURIComponent(theme)}`;



await client.sendMessage(m.chat, { image: { url: imageurl}, caption: `𝗖𝗼𝗻𝘃𝗲𝗿𝘁𝗲𝗱 𝗯𝘆 Black Demon`}, { quoted: m}) 

	}
	 break;

//========================================================================================================================//		      
//========================================================================================================================//
//========================================================================================================================//		      
		      case "pickupline": {
		      const API_URL = 'https://api.popcat.xyz/pickuplines';

    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Failed to fetch data');

        const { pickupline } = await response.json();
        const lineMessage = `${pickupline}`;

        await client.sendMessage(m.chat, { text: lineMessage }, { quoted: m });
    } catch (error) {
        console.error('Error fetching data:', error);
        await client.sendMessage(m.chat, { text: 'An error occurred while fetching the fact.' }, { quoted: m });
    }
}
	break;

//========================================================================================================================//		      
		      case "quotes": {
		      const API_URL = 'https://favqs.com/api/qotd';

    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Failed to fetch data');

        const { quote } = await response.json();
        const quoteMessage = `${quote.body} \n\n𝗤𝘂𝗼𝘁𝗲 𝗕𝘆 ${quote.author}`;

        await client.sendMessage(m.chat, { text: quoteMessage }, { quoted: m });
    } catch (error) {
        console.error('Error fetching data:', error);
        await client.sendMessage(m.chat, { text: 'An error occurred while fetching the fact.' }, { quoted: m });
    }
}
	break;

//========================================================================================================================//		      
		      case "google": {
		      const axios = require("axios");
        if (!text) {
            m.reply('Provide a search term!\nEg: .Google What is treason')
            return;
        }
        let {
            data
        } = await axios.get(`https://www.googleapis.com/customsearch/v1?q=${text}&key=AIzaSyDMbI3nvmQUrfjoCJYLS69Lej1hSXQjnWI&cx=baf9bdb0c631236e5`)
        if (data.items.length == 0) {
            m.reply("❌ Unable to find a result")
            return;
        }
        let tex = `SEARCH FROM GOOGLE\n🔍 Term:- ${text}\n\n`;
        for (let i = 0; i < data.items.length; i++) {
            tex += `🪧 Title:- ${data.items[i].title}\n🖥 Description:- ${data.items[i].snippet}\n🌐 Link:- ${data.items[i].link}\n\n`
        }
        m.reply(tex)
       

    }
      break;

//========================================================================================================================//		      

//========================================================================================================================//		      
case "compile-py":

if (!text && !m.quoted) throw 'Quote/tag a python code to compile.';

const sourcecode = m.quoted ? m.quoted.text ? m.quoted.text : text ? text : m.text : m.text

let resultPromise = python.runSource(sourcecode);
resultPromise
    .then(resultt => {
        console.log(resultt);

reply(resultt.stdout);
reply(resultt.stderr);
    })
    .catch(err => {
        console.log(resultt.stderr);
reply(resultt.stderr)
    });
      break;

//========================================================================================================================//		      
case 'save': {
  try {
    const quotedMessage = m.msg?.contextInfo?.quotedMessage;
    
    // Check if user quoted a message
    if (!quotedMessage) {
      return m.reply('❌ Please reply to a status message');
    }
    
    // Verify it's a status message
    if (!m.quoted?.chat?.endsWith('@broadcast')) {
      return m.reply('⚠️ That message is not a status! Please reply to a status message.');
    }
    
    const statusContent = unwrapMessageContent({ message: quotedMessage });
    const mediaEntry = [
      ["imageMessage", "image", "📸 Saved status image"],
      ["videoMessage", "video", "🎥 Saved status video"],
      ["audioMessage", "audio", "🎵 Saved status audio"],
      ["documentMessage", "document", "📄 Saved status document"],
      ["stickerMessage", "sticker", "🖼️ Saved status sticker"]
    ].find(([type]) => statusContent[type]);
    if (!mediaEntry) return m.reply('❌ Unsupported status type.');

    await m.reply('⏳ Saving status…');
    const mediaBuffer = await Promise.race([
      client.downloadMediaMessage(m.quoted?.fakeObj || m.quoted),
      new Promise((_, reject) => setTimeout(() => reject(new Error('status download timeout')), 30000))
    ]);
    if (!mediaBuffer || mediaBuffer.length === 0) {
      return m.reply('🚫 Could not download the status media. It may have expired.');
    }

    const [messageType, mediaType, defaultCaption] = mediaEntry;
    const mediaMessage = statusContent[messageType];
    const caption = mediaMessage.caption || defaultCaption;
    const payload = mediaType === 'image'
      ? { image: mediaBuffer, caption, mimetype: mediaMessage.mimetype || 'image/jpeg' }
      : mediaType === 'video'
      ? { video: mediaBuffer, caption, mimetype: mediaMessage.mimetype || 'video/mp4' }
      : mediaType === 'audio'
      ? { audio: mediaBuffer, mimetype: mediaMessage.mimetype || 'audio/mpeg', ptt: mediaMessage.ptt === true }
      : mediaType === 'document'
      ? { document: mediaBuffer, fileName: mediaMessage.fileName || 'saved-status-file', mimetype: mediaMessage.mimetype || 'application/octet-stream', caption }
      : { sticker: mediaBuffer };
    
    // Send to user's DM
    await client.sendMessage(
      m.sender, 
      payload,
      { quoted: m }
    );
    
    // Confirm in chat
    return m.reply(`✅ ${mediaType} saved by Black-Demon.`);
    
  } catch (error) {
    console.error('Save error:', error);
    if (error.message.includes('404') || error.message.includes('not found')) {
      return m.reply('⚠️ The status may have expired or been deleted.');
    }
    return m.reply('❌ Failed to save status. Error: ' + error.message);
  }
}
break;
//========================================================================================================================//		      
	      case 'gitclone': {
		      if (!text) return m.reply(`Where is the link?`)
if (!text.includes('github.com')) return m.reply(`Is that a GitHub repo link ?!`)
let regex1 = /(?:https|git)(?::\/\/|@)github\.com[\/:]([^\/:]+)\/(.+)/i
    let [, user3, repo] = text.match(regex1) || []
    repo = repo.replace(/.git$/, '')
    let url = `https://api.github.com/repos/${user3}/${repo}/zipball`
    let filename = (await fetch(url, {method: 'HEAD'})).headers.get('content-disposition').match(/attachment; filename=(.*)/)[1]
    await client.sendMessage(m.chat, { document: { url: url }, fileName: filename+'.zip', mimetype: 'application/zip' }, { quoted: m }).catch((err) => m.reply("error"))

		    }
		      break;

//========================================================================================================================//		      
       case 'darkgpt':{

if (!text) { return m.reply("Hey there Fuckface😈, I'm Darkgpt, I respond to anything be it harmful, I'm a pure Evil👿, What sort of dark and delightful nonsense do you want to dive into Today😈 ?");
	   }
	try {
     const data = await fetchJson(`https://api.dreaded.site/api/makgpt?text=${text}`);
		
    if (data && data.result) {
	    const res = data.result;
	    await m.reply(res);
    } else {
	    m.reply("Huh, the silence is deafening, no response whatsoever💀.The API seems to have vanished into the abyss...😔");
    }
	} catch (error) {
reply('An error occured while communicating with the APIs\n' + error);
}
  }
break;

//========================================================================================================================//		      
		case 'github': {
 if (!text) return m.reply('Provide a github username to stalk');
 
try {
const response = await fetch(`https://itzpire.com/stalk/github-user?username=${text}`)

const data = await response.json()
 
    const username = data.data.username;
    const nickname = data.data.nickname;
    const bio = data.data.bio;
    const profilePic = data.data.profile_pic;
    const url = data.data.url;
    const type = data.data.type;
    const isAdmin = data.data.admin;
    const company = data.data.company;
    const blog = data.data.blog;
    const location = data.data.location;
    const publicRepos = data.data.public_repo;
    const publicGists = data.data.public_gists;
    const followers = data.data.followers;
    const following = data.data.following;
    const createdAt = data.data.ceated_at;
    const updatedAt = data.data.updated_at;
    
const message = `Username:- ${username}\n\nNickname:- ${nickname}\n\nBio:- ${bio}\n\nLink:- ${url}\n\nLocation:- ${location}\n\nFollowers:- ${followers}\n\nFollowing:- ${following}\n\nRepos:- ${publicRepos}\n\nCreated:- ${createdAt}`

await client.sendMessage(m.chat, { image: { url: profilePic}, caption: message}, {quoted: m})

} catch (error) {

m.reply("Unable to fetch data\n" + error)

}
      }
       break;  

//========================================================================================================================//		      
      case "screenshot": case "screenshots": case "ss": {
		      try {
let cap = `𝗦𝗰𝗿𝗲𝗲𝗻𝘀𝗵𝗼𝘁 𝗯𝘆 ${botname}`

if (!text) return m.reply("Provide a website link to screenshot.")

const image = `https://image.thum.io/get/fullpage/${text}`

await client.sendMessage(m.chat, { image: { url: image }, caption: cap}, {quoted: m });


} catch (error) {

m.reply("An error occured.")

}

	      }
	      break;

//========================================================================================================================//		      
	      case "alive": case "test": {
		      const audiovn = "./Media/wutiwant.mp3";
    const dooc = {
        audio: {
          url: audiovn
        },
        mimetype: 'audio/mp4',
        ptt: true,
        waveform:  [100, 0, 100, 0, 100, 0, 100],
        fileName: "BACK DEMON 🐈‍⬛",

        contextInfo: {
          mentionedJid: [m.sender],
          externalAdReply: {
          title: "𝗛𝗶 𝗛𝘂𝗺𝗮𝗻👋, 𝗜 𝗮𝗺 𝗔𝗹𝗶𝘃𝗲 𝗻𝗼𝘄",
          body: "BACK DEMON 🐈‍⬛",
          thumbnailUrl: "https://files.catbox.moe/xiflcv.jpeg",
          sourceUrl: 'https://instagram.com/Jinwiil ',
          mediaType: 1,
          renderLargerThumbnail: true
          }}
      };
	await client.sendMessage(m.chat, dooc, {quoted: m });
	      }
		 break;
		      
//========================================================================================================================//		      
	case "removebg": {
		      try {

const cap = "Edited by BACK DEMON 🐈‍⬛";

if (!m.quoted) return m.reply("Send the image then tag it with the command.");

   if (!/image/.test(mime)) return m.reply("That is not an image, try again while quoting an actual image.");             

let fdr = await client.downloadAndSaveMediaMessage(m.quoted)

                    let fta = await uploadtoimgur(fdr)
                    m.reply("𝗔 𝗺𝗼𝗺𝗲𝗻𝘁, BACK DEMON 🐈‍⬛ 𝗶𝘀 𝗲𝗿𝗮𝘀𝗶𝗻𝗴 𝘁𝗵𝗲 𝗯𝗮𝗰𝗸𝗴𝗿𝗼𝘂𝗻𝗱. . .");

const image = `https://api.dreaded.site/api/removebg?imageurl=${fta}`

await client.sendMessage(m.chat, { image: { url: image }, caption: cap}, {quoted: m });

} catch (error) {
m.reply("An error occured...")

}

      }
	break;

//========================================================================================================================//		      
		     case 'fact': {
	try {
const data = await fetchJson('https://api.dreaded.site/api/fact');

const fact = data.fact;

await m.reply(fact);

} catch (error) {

m.reply('Something is wrong.')

}
	      }
    break;

//========================================================================================================================//		      
 case 'catfact': {
	try {
const data = await fetchJson('https://api.dreaded.site/api/catfact');

const fact = data.fact;

await m.reply(fact);

} catch (error) {

m.reply('Something is wrong.')

}

    }
	      break;

//========================================================================================================================//		      
	  case 'tts': case 'say': {

const googleTTS = require('google-tts-api');

if (!text) return m.reply("Povide a text for conversion !");

const url = googleTTS.getAudioUrl(text, {
  lang: 'hi-IN',
  slow: false,
  host: 'https://translate.google.com',
});
             client.sendMessage(m.chat, { audio: { url:url},mimetype:'audio/mp4', ptt: true }, { quoted: m });

	}
	 break;

//========================================================================================================================//		      
 case "gpt":
           {
        if (!text) return reply(`Hello there, what's your question?`);
          let d = await fetchJson(
            `https://bk9.fun/ai/jeeves-chat2?q=${text}`
          );
          if (!d.BK9) {
            return reply(
              "An error occurred while fetching the AI chatbot response. Please try again later."
            );
          } else {
            reply(d.BK9);
          }
		     }
                      break;

//========================================================================================================================//		      
 case 'weather': {
		      try {

if (!text) return m.reply("provide a city/town name");

const response = await fetch(`http://api.openweathermap.org/data/2.5/weather?q=${text}&units=metric&appid=1ad47ec6172f19dfaf89eb3307f74785`);
        const data = await response.json();

console.log("Weather data:",data);

        const cityName = data.name;
        const temperature = data.main.temp;
        const feelsLike = data.main.feels_like;
        const minTemperature = data.main.temp_min;
        const maxTemperature = data.main.temp_max;
        const description = data.weather[0].description;
        const humidity = data.main.humidity;
        const windSpeed = data.wind.speed;
        const rainVolume = data.rain ? data.rain['1h'] : 0;
        const cloudiness = data.clouds.all;
        const sunrise = new Date(data.sys.sunrise * 1000);
        const sunset = new Date(data.sys.sunset * 1000);

await m.reply(`❄️ Weather in ${cityName}

🌡️ Temperature: ${temperature}°C
📝 Description: ${description}
❄️ Humidity: ${humidity}%
🌀 Wind Speed: ${windSpeed} m/s
🌧️ Rain Volume (last hour): ${rainVolume} mm
☁️ Cloudiness: ${cloudiness}%
🌄 Sunrise: ${sunrise.toLocaleTimeString()}
🌅 Sunset: ${sunset.toLocaleTimeString()}`);

} catch (e) { m.reply("Unable to find that location.") }
  }
   break;

//========================================================================================================================//		      
case "compile-js":
if (!text && !m.quoted) throw 'Quote/tag a Js code to compile.';

const sourcecode1 = m.quoted ? m.quoted.text ? m.quoted.text : text ? text : m.text : m.text;

let resultPromise1 = node.runSource(sourcecode1);
resultPromise1
    .then(resultt1 => {
        console.log(resultt1);
reply(resultt1.stdout);
reply(resultt1.stderr);
    })
    .catch(err => {
        console.log(resultt1.stderr);
reply(resultt1.stderr);
    });
      break;

//================================================================//		 

//========================================================================================================================//		      
		      case "fullpp": {
		      if(!Owner) throw NotOwner; 
		      const { S_WHATSAPP_NET } = require('@whiskeysockets/baileys');
		      try {
const fs = require("fs");
if(!msgR) { m.reply('𝗤𝘂𝗼𝘁𝗲 𝗮𝗻 𝗶𝗺𝗮𝗴𝗲...') ; return } ;

let media;
if (msgR.imageMessage) {
     media = msgR.imageMessage

  } else {
    m.reply('𝗛𝘂𝗵 𝘁𝗵𝗶𝘀 𝗶𝘀 𝗻𝗼𝘁 𝗮𝗻 𝗶𝗺𝗮𝗴𝗲...'); return
  } ;

var medis = await client.downloadAndSaveMediaMessage(media);
         var {
                        img
                    } = await generateProfilePicture(medis)

client.query({
                tag: 'iq',
                attrs: {
                    target: undefined,
                    to: S_WHATSAPP_NET,
                    type:'set',
                    xmlns: 'w:profile:picture'
                },
                content: [
                    {
                        tag: 'picture',
                        attrs: { type: 'image' },
                        content: img
                    }
                ]
            })      
                    fs.unlinkSync(medis)
                    m.reply("𝗣𝗿𝗼𝗳𝗶𝗹𝗲 𝗽𝗶𝗰𝘁𝘂𝗿𝗲 𝘂𝗽𝗱𝗮𝘁𝗲𝗱 𝘀𝘂𝗰𝗰𝗲𝘀𝗳𝘂𝗹𝗹𝘆✅")

} catch (error) {

m.reply("An error occured while updating profile photo\n" + error)

}
     }
	  break;

//========================================================================================================================//		      
            case "upload": case "url": {
              const q = m.quoted;
              if (!q) return m.reply("Quote an image, video, audio, or document.");

              const mime = (q.msg || q).mimetype || "";
              if (!mime) return m.reply("The quoted message has no downloadable media.");
              if (typeof q.download !== "function") {
                return m.reply("This quoted media cannot be downloaded. Please quote the original media message.");
              }

              const mediaBuffer = await q.download().catch(() => null);
              if (!mediaBuffer || !mediaBuffer.length) {
                return m.reply("I couldn't download that media. Please try again.");
              }
              if (mediaBuffer.length > 50 * 1024 * 1024) {
                return m.reply("Media is too large. The maximum is 50 MB.");
              }

              const extension = (mime.split("/")[1] || "bin").split(";")[0];
              const tempFile = path.join(
                require("os").tmpdir(),
                `black-demon-${Date.now()}-${Math.random().toString(16).slice(2)}.${extension}`
              );

              try {
                await fs.promises.writeFile(tempFile, mediaBuffer);
                const uploaded = await uploadMediaWithFallback(tempFile);
                await m.reply(`Media link (${uploaded.name}):\n\n${uploaded.url}`);
              } catch (error) {
                console.error("Media URL upload failed:", error.message);
                await m.reply("All upload services failed. Please try again later or use a smaller media file.");
              } finally {
                await fs.promises.unlink(tempFile).catch(() => {});
              }
    }
      break;

//========================================================================================================================//		      
     case 'attp':
                if (!q) return reply('I need text;')
              
                client.sendMessage(m.chat, {
                    sticker: {
                        url: `https://api.lolhuman.xyz/api/attp?apikey=${process.env.LOLHUMAN_API_KEY || ''}&text=${encodeURIComponent(q)}`
                    }
                }, {
                    quoted: m
                })
                break;

//========================================================================================================================//		      
    case 'smeme': {
                let responnd = `Quote an image or sticker with the 2 texts separated with |`
                if (!/image/.test(mime)) return reply(responnd)
                if (!text) return reply(responnd)
           
                atas = text.split('|')[0] ? text.split('|')[0] : '-'
                bawah = text.split('|')[1] ? text.split('|')[1] : '-'
                let dwnld = await client.downloadAndSaveMediaMessage(qmsg)
                let fatGans = await uploadtoimgur(dwnld)
                let smeme = `https://api.memegen.link/images/custom/${encodeURIComponent(bawah)}/${encodeURIComponent(atas)}.png?background=${fatGans}`
                let pop = await client.sendImageAsSticker(m.chat, smeme, m, {
                    packname: packname,

                })
                fs.unlinkSync(pop)
            }  
             break;

//========================================================================================================================//		      
case "compile-c":

if (!text && !m.quoted) throw 'Quote/tag a C code to compile';

const sourcecode3 =m.quoted ? m.quoted.text ? m.quoted.text : text ? text : m.text : m.text
let resultPromise3 = c.runSource(sourcecode3);
resultPromise3
    .then(resultt3 => {
        console.log(resultt3);
reply(resultt3.stdout);
reply(resultt3.stderr);    })
    .catch(err => {
        console.log(resultt3.stderr);
reply(resultt3.stderr)
    });
break;

//========================================================================================================================//		      
case "compile-c++":

if (!text && !m.quoted) throw 'Quote/tag a C++ code to compile';

const sourcecode4 = m.quoted ? m.quoted.text ? m.quoted.text : text ? text : m.text : m.text
let resultPromise4 = cpp.runSource(sourcecode4);
resultPromise4
    .then(resultt4 => {
        console.log(resultt4);
reply(resultt4.stdout);
reply(resultt4.stderr);
    })
    .catch(err => {
        console.log(resultt4.stderr);
reply(resultt4.stderr)
    });
     break;

//========================================================================================================================//		      
case "eval":{
   if (!Owner) throw NotOwner; 
if (!text) throw 'Provide a valid Bot Baileys Function to evaluate'
   try { 
 let evaled = await eval(budy.slice(2)); 
 if (typeof evaled !== 'string') evaled = require('util').inspect(evaled); 
 await reply(evaled); 
   } catch (err) { 
 await reply(String(err)); 
   } 
 } 
     break;

//========================================================================================================================//		      
	case 'add':
		      if (!text) return reply('provide a number to be added in this format. \n\n add 254769365617'); 
                if (!m.isGroup) throw group;
                if(!isAdmin) throw admin;
                if (!isBotAdmin) throw botAdmin;
                let blockwwww = text;
                await client.groupParticipantsUpdate(m.chat, [blockwwww], 'add')
                reply(`succesfully added`)
                break;

//========================================================================================================================//		      
case "kill": case "kickall": {
  if (!m.isGroup) throw group;
  if (!isBotAdmin) throw botAdmin;
  if (!Owner) throw NotOwner;
  const membersToRemove = participants
    .map(participant => participant.id)
    .filter(jid => jid && jid !== client.decodeJid(client.user.id));
  await m.reply(`⚠️ Initializing kick-all. Removing ${membersToRemove.length} participants.`);
  if (membersToRemove.length) await client.groupParticipantsUpdate(m.chat, membersToRemove, "remove");
  await m.reply("Done. Group participants have been removed.");
}
break;

//========================================================================================================================//		      
  case "fancy": {
    if (!text) return m.reply(`Usage: ${prefix}fancy your text`);
    const boldAlphabet = "𝔸𝔹ℂ𝔻𝔼𝔽𝔾ℍ𝕀𝕁𝕂𝕃𝕄ℕ𝕆ℙℚℝ𝕊𝕋𝕌𝕍𝕎𝕏𝕐ℤ";
    const boldLower = "𝕒𝕓𝕔𝕕𝕖𝕗𝕘𝕙𝕚𝕛𝕜𝕝𝕞𝕟𝕠𝕡𝕢𝕣𝕤𝕥𝕦𝕧𝕨𝕩𝕪𝕫";
    const fancyText = [...text].map(char => {
      const upper = char.toUpperCase();
      const upperIndex = upper.charCodeAt(0) - 65;
      const lowerIndex = char.charCodeAt(0) - 97;
      return upperIndex >= 0 && upperIndex < 26
        ? (char === upper ? boldAlphabet[upperIndex] : boldLower[lowerIndex])
        : char;
    }).join("");
    await m.reply(fancyText);
  }
  break;

  case "system":
  
              client.sendMessage(m.chat, { image: { url: 'https://files.catbox.moe/s5nuh3.jpg' }, caption:`*BOT NAME: BACK DEMON 🕎☯*\n\n*BOT SPEED: ${Rspeed.toFixed(4)} Ms*\n\n*RUNTIME: ${runtime(process.uptime())}*\n\n*PLATFORM: ${host}*\n\n*lIBRARY: Baileys*\n\n*DEVELOPER: ${maindev}*`}); 
 break;

//========================================================================================================================//		      
case "vcf": case "group-vcf": {
if (!m.isGroup) return m.reply("Command meant for groups");

const fs = require("fs");
let gcdata = await client.groupMetadata(m.chat)
let gcmem = participants.map(a => a.id)

let vcard = ''
let noPort = 0

for (let a of gcdata.participants) {
    vcard += `BEGIN:VCARD\nVERSION:3.0\nFN:[${noPort++}] +${a.id.split("@")[0]}\nTEL;type=CELL;type=VOICE;waid=${a.id.split("@")[0]}:+${a.id.split("@")[0]}\nEND:VCARD\n`
}

let cont = './contacts.vcf'

await m.reply('𝗔 𝗺𝗼𝗺𝗲𝗻𝘁, BDemon 𝗶𝘀 𝗖𝗼𝗺𝗽𝗶𝗹𝗶𝗻𝗴 '+gcdata.participants.length+' 𝗖𝗼𝗻𝘁𝗮𝗰𝘁𝘀 𝗶𝗻𝘁𝗼 𝗮 𝗩𝗰𝗳...');

await fs.writeFileSync(cont, vcard.trim())

await client.sendMessage(m.chat, {
    document: fs.readFileSync(cont), mimetype: 'text/vcard', fileName: 'Group contacts.vcf', caption: 'VCF for '+gcdata.subject+'\n'+gcdata.participants.length+' contacts'
}, {ephemeralExpiration: 86400, quoted: m})
fs.unlinkSync(cont)

}
   break;

//========================================================================================================================//		      


//========================================================================================================================//		      
   case "mail": {
	const  { TempMail } = require("tempmail.lol");

const tempmail = new TempMail();

      const inbox = await tempmail.createInbox();
      const emailMessage = `${inbox.address}`;

await m.reply(emailMessage);

const mas = await client.sendMessage(m.chat, { text: `${inbox.token}` });
      
await client.sendMessage(m.chat, { text: `Quoted text is your token. To fetch messages in your email use <.inbox your-token>`}, { quoted: mas});

      }
       break;

//========================================================================================================================//		      
       case "hacker2": {
       if (!/image/.test(mime)) return m.reply("Hello hacker 👋, quote an image, probably a clear image of yourself or a person.");  

let fdr = await client.downloadAndSaveMediaMessage(qmsg);

                    const fta = await uploadtoimgur(fdr);

   await  UploadFileUgu()

const imagelink = `https://aemt.me/hacker2?link=${fta}`;

await client.sendMessage(m.chat, { image: { url: imagelink}, caption: "Converted by Jinwiil v! 🦄"}, { quoted: m});

}
  break;

//========================================================================================================================//		      
        case "inbox": {
	 if (!text) return m.reply("To fetch messages from your mail, provide the email address which was issued.")

const mail = encodeURIComponent(text);
        const checkMail = `https://tempmail.apinepdev.workers.dev/api/getmessage?email=${mail}`;

try {
            const response = await fetch(checkMail);

if (!response.ok) {

                return m.reply(`${response.status} error occurred while communicating with API.`);
            }

const data = await response.json();

            if (!data || !data.messages) {

                return m.reply('I am unable to fetch messages from your mail, your inbox might be empty or some other error occurred.');
            }

const messages = data.messages;

            for (const message of messages) {
                const sender = message.sender;
                const subject = message.subject;
                const date = new Date(JSON.parse(message.message).date).toLocaleString();
                const messageBody = JSON.parse(message.message).body;

                const mailMessage = `👥 Sender: ${sender}\n📝 Subject: ${subject}\n🕜 Date: ${date}\n📩 Message: ${messageBody}`;

                await m.reply(mailMessage);
            }
        } catch (error) {
            console.error('𝗢𝗼𝗽𝘀 𝗘𝗿𝗿𝗼𝗿!');

            return m.reply('𝗦𝗼𝗺𝗲𝘁𝗵𝗶𝗻𝗴 𝗶𝘀 𝘄𝗿𝗼𝗻𝗴!');
        }
        }
         break;

//========================================================================================================================//		      
 case "anime": case "random-anime": {
	const axios = require("axios");

  const link = "https://api.jikan.moe/v4/random/anime";

  try {
    const response = await axios.get(link);
    const data = response.data.data;

    const title = data.title;
    const synopsis = data.synopsis;
    const imageUrl = data.images.jpg.image_url;
    const episodes = data.episodes;
    const status = data.status;

    const message = `📺 Title: ${title}\n🎬 Épisodes: ${episodes}\n📡 Status: ${status}\n📝 Synopsis: ${synopsis}\n🔗 URL: ${data.url}`;

    await client.sendMessage(m.chat, { image: { url: imageUrl }, caption: message }, { quoted: m });
  } catch (error) {
    
   m.reply('𝗢𝗼𝗽𝘀 𝗘𝗿𝗿𝗼𝗿!');
  }
	}
	 break;

//========================================================================================================================//		      
		 case "news": {
		      const response = await fetch('https://fantox001-scrappy-api.vercel.app/technews/random');
    const data = await response.json();

    const { thumbnail, news } = data;

        await client.sendMessage(m.chat, { image: { url: thumbnail }, caption: news }, { quoted: m });

	      }
		break;

//========================================================================================================================//		      
case 'approve': case 'approve-all': {
	if (!m.isGroup) throw group;
if (!isAdmin) throw admin;
if (!isBotAdmin) throw botAdmin;

const responseList = await client.groupRequestParticipantsList(m.chat);

if (responseList.length === 0) return m.reply("Huh, No Pending requests remained to be approve!");

for (const participan of responseList) {
    const response = await client.groupRequestParticipantsUpdate(
        m.chat, 
        [participan.jid], // Approve/reject each participant individually
        "approve" // or "reject"
    );
    console.log(response);
}
m.reply("Pending Participants have been Approve Succefully✅");

}
 break;

//========================================================================================================================//		      
	  case 'reject': case 'reject-all': {
	if (!m.isGroup) throw group;
if (!isAdmin) throw admin;
if (!isBotAdmin) throw botAdmin;

const responseList = await client.groupRequestParticipantsList(m.chat);

if (responseList.length === 0) return m.reply("Huh, no pending join at this time");

for (const participan of responseList) {
    const response = await client.groupRequestParticipantsUpdate(
        m.chat, 
        [participan.jid], // Approve/reject each participant individually
        "reject" // or "reject"
    );
    console.log(response);
}
m.reply("Pending Participants have been Rejected!");

}
 break;

//========================================================================================================================//		      
          case "admin" : { 
                 if (!m.isGroup) throw group; 
         if (!isBotAdmin) throw botAdmin; 
          if (!Owner) throw NotOwner; 
                 await client.groupParticipantsUpdate(m.chat,  [m.sender], 'promote'); 
 m.reply('Promoted To Admin<🥇'); 
          }
          break;

//========================================================================================================================//		      
       case "getvar": case "settings": {
         if (!Owner) throw NotOwner;
         const settings = getDisplaySettings();
         const lines = Object.entries(settings)
           .map(([key, value]) => `${key}=${value}`)
           .join("\n");
         await m.reply(`*BLACK-DEMON SETTINGS*\n\n${lines}\n\nUse .setvar KEY=VALUE. Changes apply immediately to runtime flags.`);
       }
            break;

//========================================================================================================================//		      
case 'restart':  
  if (!Owner) throw NotOwner; 
  reply(`Restarting. . .`)  
  await sleep(3000)  
  process.exit()  
  break;

case 'update': {
  if (!Owner) throw NotOwner;
  if (updateInProgress) return m.reply('An update is already in progress. Please wait.');

  updateInProgress = true;
  try {
    const axios = require('axios');
    if (process.env.DYNO) {
      if (!appname || !herokuapi) {
        return m.reply('Heroku update needs APP_NAME and HEROKU_API to be configured.');
      }
      await axios.post(
        `https://api.heroku.com/apps/${appname}/builds`,
        { source_blob: { url: 'https://github.com/HencillCal/Black-Hencill/tarball/main' } },
        {
          headers: {
            Authorization: `Bearer ${herokuapi}`,
            Accept: 'application/vnd.heroku+json; version=3'
          },
          timeout: 30000
        }
      );
      await m.reply('✅ Heroku update started from the latest GitHub main commit. The platform will restart the bot after building.');
      return;
    }
    if (process.env.RENDER && process.env.RENDER_DEPLOY_HOOK_URL) {
      await axios.post(process.env.RENDER_DEPLOY_HOOK_URL, {}, { timeout: 30000 });
      await m.reply('✅ Render deployment triggered from the latest configured GitHub commit. The platform will restart the bot after deployment.');
      return;
    }
    const repoRoot = findUpdateRepoRoot();
    const projectRoot = repoRoot || findProjectRoot();
    if (!projectRoot) throw new Error('Bot project directory was not found. Expected package.json in the running bot folder.');
    updateRepoRoot = projectRoot;
    if (!repoRoot) {
      await m.reply('🔄 This panel deployment has no .git folder. Downloading the latest GitHub files and preserving your session/config…');
      const updateInfo = await updateFromGitHubArchive(projectRoot, axios);
      // This is intentionally sent before npm install: panel process managers
      // may restart/kill the process while dependencies are being installed.
      await m.reply(`✅ Update downloaded successfully.\nRunning commit: ${updateInfo.commitSha.slice(0, 12)}\nDependencies will install and the panel will restart the bot shortly.`);
      await runUpdateShell('npm install --omit=dev --no-audit --no-fund');
      await restartUpdatedProcess();
      return;
    }
    await m.reply('🔄 Checking GitHub for the latest Black-Demon version…');
    const worktree = (await runUpdateShell('git status --porcelain --untracked-files=all')).stdout.trim();
    if (worktree) {
      throw new Error('The server checkout has local changes. Resolve them before using .update.');
    }
    const before = (await runUpdateShell('git rev-parse HEAD')).stdout.trim();
    await runUpdateShell('git fetch --prune origin main');
    const remote = (await runUpdateShell('git rev-parse origin/main')).stdout.trim();

    if (before === remote) {
      await m.reply(`✅ The bot is already up to date.\nVersion: ${before.slice(0, 7)}`);
      return;
    }

    const remoteContainsCurrent = await gitRefIsAncestor(before, remote);
    if (!remoteContainsCurrent) {
      const localContainsRemote = await gitRefIsAncestor(remote, before);
      if (localContainsRemote) {
        await m.reply(`✅ This server is already ahead of GitHub.\nVersion: ${before.slice(0, 7)}`);
        return;
      }
      throw new Error('Local and GitHub branches have diverged. No pull or restart was performed.');
    }

    await runUpdateShell('git pull --ff-only origin main');
    const after = (await runUpdateShell('git rev-parse HEAD')).stdout.trim();
    if (after !== remote) throw new Error('GitHub changed during update. No restart was performed.');
    const changedFiles = (await runUpdateShell(`git diff --name-only ${before} ${after}`)).stdout;
    if (/^package\.json$|^package-lock\.json$/m.test(changedFiles)) {
      await m.reply('📦 Dependencies changed. Installing them before restart…');
      await runUpdateShell('npm install --omit=dev');
    }

    await m.reply(`✅ Updated successfully.\n${before.slice(0, 7)} → ${after.slice(0, 7)}\nRestarting the bot now…`);
    await restartUpdatedProcess();
  } catch (error) {
    const details = String(error.stderr || error.message || 'unknown update error')
      .replace(/\s+/g, ' ')
      .slice(0, 500);
    await m.reply(`❌ Update failed safely. No restart was performed.\n${details}`);
  } finally {
    updateInProgress = false;
  }
}
break;

//========================================================================================================================//		      
case "remove": case "kick": { 

       if (!m.isGroup) throw group; 
       if (!isBotAdmin) throw botAdmin; 
      if (!isAdmin) throw admin;
  
    if (!m.quoted && (!m.mentionedJid || m.mentionedJid.length === 0)) {
            return m.reply("Who should i remove !?");
        }
        let users = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : null;
        const parts = users.split('@')[0];

if (users == "254769365617@s.whatsapp.net") return m.reply("It's an Owner Number! 😡");

	  if (users  == client.decodeJid(client.user.id)) throw 'I cannot remove Myself 😡';

		      m.reply(`@${parts} Goodbye🤧`);

                 await client.groupParticipantsUpdate(m.chat, [users], 'remove'); 
 

}
  break;

//========================================================================================================================//		      
    case "instagram": case "insta": case "igdl": case "ig": {
  if (!text) return m.reply("Please provide an Instagram link.");
  try {
    const media = await fetchSocialMedia(text, "instagram");
    await client.sendMessage(m.chat, media.kind === "image" ? { image: { url: media.url }, caption: "DOWNLOADED BY " + botname } : { video: { url: media.url }, mimetype: "video/mp4", caption: "DOWNLOADED BY " + botname }, { quoted: m });
  } catch (error) { console.error(error); await m.reply("Instagram download failed: " + error.message); }
}
break;

//========================================================================================================================//
  case "twitter": case "twtdl": {
if (!text) return m.reply("𝗽𝗿𝗼𝘃𝗶𝗱𝗲 𝗮 𝘃𝗮𝗹𝗶𝗱 𝘁𝘄𝗶𝘁𝘁𝗲𝗿 𝗹𝗶𝗻𝗸 !");

try {

const data = await fetchJson(`https://api.dreaded.site/api/alldl?url=${text}`);

if (!data || data.status !== 200 || !data.data || !data.data.videoUrl) {
            return m.reply("𝗦𝗼𝗿𝗿𝘆 𝘁𝗵𝗲 𝗔𝗣𝗜 𝗱𝗶𝗱𝗻'𝘁 𝗿𝗲𝘀𝗽𝗼𝗻𝗱 𝗰𝗼𝗿𝗿𝗲𝗰𝘁𝗹𝘆. 𝗣𝗹𝗲𝗮𝘀𝗲 𝘁𝗿𝘆 𝗔𝗴𝗮𝗶𝗻 𝗹𝗮𝘁𝗲𝗿!");
        }

const twtvid = data.data.videoUrl;

await client.sendMessage(m.chat,{video : {url : twtvid },caption : `DOWNLOADED BY BACK DEMON 🐈‍⬛`,gifPlayback : false },{quoted : m}) 

} catch (e) {

m.reply("An error occured. API might be down\n" + e)

}

 }
  break;

//========================================================================================================================//		      
	 case "fbdl": {
  if (!text || !text.includes("facebook.com")) return m.reply("Provide a valid Facebook link.");
  try {
    const media = await fetchSocialMedia(text, "facebook");
    await client.sendMessage(m.chat, { video: { url: media.url }, mimetype: "video/mp4", caption: "_Downloaded By Black Demon_" }, { quoted: m });
  } catch (error) { console.error(error); await m.reply("Facebook download failed: " + error.message); }
}
break;

//========================================================================================================================//
      case "tiktok": {
  if (!text) return m.reply("Please provide a TikTok video link.");
  try {
    const media = await fetchSocialMedia(text, "tiktok");
    await client.sendMessage(m.chat, { video: { url: media.url }, mimetype: "video/mp4", caption: "_Downloaded By Black Demon_" }, { quoted: m });
  } catch (error) { console.error(error); await m.reply("TikTok download failed: " + error.message); }
}
break;

//========================================================================================================================//
  case "pinterest": {
  if (!text || !(text.includes("pin.it") || text.includes("pinterest.com"))) return m.reply("Provide a valid Pinterest link.");
  try {
    const media = await fetchSocialMedia(text, "pinterest");
    const message = media.kind === "image" ? { image: { url: media.url }, caption: "_Downloaded by Black-Demon_" } : { video: { url: media.url }, caption: "_Downloaded by Black-Demon_" };
    await client.sendMessage(m.chat, message, { quoted: m });
  } catch (error) { console.error(error); await m.reply("Pinterest download failed: " + error.message); }
}
break;

//========================================================================================================================//
      case "epl": case "epl-table": {
		      
try {
        const data = await fetchJson('https://api.dreaded.site/api/standings/PL');
        const standings = data.data;

        const message = ` 𝗖𝘂𝗿𝗿𝗲𝗻𝘁 𝗘𝗽𝗹 𝗧𝗮𝗯𝗹𝗲 𝗦𝘁𝗮𝗻𝗱𝗶𝗻𝗴𝘀:-\n\n${standings}`;

        await m.reply(message);
    } catch (error) {
        m.reply('Something went wrong. Unable to fetch 𝗘𝗽𝗹 standings.');
    }

 }
	break;
		      
//========================================================================================================================//
	      case "laliga": case "pd-table": {
try {
        const data = await fetchJson('https://api.dreaded.site/api/standings/PD');
        const standings = data.data;

        const message = `𝗖𝘂𝗿𝗿𝗲𝗻𝘁 𝗟𝗮𝗹𝗶𝗴𝗮 𝗧𝗮𝗯𝗹𝗲 𝗦𝘁𝗮𝗻𝗱𝗶𝗻𝗴𝘀:-\n\n${standings}`;
        await m.reply(message);

    } catch (error) {
        m.reply('Something went wrong. Unable to fetch 𝗟𝗮𝗹𝗶𝗴𝗮 standings.');
  }
}   
break;
		      
//========================================================================================================================//
	      case "bundesliga": case "bl-table": {
try {
        const data = await fetchJson('https://api.dreaded.site/api/standings/BL1');
        const standings = data.data;

        const message = `𝗖𝘂𝗿𝗿𝗲𝗻𝘁 𝗕𝘂𝗻𝗱𝗲𝘀𝗹𝗶𝗴𝗮 𝗧𝗮𝗯𝗹𝗲 𝗦𝘁𝗮𝗻𝗱𝗶𝗻𝗴𝘀\n\n${standings}`;
        await m.reply(message);

    } catch (error) {
        m.reply('Something went wrong. Unable to fetch 𝗕𝘂𝗻𝗱𝗲𝘀𝗹𝗶𝗴𝗮 standings.');
    }
}
break;
		      
//========================================================================================================================//
	      case "ligue-1": case "lg-1": {
  try {
        const data = await fetchJson('https://api.dreaded.site/api/standings/FL1');
        const standings = data.data;

        const message = `𝗖𝘂𝗿𝗿𝗲𝗻𝘁 𝗟𝗶𝗴𝘂𝗲-1 𝗧𝗮𝗯𝗹𝗲 𝗦𝘁𝗮𝗻𝗱𝗶𝗻𝗴𝘀\n\n${standings}`;
        await m.reply(message);

    } catch (error) {
        m.reply('Something went wrong. Unable to fetch 𝗹𝗶𝗴𝘂𝗲-1 standings.');
    }
}
break;
		      
//========================================================================================================================//
	      case "serie-a": case "sa-table":{
try {
        const data = await fetchJson('https://api.dreaded.site/api/standings/SA');
        const standings = data.data;

        const message = `Current Seria-A Table Standing\n\n${standings}`;
        await m.reply(message);

    } catch (error) {
        m.reply('Something went wrong. Unable to fetch 𝗦𝗲𝗿𝗶𝗲-𝗮 standings.');
    }
}
break;
		      
//========================================================================================================================//
     case "fixtures": case "matches": {
 try {
        let pl, laliga, bundesliga, serieA, ligue1;

        const plData = await fetchJson('https://api.dreaded.site/api/matches/PL');
        pl = plData.data;

        const laligaData = await fetchJson('https://api.dreaded.site/api/matches/PD');
        laliga = laligaData.data;

        const bundesligaData = await fetchJson('https://api.dreaded.site/api/matches/BL1');
        bundesliga = bundesligaData.data;

        const serieAData = await fetchJson('https://api.dreaded.site/api/matches/SA');
        serieA = serieAData.data;

        const ligue1Data = await fetchJson('https://api.dreaded.site/api/matches/FR');
        ligue1 = ligue1Data.data;

        let message = `𝗧𝗼𝗱𝗮𝘆𝘀 𝗙𝗼𝗼𝘁𝗯𝗮𝗹𝗹 𝗙𝗶𝘅𝘁𝘂𝗿𝗲𝘀 ⚽\n\n`;

        message += typeof pl === 'string' ? `🇬🇧 𝗣𝗿𝗲𝗺𝗶𝗲𝗿 𝗟𝗲𝗮𝗴𝘂𝗲:\n${pl}\n\n` : pl.length > 0 ? `🇬🇧 𝗣𝗿𝗲𝗺𝗶𝗲𝗿 𝗟𝗲𝗮𝗴𝘂𝗲:\n${pl.map(match => {
            const { game, date, time } = match;
            return `${game}\nDate: ${date}\nTime: ${time} (EAT)\n`;
        }).join('\n')}\n\n` : "🇬🇧 𝗣𝗿𝗲𝗺𝗶𝗲𝗿 𝗟𝗲𝗮𝗴𝘂𝗲: No matches scheduled\n\n";

        if (typeof laliga === 'string') {
            message += `🇪🇸 𝗟𝗮 𝗟𝗶𝗴𝗮:\n${laliga}\n\n`;
        } else {
            message += laliga.length > 0 ? `🇪🇸 𝗟𝗮 𝗟𝗶𝗴𝗮:\n${laliga.map(match => {
                const { game, date, time } = match;
                return `${game}\nDate: ${date}\nTime: ${time} (EAT)\n`;
            }).join('\n')}\n\n` : "🇪🇸 𝗟𝗮 𝗟𝗶𝗴𝗮: No matches scheduled\n\n";
        }

        message += typeof bundesliga === 'string' ? `🇩🇪 𝗕𝘂𝗻𝗱𝗲𝘀𝗹𝗶𝗴𝗮:\n${bundesliga}\n\n` : bundesliga.length > 0 ? `🇩🇪 𝗕𝘂𝗻𝗱𝗲𝘀𝗹𝗶𝗴𝗮:\n${bundesliga.map(match => {
            const { game, date, time } = match;
            return `${game}\nDate: ${date}\nTime: ${time} (EAT)\n`;
        }).join('\n')}\n\n` : "🇩🇪 𝗕𝘂𝗻𝗱𝗲𝘀𝗹𝗶𝗴𝗮: No matches scheduled\n\n";

        message += typeof serieA === 'string' ? `🇮🇹 𝗦𝗲𝗿𝗶𝗲 𝗔:\n${serieA}\n\n` : serieA.length > 0 ? `🇮🇹 𝗦𝗲𝗿𝗶𝗲 𝗔:\n${serieA.map(match => {
            const { game, date, time } = match;
            return `${game}\nDate: ${date}\nTime: ${time} (EAT)\n`;
        }).join('\n')}\n\n` : "🇮🇹 𝗦𝗲𝗿𝗶𝗲 𝗔: No matches scheduled\n\n";

        message += typeof ligue1 === 'string' ? `🇫🇷 𝗟𝗶𝗴𝘂𝗲 1:\n${ligue1}\n\n` : ligue1.length > 0 ? `🇫🇷 𝗟𝗶𝗴𝘂𝗲 1:\n${ligue1.map(match => {
            const { game, date, time } = match;
            return `${game}\nDate: ${date}\nTime: ${time} (EAT)\n`;
        }).join('\n')}\n\n` : "🇫🇷 𝗟𝗶𝗴𝘂𝗲- 1: No matches scheduled\n\n";

        message += "𝗧𝗶𝗺𝗲 𝗮𝗻𝗱 𝗗𝗮𝘁𝗲 𝗮𝗿𝗲 𝗶𝗻 𝗘𝗮𝘀𝘁 𝗔𝗳𝗿𝗶𝗰𝗮 𝗧𝗶𝗺𝗲𝘇𝗼𝗻𝗲 (𝗘𝗔𝗧).";

        await m.reply(message);
    } catch (error) {
        m.reply('Something went wrong. Unable to fetch matches.' + error);
    }
};
break;		      
		      
//========================================================================================================================//
//========================================================================================================================//		      
//========================================================================================================================//		      
case 'sc': case 'script': case 'repo':

 client.sendMessage(m.chat, { image: { url: `https://files.catbox.moe/m38sqm.jpg` }, caption: stylishReply(
` Hello👋 *${pushname}*,
╔══≪ ✦ ≫══════════≪ ✦ ≫══╗
          BLACK DEMON ☯☸
 The Ultimate WhatsApp Bot
╚══≪ ✦ ≫══════════≪ ✦ ≫══╝\n\n🔷 Github Repo:
   ↳ https://github.com/Finjohns/Black-Demon
   ★ Don't forget to Fork & Star!.\n\n WhatsApp Pair:
   ↳ https://test-pair-cmxx.onrender.com
   ★ Save your Session-ID!\n\n.⚙️ Requrements:
   ✓ Complete all variables
   ✓ Keep API keys secure
   ✓ Deploy properly\n\n╔══≪ ✦ ≫═══════════════≪ ✦ ≫══╗
  Made with ❤️ by JinwiilTech
╚══≪ ✦ ≫═══════════════≪ ✦ ≫══╝\n\nMade in Kenya 🫰🏻🔥!`)},{quoted : m });

   break;
                                                  
//========================================================================================================================//
		      case 'closetime':
                if (!m.isGroup) throw group;
                if (!isAdmin) throw admin;
                if (!isBotAdmin) throw botAdmin;
                if (args[1] == 'second') {
                    var timer = args[0] * `1000`
                } else if (args[1] == 'minute') {
                    var timer = args[0] * `60000`
                } else if (args[1] == 'hour') {
                    var timer = args[0] * `3600000`
                } else if (args[1] == 'day') {
                    var timer = args[0] * `86400000`
                } else {
                    return reply('*select:*\nsecond\nminute\nhour\n\n*Example*\n10 second')
                }
                reply(`Countdown of  ${q} starting from now to close the group`)
                setTimeout(() => {
                    var nomor = m.participant
                    const close = `Group has been closed`
                    client.groupSettingUpdate(m.chat, 'announcement')
                    reply(close)
                }, timer)
		      
                break;

//========================================================================================================================//		      
		      case 'opentime':
                if (!m.isGroup) throw group;
                if (!isAdmin) throw admin;
                if (!isBotAdmin) throw botAdmin;
                if (args[1] == 'second') {
                    var timer = args[0] * `1000`
                } else if (args[1] == 'minute') {
                    var timer = args[0] * `60000`
                } else if (args[1] == 'hour') {
                    var timer = args[0] * `3600000`
                } else if (args[1] == 'day') {
                    var timer = args[0] * `86400000`
                } else {
                    return reply('*select:*\nsecond\nminute\nhour\n\n*example*\n10 second')
                }
                reply(`Countdown of ${q} starting from now to open the group`)
                setTimeout(() => {
                    var nomor = m.participant
                    const open = `Group has been Open`
                    client.groupSettingUpdate(m.chat, 'not_announcement')
                    reply(open)
                }, timer)
                 break;

//========================================================================================================================//		      
 case "close": case "mute": { 
  
                 if (!m.isGroup) throw group; 
                 if (!isBotAdmin) throw botAdmin; 
                 if (!isAdmin) throw admin; 
  
                     await client.groupSettingUpdate(m.chat, 'announcement'); 
 m.reply('Group successfully locked!'); 
 } 
 break; 

//========================================================================================================================//		      
 case "open": case "unlock": case "unmute": {
                 if (!m.isGroup) throw group; 
                 if (!isBotAdmin) throw botAdmin; 
                 if (!isAdmin) throw admin; 
  
                     await client.groupSettingUpdate(m.chat, 'not_announcement'); 
 m.reply('Group successfully unlocked!'); 
  
 }
        break; 

//========================================================================================================================//		      
          case "disp-1": { 
                 if (!m.isGroup) throw group; 
                 if (!isBotAdmin) throw botAdmin; 
                 if (!isAdmin) throw admin; 
  
                     await client.groupToggleEphemeral(m.chat, 1*24*3600); 
 m.reply('Dissapearing messages successfully turned on for 24hrs!'); 
 } 
 break; 

//========================================================================================================================//		      
          case "promote" : { 
                 if (!m.isGroup) throw group; 
         if (!isBotAdmin) throw botAdmin; 
         if (!isAdmin) throw admin; 
 if (!m.quoted) throw `Ttag someone with the command!`; 
                 let users = m.mentionedJid[0] ? m.mentionedJid : m.quoted ? [m.quoted.sender] : [text.replace(/[^0-9]/g, '')+'@s.whatsapp.net']; 
  
                 await client.groupParticipantsUpdate(m.chat, users, 'promote'); 
 m.reply('Successfully promoted! ⏫'); 
         } 
 break; 

//========================================================================================================================//		      
           case "demote": { 
                 if (!m.isGroup) throw group; 
         if (!isBotAdmin) throw botAdmin; 
         if (!isAdmin) throw admin; 
 if (!m.quoted) throw `Ttag someone with the command!`; 
                 let users = m.mentionedJid[0] ? m.mentionedJid : m.quoted ? [m.quoted.sender] : [text.replace(/[^0-9]/g, '')+'@s.whatsapp.net']; 
  
                 await client.groupParticipantsUpdate(m.chat, users, 'demote'); 
 m.reply('Successfully demoted! 😲'); 
         } 
 break;

//========================================================================================================================//		      
          case "disp-7": { 
                 if (!m.isGroup) throw group; 
                 if (!isBotAdmin) throw botAdmin; 
                 if (!isAdmin) throw admin; 
  
                     await client.groupToggleEphemeral(m.chat, 7*24*3600); 
 m.reply('Dissapearing messages successfully turned on for 7 days!'); 
  
 } 
 break; 

//========================================================================================================================//		      
         case "disp-90": { 
                 if (!m.isGroup) throw group; 
                 if (!isBotAdmin) throw botAdmin; 
                 if (!isAdmin) throw admin; 
  
                     await client.groupToggleEphemeral(m.chat, 90*24*3600); 
 m.reply('Dissapearing messages successfully turned on for 90 days!'); 
 } 
 break; 

//========================================================================================================================//		      
        case "disp-off": { 
                 if (!m.isGroup) throw group; 
                 if (!isBotAdmin) throw botAdmin; 
                 if (!isAdmin) throw admin; 
  
                     await client.groupToggleEphemeral(m.chat, 0); 
 m.reply('Dissapearing messages successfully turned off!'); 
 }
   break;

//========================================================================================================================//		      
 case "icon": { 
    if (!m.isGroup) throw group; 
    if (!isAdmin) throw admin; 
    if (!isBotAdmin) throw botAdmin; 
    if (!quoted) throw `Send or tag an image with the caption ${prefix + command}`; 
    if (!/image/.test(mime)) throw `Send or tag an image with the caption ${prefix + command}`; 
    if (/webp/.test(mime)) throw `Send or tag an image with the caption ${prefix + command}`; 
    let media = await client.downloadAndSaveMediaMessage(quoted); 
    await client.updateProfilePicture(m.chat, { url: media }).catch((err) => fs.unlinkSync(media)); 
    reply('Group icon updated'); 
    } 
    break;

//========================================================================================================================//		      
          case "revoke": 
 case "newlink": 
 case "reset": { 
   if (!m.isGroup) throw group; // add "new Error" to create a new Error object 
   if (!isAdmin) throw admin; // add "new Error" to create a new Error object 
   if (!isBotAdmin) throw botAdmin; // add "new Error" to create a new Error object 
   await client.groupRevokeInvite(m.chat); 
   await client.sendText(m.chat, 'Group link revoked!', m); // use "client.sendText" instead of "m.reply" to ensure message is sent 
   let response = await client.groupInviteCode(m.chat); 
 client.sendText(m.sender, `https://chat.whatsapp.com/${response}\n\nHere is the new group link for ${groupMetadata.subject}`, m, { detectLink: true }); 
 client.sendText(m.chat, `Sent you the new group link in your inbox!`, m); 
   // use "client.sendTextWithMentions" instead of "client.sendText" to include group name in message 
 }          
  break;

//========================================================================================================================//		      
          case "delete": case "del": { 
                  if (!m.isGroup) throw group; 
  if (!isBotAdmin) throw botAdmin; 
  if (!isAdmin) throw admin; 
    if (!m.quoted) throw `No message quoted for deletion`; 
     const deleteKey = {
       remoteJid: m.chat,
       fromMe: Boolean(m.quoted.fromMe),
       id: m.quoted.id
     };
     if (!deleteKey.fromMe && m.quoted.sender) {
       deleteKey.participant = m.quoted.sender;
     }
     await client.sendMessage(m.chat, { delete: deleteKey });
  } 
 break;

//========================================================================================================================//		      
          case "leave": { 
                 if (!Owner) throw NotOwner;
		 if (!m.isGroup) throw group;
 await client.sendMessage(m.chat, { text : 'Goodbye Black-Demon Ai is leaving youll...' , mentions: participants.map(a => a.id)}, { quoted : m }); 
                 await client.groupLeave(m.chat); 
  
             } 
 break; 

//========================================================================================================================//		      
          case "subject": case "changesubject": { 
                 if (!m.isGroup) throw group; 
                 if (!isBotAdmin) throw botAdmin; 
                 if (!isAdmin) throw admin; 
                 if (!text) throw 'Provide the text for the group subject.'; 
                 await client.groupUpdateSubject(m.chat, text); 
 m.reply('Group name successfully updated! 💀'); 
             } 
             break; 

//========================================================================================================================//		      
           case "desc": case "setdesc": { 
                 if (!m.isGroup) throw group; 
                 if (!isBotAdmin) throw botAdmin; 
                 if (!isAdmin) throw admin; 
                 if (!text) throw 'Provide the text for the group description' 
                 await client.groupUpdateDescription(m.chat, text); 
 m.reply('Group description successfully updated! 🥶'); 
             } 
 break; 

//========================================================================================================================//		      
     case "hidetag": case "tag": {
             if (!m.isGroup) throw group;
             if (!isAdmin) throw admin;
             const mentionIds = participants.map(participant => participant.id).filter(Boolean);
             if (!mentionIds.length) return m.reply("I could not read the group members. Please try again.");
            await client.sendMessage(m.chat, {
              text: q || 'BLACK-DEMON 𝗕𝗹𝗶𝗻𝗱 𝗧𝗮𝗴𝘀😅',
              mentions: mentionIds
            }, { quoted: m });
             }
 break; 

//========================================================================================================================//		      
      case "tagall": {
                 if (!m.isGroup) throw group;
                 if (!isAdmin) throw admin;
                 const mentionIds = participants.map(participant => participant.id).filter(Boolean);
                 if (!mentionIds.length) return m.reply("I could not read the group members. Please try again.");
 let teks = `BLACK-DEMON TAGS 🚀:

  ${q || 'Everyone, please check this message.'}\n\n`;
                 for (let mem of participants) { 
                 teks += `𓅂 @${mem.id.split('@')[0]}\n`; 
                 } 
                 await client.sendMessage(m.chat, { text: teks, mentions: mentionIds }, { quoted: m });
                 } 
 break;

//========================================================================================================================//		      
case "whatsong": case "shazam":
                return reply("That command is not in the current menu.");
      break;

//========================================================================================================================//      
        case "s": case "sticker": 
{
if(!m.quoted) return m.reply('Quote an image or a short video.');

const quotedType = m.quoted.mtype || "";
if (quotedType !== "imageMessage" && quotedType !== "videoMessage") {
  return m.reply('That is neither an image nor a short video!');
}

try {
  const mediaBuffer = await m.quoted.download();
  const stickerOptions = {
    packname,
    author,
    categories: ["🤩", "🎉"],
  };
  const stickerFile = quotedType === "videoMessage"
    ? await client.sendVideoAsSticker(m.chat, mediaBuffer, m, stickerOptions)
    : await client.sendImageAsSticker(m.chat, mediaBuffer, m, stickerOptions);
  if (typeof stickerFile === "string") {
    await fs.promises.unlink(stickerFile).catch(() => {});
  }
} catch (error) {
  console.error("Sticker conversion failed:", error.message);
  await m.reply("Sticker conversion failed. Use a smaller image or video.");
}

}
break;

//========================================================================================================================//		      
          case "dp": { 
 try { 
 ha = m.quoted.sender; 
 qd = await client.getName(ha); 
 pp2 = await client.profilePictureUrl(ha,'image'); 
 } catch {  
 pp2 = 'https://tinyurl.com/yx93l6da'; 
 } 
  if (!m.quoted) throw `Tag a user!`; 
 bar = `Profile Picture of ${qd}`; 
 client.sendMessage(m.chat, { image: { url: pp2}, caption: bar, fileLength: "999999999999"}, { quoted: m}); 
 } 
 break;

//========================================================================================================================//		      

//========================================================================================================================//		      
  case "vv": case "vv3": case "retrieve": {
    if (!m.quoted) return m.reply("quote a view-once message eh");
    const copied = await sendViewOnceCopy(
      client,
      m.quoted,
      m.chat,
      "Retrieved by Black-Demon♣♠!"
    );
    if (!copied) return m.reply("The quoted message is not a supported view-once image, video, audio, document, or sticker.");
    break;
  }

//========================================================================================================================//		      
	 case "vv2": case "mmmh": case "😍": {
    if (!m.quoted) return m.reply("quote a view-once message eh");
    const copied = await sendViewOnceCopy(
      client,
      m.quoted,
      client.decodeJid(client.user.id),
      "Retrieved by Black-Demon♣♠!"
    );
    if (!copied) return m.reply("The quoted message is not a supported view-once image, video, audio, document, or sticker.");
    break;
  }

//========================================================================================================================//		      
    case 'take': case 't': {
      if (!m.quoted) {
        return m.reply("Quote an image, short video, or sticker to change its watermark.");
      }

      const requestedStickerName = text.trim();
      const stickerOwner = requestedStickerName || pushname || author || botname;

      const quotedType = m.quoted.mtype || "";
      if (!["imageMessage", "videoMessage", "stickerMessage"].includes(quotedType)) {
        return m.reply("This is not an image, video, or sticker.");
      }

      try {
        const mediaBuffer = await m.quoted.download();
        if (!mediaBuffer || !mediaBuffer.length) {
          return m.reply("I couldn't download the quoted media. Please try again.");
        }

        const stickerOptions = {
          packname: stickerOwner,
          author: stickerOwner,
          categories: ["🤩", "🎉"],
        };
        if (quotedType === "stickerMessage") {
          await client.sendWebpStickerWithMetadata(m.chat, mediaBuffer, m, stickerOptions);
          return;
        }
        const stickerFile = quotedType === "videoMessage"
          ? await client.sendVideoAsSticker(m.chat, mediaBuffer, m, stickerOptions)
          : await client.sendImageAsSticker(m.chat, mediaBuffer, m, stickerOptions);

        if (typeof stickerFile === "string") {
          await fs.promises.unlink(stickerFile).catch(() => {});
        }
      } catch (error) {
        console.error("Watermark sticker conversion failed:", error.message);
        await m.reply("Sticker conversion failed. Use a smaller image or video and try again.");
      }
    }
break;

//========================================================================================================================//	  
case 'ytsearch':
    case 'yts': {
        if (!text) {
            reply('Provide a search term!\E.g: Alan walker alone')
            return;
        }
        const term = text;
        const {
            videos
        } = await yts(term);
        if (!videos || videos.length <= 0) {
            reply(`No Matching videos found for : *${term}*!!`)
            return;
        }
        const length = videos.length < 10 ? videos.length : 10;
        let tex = `YouTube Search\n🔍 Query ~> ${term}\n\n`;
        for (let i = 0; i < length; i++) {
            tex += `Link ~> ${videos[i].url}\nChannel ~> ${videos[i].author.name}\nTitle ~> ${videos[i].title}\n\n`;
        }
        reply(tex)
        return;
    }
    break;

//========================================================================================================================//		      
case "ytmp3": case "yta": {
const ytSearch = require("yt-search");
const fetch = require('node-fetch');
try {

if (!text) return m.reply("𝗣𝗿𝗼𝘃𝗶𝗱𝗲 𝗮 𝘃𝗮𝗹𝗶𝗱 𝗬𝗼𝘂𝘁𝘂𝗯𝗲 𝗹𝗶𝗻𝗸!")

		const urlYt = await resolveYouTubeUrl(text);
		if (!urlYt) return m.reply('𝗡𝗼 𝗬𝗼𝘂𝗧𝘂𝗯𝗲 𝗿𝗲𝘀𝘂𝗹𝘁 𝗳𝗼𝘂𝗻𝗱.');
        let data = await fetchJson(`https://api.dreaded.site/api/ytdl/audio?url=${urlYt}`);

        if (!data || !data.result || !data.result.url) return sendYouTubeAudioFallback(client, m.chat, urlYt, m);

        const audioUrl = data.result.url;
const title = data.result.title;

        await client.sendMessage(
            m.chat,
            {
                audio: { url: audioUrl },
                mimetype: "audio/mpeg",
                fileName: `${title}.mp3`,
            },
            { quoted: m }
        );
    } catch (error) {
        try {
            const fallbackUrl = await resolveYouTubeUrl(text);
            if (!fallbackUrl) throw new Error("No YouTube result found");
            await sendYouTubeAudioFallback(client, m.chat, fallbackUrl, m);
        } catch (fallbackError) {
            await m.reply("Download failed\n" + fallbackError.message);
        }
    }
}
  break;

//========================================================================================================================//		      
case 'ytmp4':
case "ytv": {
	try {

if (!text) return m.reply("𝗣𝗿𝗼𝘃𝗶𝗱𝗲 𝗮 𝘃𝗮𝗹𝗶𝗱 𝗬𝗼𝘂𝗧𝘂𝗯𝗲 𝗹𝗶𝗻𝗸!")

	        const urlYt = await resolveYouTubeUrl(text);
	        if (!urlYt) return m.reply('𝗡𝗼 𝗬𝗼𝘂𝗧𝘂𝗯𝗲 𝗿𝗲𝘀𝘂𝗹𝘁 𝗳𝗼𝘂𝗻𝗱.');
        let data = await fetchJson(`https://api.dreaded.site/api/ytdl/video?url=${urlYt}`);

        if (!data || !data.result || !data.result.url) return sendYouTubeVideoFallback(client, m.chat, urlYt, m);

        const audioUrl = data.result.url;
const title = data.result.title;


        await client.sendMessage(
            m.chat,
            {
                video: { url: audioUrl },
                mimetype: "video/mp4",
                fileName: `${title}.mp4`,
            },
            { quoted: m }
        );
    } catch (error) {
        try {
            const fallbackUrl = await resolveYouTubeUrl(text);
            if (!fallbackUrl) throw new Error("No YouTube result found");
            await sendYouTubeVideoFallback(client, m.chat, fallbackUrl, m);
        } catch (fallbackError) {
            await m.reply("Download failed\n" + fallbackError.message);
        }
    }
}        
break;
			  //=========================quotes============

//========================================================================================================================//		      
    case "ping": case "speed": {
                 
	    // await loading ()
		
	let quoteText = "Keep pushing forward.";
  let quoteAuthor = "Unknown";
  try {
    const res = await axios.get('https://zenquotes.io/api/random');
    if (Array.isArray(res.data) && res.data[0]) {
      quoteText = res.data[0].q;
      quoteAuthor = res.data[0].a;
    }
  } catch (err) {
    console.log("⚠️ Quote fetch failed:", err.message);
  }
		  // 🧠 Get random quote
 
		m.reply ( stylishReply(`🪔 Response time\n ${Rspeed.toFixed(4)} Ms\n\nRuntime\n${runtime(process.uptime())}\n\nQuate\n${quoteText}`)); 
         } 
 break; 
			  
//==========================pind2===============
			  
//========================================================================================================================//		      
 case "uptime": { 
	       //const temp = await reply('⚡ Checking bot status...');
	 let quoteText = "Keep pushing forward.";
  let quoteAuthor = "Unknown";
  try {
    const res = await axios.get('https://zenquotes.io/api/random');
    if (Array.isArray(res.data) && res.data[0]) {
      quoteText = res.data[0].q;
      quoteAuthor = res.data[0].a;
    }
  } catch (err) {
    console.log("⚠️ Quote fetch failed:", err.message);
  }
		  // 🧠 Get random quote
                  m.reply (stylishReply(`${runtime(process.uptime())}\n\nQuate\n${quoteText}`)); 
	  
 } 
 break;
			
//========================================================================================================================//		      
	case 'runtime':
		let raven = `Black-Demon🐈‍⬛🖤 has been running since${runtime(process.uptime())}`
                client.sendMessage(m.chat, {
                    text: raven,
                    contextInfo: {
                        externalAdReply: {
                            showAdAttribution: true,
                            title: 'BLACK DEMON👿',
                            body: 'https://whatsapp.com/channel/0029VaxZbeSDTkJwBgUb9u3N',
                            thumbnailUrl: 'https://files.catbox.moe/b15b6u.jpg',
                            sourceUrl: 'https://whatsapp.com/channel/0029VaxZbeSDTkJwBgUb9u3N',
                            mediaType: 1,
                            renderLargerThumbnail: true
                        }
                    }
                }, {
                    quoted: m
                })
                break;

//========================================================================================================================//		      
  case "apk":
      case "app":{
          if (!text) return reply("Where is the app name?");
        let kyuu = await fetchJson (`https://bk9.fun/search/apk?q=${text}`);
        let tylor = await fetchJson (`https://bk9.fun/download/apk?id=${kyuu.BK9[0].id}`);
         await client.sendMessage(
              m.chat,
              {
                document: { url: tylor.BK9.dllink },
                fileName: tylor.BK9.name,
                mimetype: "application/vnd.android.package-archive",
                contextInfo: {
        externalAdReply: {
          title: `BLACK-DEMON🐈‍⬛🖤`,
          body: `${tylor.BK9.name}`,
          thumbnailUrl: `${tylor.BK9.icon}`,
          sourceUrl: `${tylor.BK9.dllink}`,
          mediaType: 2,
          showAdAttribution: true,
          renderLargerThumbnail: false
        }
      }
    }, { quoted: m });
          }
      break;

//========================================================================================================================//		      
          case "mix": {
if (!text) return m.reply("No emojis provided ? ")

  const emojis = text.split('+');

  if (emojis.length !== 2) {
    m.reply("Specify the emojis and separate with '+'");
    return;
  }

  const emoji1 = emojis[0].trim();
  const emoji2 = emojis[1].trim();

  try {
    const response = await axios.get(`https://levanter.onrender.com/emix?q=${emoji1}${emoji2}`);

    if (response.data.status === true) {
      const stickerFile = await client.sendImageAsSticker(
        m.chat,
        response.data.result,
        m,
        { packname: botname, author, categories: ["🤩", "🎉"] }
      );
      if (typeof stickerFile === "string") {
        await fs.promises.unlink(stickerFile).catch(() => {});
      }

    } else {
      await m.reply("Unable to create emoji mix.");
    }
  } catch (error) {
    console.error("Emoji mix failed:", error.message);
    await m.reply("An error occurred while creating the emoji mix.");
  }
      }
	  break;

//========================================================================================================================//		      
          case "lyrics": {
		      const fetch = require('node-fetch');
 const apiUrl = `https://api.dreaded.site/api/lyrics?title=${encodeURIComponent(text)}`;

    try {
        if (!text) return m.reply("Provide a song name!");

        const data = await fetchJson(apiUrl);

        if (!data.success || !data.result || !data.result.lyrics) {
            return m.reply(`Sorry, I couldn't find any lyrics for "${text}".`);
        }

        const { title, artist, link, thumb, lyrics } = data.result;

        const imageUrl = thumb || "https://i.imgur.com/Cgte666.jpeg";

        const imageBuffer = await fetch(imageUrl)
            .then(res => res.buffer())
            .catch(err => {
                console.error('Error fetching image:', err);
                return null;
            });

        if (!imageBuffer) {
            return m.reply("An error occurred while fetching the image.");
        }

        const caption = `**Title**: ${title}\n**Artist**: ${artist}\n\n${lyrics}`;

        await client.sendMessage(
            m.chat,
            {
                image: imageBuffer,
                caption: caption
            },
            { quoted: m }
        );
    } catch (error) {
        console.error(error);
        m.reply(`An error occurred while fetching the lyrics for "${text}".`);
    }
      }
	break;

//========================================================================================================================//		      
         case "photo": { 
    if (!quoted) throw 'Tag a static video with the command!'; 
    if (!/webp/.test(mime)) throw `Tag a sticker with ${prefix + command}`; 
  
    let media = await client.downloadAndSaveMediaMessage(quoted); 
    let mokaya = await getRandom('.png'); 
    exec(`ffmpeg -i ${media} ${mokaya}`, (err) => { 
   fs.unlinkSync(media); 
   if (err) throw err 
   let buffer = fs.readFileSync(mokaya); 
   client.sendMessage(m.chat, { image: buffer, caption: `𝗖𝗼𝗻𝘃𝗲𝗿𝘁𝗲𝗱 𝗯𝘆 Black-Demon🐈‍⬛🖤`}, { quoted: m }) 
   fs.unlinkSync(mokaya); 
    }); 
    } 
     break;

//========================================================================================================================//		      
   case "movie": 
             if (!text) return reply(`Provide a series or movie name.`);  
             let fids = await axios.get(`http://www.omdbapi.com/?apikey=${process.env.OMDB_API_KEY || ''}&t=${encodeURIComponent(text)}&plot=full`);  
              let imdbt = "";  
              console.log(fids.data)  
              imdbt += "⚍⚎⚎⚎⚎⚎⚎⚎⚎⚎⚎⚎⚎⚎⚎⚍\n" + " ``` IMDB MOVIE SEARCH```\n" + "⚎⚎⚎⚎⚎⚎⚎⚎⚎⚎⚎⚎⚎⚎⚎⚎\n";  
              imdbt += "🎬Title      : " + fids.data.Title + "\n";  
              imdbt += "📅Year       : " + fids.data.Year + "\n";  
              imdbt += "⭐Rated      : " + fids.data.Rated + "\n";  
              imdbt += "📆Released   : " + fids.data.Released + "\n";  
              imdbt += "⏳Runtime    : " + fids.data.Runtime + "\n";  
              imdbt += "🌀Genre      : " + fids.data.Genre + "\n";  
              imdbt += "👨🏻‍💻Director   : " + fids.data.Director + "\n";  
              imdbt += "✍Writer     : " + fids.data.Writer + "\n";  
              imdbt += "👨Actors     : " + fids.data.Actors + "\n";  
              imdbt += "📃Plot       : " + fids.data.Plot + "\n";  
              imdbt += "🌐Language   : " + fids.data.Language + "\n";  
              imdbt += "🌍Country    : " + fids.data.Country + "\n";  
              imdbt += "🎖️Awards     : " + fids.data.Awards + "\n";  
              imdbt += "📦BoxOffice  : " + fids.data.BoxOffice + "\n";  
              imdbt += "🏙️Production : " + fids.data.Production + "\n";  
              imdbt += "🌟imdbRating : " + fids.data.imdbRating + "\n";  
              imdbt += "❎imdbVotes  : " + fids.data.imdbVotes + "";  
             client.sendMessage(from, {  
                  image: {  
                      url: fids.data.Poster,  
                  },  
                  caption: stylishReply(imdbt),  
              },  
                 { quoted: m }); 
  
                       break;
		      
//========================================================================================================================//                                   
  case "linkgroup": case "link": { 
                 if (!m.isGroup) throw group; 
                 if (!isBotAdmin) throw botAdmin; 
                 let response = await client.groupInviteCode(m.chat); 
                 client.sendText(m.chat, `https://chat.whatsapp.com/${response}\n\nGroup link for  ${groupMetadata.subject}`, m, { detectLink: true }); 
             } 
          break;
       
//========================================================================================================================//
          case 'botpp': { 
    if (!Owner) throw NotOwner; 
    if (!quoted) throw `Tag an image you want to be the bot's profile picture with ${prefix + command}`; 
    if (!/image/.test(mime)) throw `Tag an image you want to be the bot's profile picture with ${prefix + command}`; 
    if (/webp/.test(mime)) throw `Tag an image you want to be the bot's profile picture with ${prefix + command}`; 
    let media = await client.downloadAndSaveMediaMessage(quoted);
		
                    await client.updateProfilePicture(botNumber, { url: media }).catch((err) => fs.unlinkSync(media)); 
    reply `Bot's profile picture has been successfully updated!`; 
	  }
    break;

//========================================================================================================================//		      
          case 'broadcast': { 
         if (!Owner) { 
             throw NotOwner
             return; 
         } 
         if (!text) { 
             reply("❌ No broadcast message provided!") 
             return; 
         } 
         let getGroups = await client.groupFetchAllParticipating() 
         let groups = Object.entries(getGroups) 
             .slice(0) 
             .map(entry => entry[1]) 
         let res = groups.map(v => v.id) 
         reply(` Broadcasting in ${res.length} Group Chat, in ${res.length * 1.5} seconds`) 
         for (let i of res) { 
             let txt = `BLACK- DEMON 🐈‍⬛🖤HAS BROADCAST  >\n\n🀄 Message: ${text}\n\nAuthor: ${pushname}` 
             await client.sendMessage(i, { 
                 image: { 
                     url: "https://telegra.ph/file/416c3ae0cfe59be8db011.jpg" 
                 }, 
                 caption: stylishReply(`${txt}`) 
             }) 
         } 
         reply(`Broadcasted to ${res.length} Groups.`) 
     } 
 break;

//========================================================================================================================//		      
 case "gemini": {
    try {
        if (!text) return m.reply("This is Black-MD, an AI using Gemini APIs to process text, provide yr query");
    
        const { default: Gemini } = await import('gemini-ai');

        const gemini = new Gemini("AIzaSyDJUtskTG-MvQdlT4tNE319zBqLMFei8nQ");
        const chat = gemini.createChat();

        const res = await chat.ask(text);

        await m.reply(res);
    } catch (e) {
        m.reply("I am unable to generate responses\n\n" + e);
    }
 }
 break;

//========================================================================================================================//		      
        case "autostatus": case "autolike": case "autorecord": case "autotyping": {
          if (!Owner) throw NotOwner;
          const requested = String(args[0] || "").toLowerCase();
          if (!/^(on|off|true|false|yes|no)$/i.test(requested)) {
            return m.reply(`Usage: ${prefix}${command} on|off`);
          }
          const settingKey = {
            autostatus: "AUTOVIEW_STATUS",
            autolike: "AUTOLIKE_STATUS",
            autorecord: "AUTORECORD",
            autotyping: "AUTOTYPING"
          }[command];
          const enabled = /^(on|true|yes)$/i.test(requested);
          const saved = setSetting(settingKey, enabled ? "TRUE" : "FALSE");
          await m.reply(`✅ ${command} ${saved === "TRUE" ? "ON" : "OFF"}.`);
        }
  break;
//========================================================================================================================//
        case "setvar": {
          if (!Owner) throw NotOwner;
          const separator = text.indexOf("=");
          if (separator < 1) {
            return m.reply("Incorrect usage. Example: .setvar AUTO STATUS=ON");
          }
          const key = normalizeSettingKey(text.slice(0, separator));
          let value = text.slice(separator + 1).trim();
          if (!key || !value) return m.reply("Both a setting name and value are required.");
          if (/^(on|yes|enabled)$/i.test(value)) value = "TRUE";
          if (/^(off|no|disabled)$/i.test(value)) value = "FALSE";
          if (/^(SESSION|HEROKU_API|OPENAI_API_KEY|GENIUS_ACCESS_TOKEN)$/i.test(key)) {
            return m.reply("That sensitive setting cannot be changed through WhatsApp.");
          }
          const savedValue = setSetting(key, value);
          await m.reply(`✅ ${key}=${savedValue} saved and active.`);
        }
  break;
		      
//========================================================================================================================//	
		      case "dlt":{ 
 if (!m.quoted) throw `No message quoted for deletion`; 
 let { chat, fromMe, id, isBaileys } = m.quoted; 
 if (isBaileys) throw `I cannot delete. Quoted message is my message or another bot message.`; 
 client.sendMessage(m.chat, { delete: { remoteJid: m.chat, fromMe: true, id: m.quoted.id, participant: m.quoted.sender } }); 
 } 
 break;
 
//========================================================================================================================//
case "block": { 
 if (!Owner) throw NotOwner; 
 if (!m.quoted) throw `𝗧𝗮𝗴 𝘀𝗼𝗺𝗲𝗼𝗻𝗲!`  
 let users = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : text.replace(/[^0-9]/g, '')+'@s.whatsapp.net'
	 if (users == "254769365617@s.whatsapp.net") return m.reply("𝗜 𝗰𝗮𝗻𝗻𝗼𝘁 𝗯𝗹𝗼𝗰𝗸 𝗺𝘆 𝗢𝘄𝗻𝗲𝗿 😡");
		  if (users  == client.decodeJid(client.user.id)) throw '𝗜 𝗰𝗮𝗻𝗻𝗼𝘁 𝗯𝗹𝗼𝗰𝗸 𝗺𝘆𝘀𝗲𝗹𝗳 𝗶𝗱𝗶𝗼𝘁 😡';
 await client.updateBlockStatus(users, 'block'); 
 m.reply (`𝗕𝗹𝗼𝗰𝗸𝗲𝗱 𝘀𝘂𝗰𝗰𝗲𝘀𝗳𝘂𝗹𝗹𝘆!`); 
 } 
 break; 

//========================================================================================================================//		      
 case "unblock": { 
 if (!Owner) throw NotOwner; 
 if (!m.quoted) throw `𝗧𝗮𝗴 𝘀𝗼𝗺𝗲𝗼𝗻𝗲!`; 
 let users = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : text.replace(/[^0-9]/g, '')+'@s.whatsapp.net'; 
 await client.updateBlockStatus(users, 'unblock'); 
 m.reply (`𝗨𝗻𝗯𝗹𝗼𝗰𝗸𝗲𝗱 𝘀𝘂𝗰𝗰𝗲𝘀𝗳𝘂𝗹𝗹𝘆✅!`); 
 } 
 break;

//========================================================================================================================//		      
          case 'join': { 
                 if (!Owner) throw NotOwner
                 if (!text) return reply("provide a valid group link") 
                 let result = args[0].split('https://chat.whatsapp.com/')[1] 
                 await client.groupAcceptInvite(result).then((res) =>  reply(jsonformat(res))).catch((err) =>reply(`Link has problem.`)) 
  
             }  
               break;

//========================================================================================================================//		      
      case "enc": case "encrypt": case "encrypte": {
	const Obf = require("javascript-obfuscator");

    // Check if the quoted message has text
    if (m.quoted && m.quoted.text) {
        const forq = m.quoted.text;

        // Obfuscate the JavaScript code
        const obfuscationResult = Obf.obfuscate(forq, {
            compact: true,
            controlFlowFlattening: true,
            controlFlowFlatteningThreshold: 1,
            numbersToExpressions: true,
            simplify: true,
            stringArrayShuffle: true,
            splitStrings: true,
            stringArrayThreshold: 1
        });

        console.log("Successfully encrypted the code");
        m.reply(obfuscationResult.getObfuscatedCode());
    } else {
        m.reply("Quote/Tag a valid JavaScript code to encrypt!");
    }
}
	break;

//========================================================================================================================//		      
        case 'gpt3': {
        if (!text) return reply(`Hello there, How can i help you?`);
          let d = await fetchJson(
            `https://bk9.fun/ai/blackbox?q=${text}`
          );
          if (!d.BK9) {
            return reply(
              "An error occurred while fetching the AI chatbot response. Please try again later."
            );
          } else {
            reply(d.BK9);
          }
	}
break;

//========================================================================================================================//		      
	      case 'gcprofile': {
 function convertTimestamp(timestamp) {
  const d = new Date(timestamp * 1000);
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return {
    date: d.getDate(),
    month: new Intl.DateTimeFormat('en-US', { month: 'long' }).format(d),
    year: d.getFullYear(),
    day: daysOfWeek[d.getUTCDay()],
    time: `${d.getUTCHours()}:${d.getUTCMinutes()}:${d.getUTCSeconds()}`
  }
}

if (!m.isGroup) return m.reply("This command is meant for groups");

let info = await client.groupMetadata(m.chat);

let ts = await convertTimestamp(info.creation);

try {
        pp = await client.profilePictureUrl(chat, 'image');
      } catch {
        pp = 'https://i.imgur.com/l6rYr1f.jpeg';
      }

await client.sendMessage(m.chat, { image: { url: pp }, 
          caption: `_Name_ : *${info.subject}*\n\n_ID_ : *${info.id}*\n\n_Group owner_ : ${'@'+info.owner.split('@')[0]} || 'No Creator'\n\n_Group created_ : *${ts.day}, ${ts.date} ${ts.month} ${ts.year}, ${ts.time}*\n\n_Participants_ : *${info.size}*\n_Members_ : *${info.participants.filter((p) => p.admin == null).length}*\n\n_Admins_ : *${Number(info.participants.length - info.participants.filter((p) => p.admin == null).length)}*\n\n_Who can send message_ : *${info.announce == true ? 'Admins' : 'Everyone'}*\n\n_Who can edit group info_ : *${info.restrict == true ? 'Admins' : 'Everyone'}*\n\n_Who can add participants_ : *${info.memberAddMode == true ? 'Everyone' : 'Admins'}*`
        }, {quoted: m })

}
	 break;

//========================================================================================================================//		      
   case 'tovideo': case 'mp4': case 'tovid': {
			
                if (!quoted) return reply('Reply to Sticker')
                if (!/webp/.test(mime)) return reply(`reply sticker with caption *${prefix + command}*`)
                
		        let webp2mp4File = await fetch(`https://bk9.fun/converter/webpToMp4?url=${quoted}`)
                let media = await client.downloadAndSaveMediaMessage(quoted)
                let webpToMp4 = await webp2mp4File(media)
                await client.sendMessage(m.chat, { video: { url: webpToMp4.result, caption: 'Convert Webp To Video' } }, { quoted: m })
                await fs.unlinkSync(media)
            }
            break;
//========================================================================================================================//
//========================================================================================================================//        
        default: {
          if (cmd && budy.toLowerCase() != undefined) {
            if (m.chat.endsWith("broadcast")) return;
            if (m.isBaileys) return;
            if (!budy.toLowerCase()) return;
            if (argsLog || (cmd && !m.isGroup)) {
              // client.sendReadReceipt(m.chat, m.sender, [m.key.id])
              console.log(chalk.black(chalk.bgRed("[ ERROR ]")), color("command", "turquoise"), color(`${prefix}${command}`, "turquoise"), color("Raven", "turquoise"));
            } else if (argsLog || (cmd && m.isGroup)) {
              // client.sendReadReceipt(m.chat, m.sender, [m.key.id])
              console.log(chalk.black(chalk.bgRed("[ ERROR ]")), color("command", "turquoise"), color(`${prefix}${command}`, "turquoise"), color("Raven", "turquoise"));
            }
          }
        }
      }
    }
  } catch (err) {
    console.log(util.format(err));
  }
};

module.exports = ravenHandler;
module.exports.cacheIncomingMessage = fastHandleIncomingMessage;
module.exports.handleMessageRevocation = fastHandleMessageRevocation;
module.exports.isMessageRevocation = isMessageRevocation;
module.exports.isStatusRevocation = isStatusRevocation;
module.exports.forwardViewOnceToBot = forwardViewOnceToBot;

let file = require.resolve(__filename);
fs.watchFile(file, () => {
  fs.unwatchFile(file);
  console.log(chalk.redBright(`Update ${__filename}`));
  delete require.cache[file];
  require(file);
});


 
  
