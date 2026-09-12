const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const readline = require("readline");
const { session, pairingNumber } = require("../set.js");

const sessionDir = path.resolve(__dirname, "..", "session");
const credsPath = path.join(sessionDir, "creds.json");

function hasUsableCredentials() {
  if (!fs.existsSync(credsPath)) return false;

  try {
    const credentials = JSON.parse(fs.readFileSync(credsPath, "utf8"));
    return credentials && typeof credentials === "object" &&
      Object.keys(credentials).length > 0;
  } catch {
    return false;
  }
}

function normalizePairingNumber(value) {
  const normalized = String(value || "").replace(/[^0-9]/g, "");
  if (!/^\d{8,15}$/.test(normalized)) return "";
  return normalized;
}

function promptForNumber() {
  if (!process.stdin || !process.stdin.readable) return Promise.resolve("");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: Boolean(process.stdout.isTTY)
  });
  process.stdin.resume();
  return new Promise(resolve => {
    const ask = () => rl.question(
      "\nNo session found. Enter the WhatsApp number to link, including country code (example: 2547XXXXXXXX): ",
      answer => {
        const normalized = normalizePairingNumber(answer);
        if (!normalized) {
          console.log("Invalid number. Use 8–15 digits including the country code.");
          ask();
          return;
        }
        rl.close();
        resolve(normalized);
      }
    );
    ask();
  });
}

function decodeSession(value) {
  const trimmed = value.trim();
  const payload = trimmed.replace(/^[^:~]+[:~]/, "");
  let encoded;
  try {
    encoded = Buffer.from(payload, "base64");
    if (!encoded.length) throw new Error("empty payload");
  } catch {
    throw new Error("SESSION is not valid base64 data.");
  }

  let json;
  try { json = zlib.gunzipSync(encoded); } catch { json = encoded; }

  try {
    const credentials = JSON.parse(json.toString("utf8"));
    if (!credentials || typeof credentials !== "object" ||
        Array.isArray(credentials) || !Object.keys(credentials).length) {
      throw new Error("empty credentials");
    }
    return json;
  } catch {
    throw new Error("SESSION could not be decoded. Use the complete Jinwiil~ session value.");
  }
}

async function authentication() {
  if (hasUsableCredentials()) return { interactive: false, hasCredentials: true, pairingNumber: "" };

  if (typeof session === "string" && session.trim()) {
    fs.mkdirSync(sessionDir, { recursive: true });
    const data = decodeSession(session);
    fs.writeFileSync(credsPath, data);
    console.log("Session decoded and connected successfully ✅");
    return { interactive: false, hasCredentials: true, pairingNumber: "" };
  }

  fs.mkdirSync(sessionDir, { recursive: true });
  const configured = normalizePairingNumber(pairingNumber);
  const selected = configured || await promptForNumber();
  if (selected) {
    console.log("Pairing number accepted. Do not share the pairing code or QR code.");
  } else {
    console.log("No interactive terminal number was provided. QR authentication remains available.");
    console.log("For non-interactive panels, set PAIRING_NUMBER=2547XXXXXXXX and restart.");
  }
  return { interactive: true, hasCredentials: false, pairingNumber: selected };
}

module.exports = authentication;
module.exports.hasUsableCredentials = hasUsableCredentials;
module.exports.normalizePairingNumber = normalizePairingNumber;
module.exports.decodeSession = decodeSession;
