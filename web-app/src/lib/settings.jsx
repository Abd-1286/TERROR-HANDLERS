// App-wide settings + accessibility preferences. Persisted locally and applied
// to the document root so every feature picks them up.

import { createContext, useContext, useEffect } from "react";
import { usePersistentState, KEYS } from "./storage";
import { DEFAULT_MODEL, isModelAllowed } from "./ollama";

const DEFAULTS = {
  model: DEFAULT_MODEL,
  textSize: "normal", // small | normal | large | xl
  highContrast: false,
  reduceMotion: false,
};

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [stored, setStored] = usePersistentState(KEYS.settings, DEFAULTS);
  // Merge defaults so newly-added settings appear for existing users.
  const settings = { ...DEFAULTS, ...stored };
  // Enforce the model size cap, even for a previously-saved larger model.
  if (!isModelAllowed(settings.model)) settings.model = DEFAULTS.model;

  // Apply accessibility prefs to the <html> element via data attributes (CSS
  // in index.css reacts to these).
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.textSize = settings.textSize;
    root.dataset.contrast = settings.highContrast ? "high" : "normal";
    root.dataset.motion = settings.reduceMotion ? "reduced" : "full";
  }, [settings.textSize, settings.highContrast, settings.reduceMotion]);

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
