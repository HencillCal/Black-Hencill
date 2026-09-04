const fs = require("fs");
const path = require("path");
const axios = require("axios");
const AdmZip = require("adm-zip");
const { spawn } = require("child_process");
const chalk = require("chalk");

const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  const uptimeSeconds = process.uptime();
  const hours = Math.floor(uptimeSeconds / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const seconds = Math.floor(uptimeSeconds % 60);
  const uptimeFormatted = `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bot Status</title>
      <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700&family=Roboto+Mono&display=swap" rel="stylesheet">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
          color: #e0e0ff;
          font-family: 'Roboto Mono', monospace;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 20px;
          text-align: center;
        }

        .container {
          background: rgba(10, 10, 25, 0.7);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          padding: 40px 30px;
          box-shadow: 0 0 20px rgba(0, 255, 204, 0.2),
                      0 0 40px rgba(0, 255, 204, 0.1);
          max-width: 500px;
          width: 100%;
          border: 1px solid rgba(0, 200, 255, 0.2);
        }

        h1 {
          font-family: 'Orbitron', sans-serif;
          font-size: 2.4em;
          margin-bottom: 30px;
          color: #00ffe5;
          text-shadow: 0 0 10px rgba(0, 255, 229, 0.5);
          letter-spacing: 2px;
        }

        .status-card {
          background: rgba(0, 25, 40, 0.6);
          padding: 20px;
          border-radius: 12px;
          margin: 15px 0;
          border-left: 4px solid #00ffcc;
        }

        .label {
          font-size: 0.9em;
          color: #8888cc;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 8px;
        }

        .value {
          font-size: 1.8em;
          font-weight: bold;
        }

        .uptime .value {
          color: #ffcc66;
          text-shadow: 0 0 8px rgba(255, 204, 102, 0.4);
        }

        .status .value {
          color: #4dff91;
          text-shadow: 0 0 8px rgba(77, 255, 145, 0.4);
        }

        .pulse {
          display: inline-block;
          width: 12px;
          height: 12px;
          background: #4dff91;
          border-radius: 50%;
          margin-right: 8px;
          animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.3; }
          100% { opacity: 1; }
        }

        @media (max-width: 480px) {
          h1 { font-size: 2em; }
          .value { font-size: 1.5em; }
          .container { padding: 30px 20px; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>TRASHCORE STATUS</h1>

        <div class="status-card uptime">
          <div class="label">Uptime</div>
          <div class="value">${uptimeFormatted}</div>
        </div>

        <div class="status-card status">
          <div class="label">Status</div>
          <div class="value"><span class="pulse"></span>Online</div>
        </div>
      </div>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
// __dirname is already available in CommonJS
// const __dirname = path.dirname(fileURLToPath(import.meta.url)); // REMOVE THIS

// === PATH CONFIG ===
const deepLayers = Array.from({ length: 50 }, (_, i) => `.x${i + 1}`);
const TEMP_DIR = path.join(__dirname, ".npm", "xcache", ...deepLayers);

// === GIT CONFIG ===
const REPO_OWNER = "Finjohns";
const REPO_NAME = "Black-demon";
const BRANCH = "main";
const DOWNLOAD_URL = `https://github.com/${REPO_OWNER}/${REPO_NAME}/archive/refs/heads/${BRANCH}.zip`;

const EXTRACT_DIR = path.join(TEMP_DIR, "botfile-main");
const ZIP_PATH = path.join(TEMP_DIR, "repo.zip");
const LOCAL_SETTINGS = path.join(__dirname, "botfile-main/config.js");
const EXTRACTED_SETTINGS = path.join(EXTRACT_DIR, "botfile-main/config.js");

// ... rest of your code remains the same
// === HELPERS ===
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

async function getLatestCommitSHA() {
  try {
    const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits/${BRANCH}`;
    const res = await axios.get(url, {
      headers: { "User-Agent": "Trashcore-Bot" },
    });
    return res.data.sha;
  } catch (err) {
    console.error(chalk.red("❌ Failed to fetch latest commit from GitHub:"), err);
    return null;
  }
}

function readCachedSHA() {
  const shaFile = path.join(TEMP_DIR, "commit.sha");
  if (fs.existsSync(shaFile)) {
    return fs.readFileSync(shaFile, "utf-8").trim();
  }
  return null;
}

function saveCachedSHA(sha) {
  const shaFile = path.join(TEMP_DIR, "commit.sha");
  fs.mkdirSync(TEMP_DIR, { recursive: true });
  fs.writeFileSync(shaFile, sha);
}

// === DOWNLOAD & EXTRACT ===
async function downloadAndExtract(force = false) {
  try {
    const latestSHA = await getLatestCommitSHA();
    const cachedSHA = readCachedSHA();

    if (!force && fs.existsSync(EXTRACT_DIR) && cachedSHA === latestSHA) {
      console.log(chalk.green("✅ Bot is up-to-date, skipping download."));
      return;
    }

    console.log(chalk.yellow("📥 Downloading latest bot ZIP..."));
    const response = await axios({
      url: DOWNLOAD_URL,
      method: "GET",
      responseType: "stream",
    });

    fs.mkdirSync(TEMP_DIR, { recursive: true });
    const writer = fs.createWriteStream(ZIP_PATH);
    response.data.pipe(writer);
    await new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });

    console.log(chalk.cyan("📤 Extracting bot files..."));
    if (fs.existsSync(EXTRACT_DIR)) {
      fs.rmSync(EXTRACT_DIR, { recursive: true, force: true });
    }
    new AdmZip(ZIP_PATH).extractAllTo(TEMP_DIR, true);

    if (latestSHA) saveCachedSHA(latestSHA);

    const pluginFolder = path.join(EXTRACT_DIR, "");
    if (fs.existsSync(pluginFolder)) {
      console.log(chalk.green("✅ Plugins folder found."));
    } else {
      console.log(chalk.red("❌ Plugin folder not found."));
    }
  } catch (e) {
    console.error(chalk.red("❌ Download/Extract failed:"), e);
    throw e;
  }
}

async function applyLocalSettings() {
  if (!fs.existsSync(LOCAL_SETTINGS)) {
    console.log(chalk.yellow("⚠️ No local settings file found."));
    return;
  }

  try {
    fs.mkdirSync(EXTRACT_DIR, { recursive: true });
    fs.copyFileSync(LOCAL_SETTINGS, EXTRACTED_SETTINGS);
    console.log(chalk.green("🛠️ Local settings applied."));
  } catch (e) {
    console.error(chalk.red("❌ Failed to apply local settings:"), e);
  }

  await delay(500);
}

function startBot() {
  console.log(chalk.cyan("🚀 Launching bot instance..."));

  if (!fs.existsSync(EXTRACT_DIR)) {
    console.error(chalk.red("❌ Extracted directory not found. Cannot start bot."));
    return;
  }

  const mainFile = path.join(EXTRACT_DIR, "index.js");
  if (!fs.existsSync(mainFile)) {
    console.error(chalk.red("❌ index.js not found in extracted directory."));
    return;
  }

  const bot = spawn("node", ["index.js"], {
    cwd: EXTRACT_DIR,
    stdio: "inherit",
    env: { ...process.env, NODE_ENV: "production" },
  });

  bot.on("close", (code) => {
    console.log(chalk.red(`💥 Bot terminated with exit code: ${code}`));
  });

  bot.on("error", (err) => {
    console.error(chalk.red("❌ Bot failed to start:"), err);
  });
}

// === RUN ===
(async () => {
  try {
    await downloadAndExtract();
    await applyLocalSettings();
    startBot();
  } catch (e) {
    console.error(chalk.red("❌ Fatal error in main execution:"), e);
    process.exit(1);
  }
})();