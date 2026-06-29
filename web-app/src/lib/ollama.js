// Minimal client for a locally-running Ollama server.
// Everything here stays on the user's machine — nothing is sent to the cloud.

const OLLAMA_URL = "http://localhost:11434";

// The model used for classification. Must match a model you've pulled in Ollama
// (run `ollama list` to see them). qwen2.5-coder:7b is strong at structured JSON
// output. Swap for qwen2.5:3b (smaller/faster) or any installed model here.
export const DEFAULT_MODEL = "qwen2.5-coder:7b";

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
