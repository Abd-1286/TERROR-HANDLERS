const { app, BrowserWindow } = require("electron");
const http = require("http");
const fs = require("fs");
const path = require("path");

const DIST = path.join(__dirname, "..", "web-app", "dist");
const DEV_URL = "http://localhost:5173"; // Vite dev server (if running)
const STATIC_PORT = 5180; // local server for the built app

const MIME = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".json": "application/json",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
};

// Serve the built web-app from disk over http://localhost so the desktop app
// runs without the Vite dev server — and so requests to the local Ollama server
// come from a normal http origin.
function startStaticServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      let urlPath = decodeURIComponent(req.url.split("?")[0]);
      if (urlPath === "/") urlPath = "/index.html";
      const filePath = path.join(DIST, urlPath);

      if (!filePath.startsWith(DIST)) {
        res.writeHead(403);
        res.end();
        return;
      }

      fs.readFile(filePath, (err, data) => {
        if (err) {
          // Single-page app fallback to index.html.
          fs.readFile(path.join(DIST, "index.html"), (e2, html) => {
            if (e2) {
              res.writeHead(404);
              res.end("Not found");
            } else {
              res.writeHead(200, { "Content-Type": "text/html" });
              res.end(html);
            }
          });
          return;
        }
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
        res.end(data);
      });
    });
    server.on("error", reject);
    server.listen(STATIC_PORT, "127.0.0.1", () =>
      resolve(`http://localhost:${STATIC_PORT}`),
    );
  });
}

// Quick check whether the Vite dev server is up.
function isUp(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      res.destroy();
      resolve(true);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(800, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function resolveAppUrl() {
  if (await isUp(DEV_URL)) return DEV_URL; // dev: hot reload
  if (fs.existsSync(path.join(DIST, "index.html"))) {
    return startStaticServer(); // production: serve the build
  }
  // Nothing built yet — fall back to the dev server URL with a hint.
  console.warn(
    "No build found at web-app/dist and no dev server on :5173.\n" +
      "Run `npm run build` in web-app, or start the Vite dev server.",
  );
  return DEV_URL;
}

function createWindow(url) {
  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 940,
    minHeight: 640,
    title: "FinDesk",
    backgroundColor: "#0b0f14",
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
    },
  });
  win.setMenuBarVisibility(false);
  win.loadURL(url);
}

app.whenReady().then(async () => {
  const url = await resolveAppUrl();
  createWindow(url);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow(url);
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
