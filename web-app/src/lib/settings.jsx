// App-wide settings + accessibility preferences. Persisted locally and applied
// to the document root so every feature picks them up.

import { createContext, useContext, useEffect } from "react";
import { usePersistentState, KEYS } from "./storage";
import { DEFAULT_MODEL, isModelAllowed } from "./ollama";
import { RTL_LANGS } from "./i18n";

// Accent (theme) colors. Default emerald plus the requested blue palette.
export const ACCENTS = [
  { name: "Emerald", hex: "#10b981" },
  { name: "Navy", hex: "#2C5EAD" },
  { name: "Blue", hex: "#1591DC" },
  { name: "Sky", hex: "#4BB8FA" },
  { name: "Ice", hex: "#C4E2F5" },
];

const DEFAULTS = {
  model: DEFAULT_MODEL,
  theme: "dark", // dark | light
  textSize: "normal", // small | normal | large | xl
  highContrast: false,
  reduceMotion: false,
  language: "en", // en | ar | es
  accent: "#10b981",
};

const SettingsContext = createContext(null);

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  const n = parseInt(
    h.length === 3
      ? h.split("").map((c) => c + c).join("")
      : h,
    16,
  );
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Pick black or white text for best contrast on the accent color.
function contrastText([r, g, b]) {
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#0b0f14" : "#ffffff";
}

export function SettingsProvider({ children }) {
  const [stored, setStored] = usePersistentState(KEYS.settings, DEFAULTS);
  const settings = { ...DEFAULTS, ...stored };
  // Enforce the model size cap, even for a previously-saved larger model.
  if (!isModelAllowed(settings.model)) settings.model = DEFAULTS.model;

  // Apply accessibility prefs + language direction to <html>.
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = settings.theme;
    root.dataset.textSize = settings.textSize;
    root.dataset.contrast = settings.highContrast ? "high" : "normal";
    root.dataset.motion = settings.reduceMotion ? "reduced" : "full";
    root.lang = settings.language;
    root.dir = RTL_LANGS.includes(settings.language) ? "rtl" : "ltr";
  }, [
    settings.theme,
    settings.textSize,
    settings.highContrast,
    settings.reduceMotion,
    settings.language,
  ]);

  // Apply the accent color as CSS variables consumed by index.css.
  useEffect(() => {
    const root = document.documentElement;
    const rgb = hexToRgb(settings.accent);
    root.style.setProperty("--accent", settings.accent);
    root.style.setProperty("--accent-rgb", rgb.join(", "));
    root.style.setProperty("--accent-fg", contrastText(rgb));
  }, [settings.accent]);

  const update = (patch) =>
    setStored((s) => ({ ...DEFAULTS, ...s, ...patch }));

  return (
    <SettingsContext.Provider value={{ settings, update }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}

// Convenience for features that only need the active model.
export function useModel() {
  return useSettings().settings.model;
}
