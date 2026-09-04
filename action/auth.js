const fs = require("fs");
const path = require("path");
const zlib = require("zlib");
const { session } = require("../set.js");

const sessionDir = path.resolve(__dirname, "..", "session");
const credsPath = path.join(sessionDir, "creds.json");

function hasUsableCredentials() {
  if (!fs.existsSync(credsPath)) return false;

  try {
    const credentials = JSON.parse(fs.readFileSync(credsPath, "utf8"));
    return credentials && typeof credentials === "object" &&
      Object.keys(credentials).length > 0;
  } catch {
    // The repository contains a one-byte placeholder in some downloads.
    // Treat it as missing so the SESSION value can replace it.
    return false;
  }
}

function decodeSession(value) {
  const trimmed = value.trim();

  // Accept Gifted~..., prefixed ..., or an unprefixed base64 payload.
  // The prefix is only a label; authentication data is decoded locally.
  const payload = trimmed.replace(/^[^:~]+[:~]/, "");
  let encoded;

  try {
    encoded = Buffer.from(payload, "base64");
    if (!encoded.length) throw new Error("empty payload");
  } catch {
    throw new Error("SESSION is not valid base64 data.");
  }

  let json;
  try {
    json = zlib.gunzipSync(encoded);
  } catch {
    json = encoded;
  }

  try {
    const credentials = JSON.parse(json.toString("utf8"));
    if (!credentials || typeof credentials !== "object" ||
        Array.isArray(credentials) || !Object.keys(credentials).length) {
      throw new Error("empty credentials");
    }
    return json;
  } catch {
    throw new Error(
      "SESSION could not be decoded. Use the complete Gifted~ session value."
    );
  }
}

async function authentication() {
  if (hasUsableCredentials()) return;

  if (typeof session !== "string" || !session.trim()) {
    throw new Error("Please add a valid SESSION environment variable.");
  }

  fs.mkdirSync(sessionDir, { recursive: true });
  const data = decodeSession(session);
  fs.writeFileSync(credsPath, data);

  console.log("Session decoded and connected successfully ✅");
}

module.exports = authentication;
