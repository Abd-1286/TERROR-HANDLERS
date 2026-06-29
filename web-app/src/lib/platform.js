// Detect whether we're running inside the Electron desktop app vs a plain
// browser. The full feature set only runs in the desktop app (it works offline
// on the local device); the website shows an overview only.

export function isElectron() {
  if (typeof navigator !== "undefined" && /electron/i.test(navigator.userAgent)) {
    return true;
  }
  if (typeof window !== "undefined" && window.process?.versions?.electron) {
    return true;
  }
  return false;
}
