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
const session = SESSION_IN_SET_JS.trim() || getSetting('SESSION');
const autobio = getSetting('AUTOBIO', 'FALSE');
const autolike = getSetting('AUTOLIKE_STATUS', 'FALSE');
const autoviewstatus = getSetting('AUTOVIEW_STATUS', 'TRUE');
const welcomegoodbye = getSetting('WELCOMEGOODBYE', 'FALSE');
const prefix = getSetting('PREFIX', '.');
const appname = getSetting('APP_NAME');
const herokuapi = getSetting('HEROKU_API');
const gptdm = getSetting('GPT_INBOX', 'FALSE');
const mode = getSetting('MODE', 'PRIVATE');
const anticall = getSetting('AUTOREJECT_CALL', 'TRUE');
const botname = getSetting('BOTNAME', 'BLACK-DEMON');
const antibot = getSetting('ANTIBOT', 'FALSE');
const author = getSetting('STICKER_AUTHOR', 'Jinwiil Onginjo');
const packname = getSetting('STICKER_PACKNAME', 'BLACK-DEMON');
const antitag = getSetting('ANTITAG', 'TRUE');
const dev = getSetting('DEV', '254769365617');
const menulink = getSetting('MENU_LINK', 'https://files.catbox.moe/m38sqm.jpg');
const menu = getSetting('MENU_TYPE', 'IMAGE');
const DevRaven = dev.split(",");
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
  ANTIDELETE_STATUS: 'ANTIDELETE_STATUS',
  ANTISTATUSDELETE: 'ANTIDELETE_STATUS'
};

const DISPLAY_SETTINGS = [
  'PREFIX', 'MODE', 'AUTOVIEW_STATUS', 'AUTOLIKE_STATUS', 'ANTIDELETE',
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

module.exports = { session, sessionName, autobio, author, packname, dev, DevRaven, badwordkick, bad, mode, group, NotOwner, botname, botAdmin, antiforeign, menu, autoread, antilink, admin, mycode, antilinkall, anticall, antitag, antidel, antistatusdelete, wapresence, welcomegoodbye, antibot, herokuapi, prefix, port, gptdm, appname, autolike, autoviewstatus, getSetting, setSetting, normalizeSettingKey, getDisplaySettings };
