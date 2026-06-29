import { useEffect, useRef, useState } from "react";
import { useSettings } from "../lib/settings";
import { checkOllama, isModelAllowed, MAX_MODEL_B } from "../lib/ollama";
import { DATA_KEYS } from "../lib/storage";

export default function Settings() {
  const { settings, update } = useSettings();
  const [ollama, setOllama] = useState({ ok: null });
  const [note, setNote] = useState("");
  const fileRef = useRef(null);

  useEffect(() => {
    checkOllama().then(setOllama);
  }, []);

  function exportData() {
    const dump = {};
    for (const key of DATA_KEYS) {
      const raw = localStorage.getItem(key);
      if (raw != null) dump[key] = JSON.parse(raw);
    }
    const blob = new Blob([JSON.stringify(dump, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "findesk-backup.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importData(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dump = JSON.parse(await file.text());
      for (const [key, value] of Object.entries(dump)) {
        if (DATA_KEYS.includes(key)) {
          localStorage.setItem(key, JSON.stringify(value));
        }
      }
      window.location.reload();
    } catch {
      setNote("That file couldn't be imported.");
    }
    e.target.value = "";
  }

  function clearData() {
    if (!confirm("Delete all FinDesk data on this device? This can't be undone.")) {
      return;
    }
    for (const key of DATA_KEYS) localStorage.removeItem(key);
    window.location.reload();
  }

  // Only models at or under the size cap are selectable.
  const installedModels = (ollama.ok ? ollama.models || [] : []).filter(
    isModelAllowed,
  );

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <header className="mb-6">
        <h2 className="text-2xl font-bold text-white">Settings</h2>
        <p className="text-slate-400 text-sm mt-1">
          Accessibility, the local AI model, and your data — all stored on this
          device.
        </p>
      </header>

      {/* Accessibility */}
      <Section title="Accessibility">
        <Row label="Text size" hint="Scales the whole interface.">
          <Segmented
            value={settings.textSize}
            options={[
              { value: "small", label: "A−" },
              { value: "normal", label: "A" },
              { value: "large", label: "A+" },
              { value: "xl", label: "A++" },
            ]}
            onChange={(v) => update({ textSize: v })}
          />
        </Row>
        <Row label="High contrast" hint="Brighten muted text and borders.">
          <Toggle
            on={settings.highContrast}
            onChange={(v) => update({ highContrast: v })}
          />
        </Row>
        <Row label="Reduce motion" hint="Turn off animations and transitions.">
          <Toggle
            on={settings.reduceMotion}
            onChange={(v) => update({ reduceMotion: v })}
          />
        </Row>
      </Section>

      {/* AI model */}
      <Section title="Local AI model">
        <Row
          label="Model"
          hint={
            ollama.ok
              ? `Capped at ${MAX_MODEL_B}B parameters. Only smaller models are listed.`
              : "Ollama isn't running — start it to change the model."
          }
        >
          {installedModels.length > 0 ? (
            <select
              value={settings.model}
              onChange={(e) => update({ model: e.target.value })}
              className="bg-slate-950 border border-slate-800 rounded-md px-3 py-1.5 text-sm text-slate-100"
            >
              {/* keep the current value selectable even if not in the list */}
              {!installedModels.includes(settings.model) && (
                <option value={settings.model}>{settings.model} (not installed)</option>
              )}
              {installedModels.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          ) : (
            <code className="text-xs bg-black/30 px-2 py-1 rounded text-slate-300">
              {settings.model}
            </code>
          )}
        </Row>
        <div className="flex items-center gap-2 text-xs">
          <span
            className={[
              "h-2 w-2 rounded-full",
              ollama.ok ? "bg-emerald-400" : "bg-amber-400",
            ].join(" ")}
          />
          <span className="text-slate-400">
            {ollama.ok
              ? `Ollama connected · ${installedModels.length} eligible model${installedModels.length === 1 ? "" : "s"} installed`
              : "Ollama not detected"}
          </span>
        </div>
        {ollama.ok && installedModels.length === 0 && (
          <p className="text-xs text-amber-300 mt-2">
            No model at or under {MAX_MODEL_B}B is installed. Pull one with{" "}
            <code className="bg-black/30 px-1 rounded">
              ollama pull qwen2.5-coder:3b
            </code>
            .
          </p>
        )}
      </Section>

      {/* Data */}
      <Section title="Your data">
        <p className="text-sm text-slate-400 mb-4">
          Everything you enter is saved only in this app on this device. Back it up
          or move it to another machine with export / import.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={exportData}
            className="rounded-lg bg-slate-800 hover:bg-slate-700 px-4 py-2 text-sm font-medium text-slate-100 transition"
          >
            Export backup
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="rounded-lg bg-slate-800 hover:bg-slate-700 px-4 py-2 text-sm font-medium text-slate-100 transition"
          >
            Import backup
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            onChange={importData}
            className="hidden"
          />
          <button
            onClick={clearData}
            className="rounded-lg bg-red-500/90 hover:bg-red-500 px-4 py-2 text-sm font-semibold text-white transition"
          >
            Clear all data
          </button>
        </div>
        {note && <p className="text-sm text-amber-300 mt-3">{note}</p>}
      </Section>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <h3 className="text-sm font-semibold text-white mb-4">{title}</h3>
      {children}
    </section>
  );
}

function Row({ label, hint, children }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div>
        <p className="text-sm text-slate-200">{label}</p>
        {hint && <p className="text-xs text-slate-500 mt-0.5">{hint}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Segmented({ value, options, onChange }) {
  return (
    <div className="inline-flex rounded-lg border border-slate-800 bg-slate-950 p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={[
            "px-3 py-1 rounded-md text-sm transition",
            value === o.value
              ? "bg-emerald-500 text-slate-950 font-semibold"
              : "text-slate-400 hover:text-slate-200",
          ].join(" ")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Toggle({ on, onChange }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={[
        "relative inline-flex h-6 w-11 items-center rounded-full transition",
        on ? "bg-emerald-500" : "bg-slate-700",
      ].join(" ")}
    >
      <span
        className={[
          "inline-block h-4 w-4 rounded-full bg-white transition",
          on ? "translate-x-6" : "translate-x-1",
        ].join(" ")}
      />
    </button>
  );
}
