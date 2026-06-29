// Minimal client for a locally-running Ollama server.
// Everything here stays on the user's machine — nothing is sent to the cloud.

const OLLAMA_URL = "http://localhost:11434";

// The model used for classification. Capped at 3B params (see MAX_MODEL_B).
// qwen2.5-coder:3b is the strongest ≤3B option for structured JSON output.
// Pull it with: ollama pull qwen2.5-coder:3b
export const DEFAULT_MODEL = "qwen2.5-coder:3b";

// Hard cap on model size (in billions of parameters).
export const MAX_MODEL_B = 3;

// Parse the parameter size (in billions) from a model name, e.g.
// "qwen2.5-coder:3b" -> 3, "llama3.2:1.5b" -> 1.5, "phi3:mini" -> null.
export function modelSizeB(name) {
  const tag = name.includes(":") ? name.slice(name.lastIndexOf(":") + 1) : name;
  const m = tag.match(/(\d+(?:\.\d+)?)\s*b/i);
  return m ? parseFloat(m[1]) : null;
}

// A model is allowed if it's at or under the cap (or its size can't be read).
export function isModelAllowed(name) {
  const size = modelSizeB(name);
  return size == null || size <= MAX_MODEL_B;
}

// Check that Ollama is running and report which models are installed.
// Returns { ok: true, models: [...] } or { ok: false, error: "..." }.
export async function checkOllama() {
  try {
    const res = await fetch(`${OLLAMA_URL}/api/tags`);
    if (!res.ok) return { ok: false, error: `Ollama responded ${res.status}` };
    const data = await res.json();
    return { ok: true, models: (data.models || []).map((m) => m.name) };
  } catch {
    return {
      ok: false,
      error: "Can't reach Ollama at localhost:11434. Is it running?",
    };
  }
}

// Send a chat request and force the model to return a JSON object.
// `system` and `user` are plain strings; returns the parsed JSON object.
export async function chatJSON({ model = DEFAULT_MODEL, system, user }) {
  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      stream: false,
      format: "json", // force valid JSON output — key for small models
      options: { temperature: 0 }, // deterministic classification
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`Ollama chat failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  const content = data?.message?.content ?? "";
  try {
    return JSON.parse(content);
  } catch {
    throw new Error(`Model did not return valid JSON:\n${content.slice(0, 300)}`);
  }
}
