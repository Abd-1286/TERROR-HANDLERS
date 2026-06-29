// Shared status banner for the local Ollama connection. Used by every feature
// that calls the model.

export default function OllamaBanner({ ollama, model }) {
  if (ollama.ok === null) return null;
  if (ollama.ok) {
    const hasModel = ollama.models?.some((m) => m.startsWith(model.split(":")[0]));
    return (
      <div className="mb-6 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-300 flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-emerald-400" />
        Ollama connected · running locally
        {!hasModel && (
          <span className="text-amber-300 ml-2">
            (model not found — run{" "}
            <code className="bg-black/30 px-1 rounded">ollama pull {model}</code>)
          </span>
        )}
      </div>
    );
  }
  return (
    <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
      <p className="font-medium">Ollama not detected.</p>
      <p className="text-amber-200/80 mt-1">
        Install from ollama.com, then run{" "}
        <code className="bg-black/30 px-1 rounded">ollama pull {model}</code>. You
        can still browse data, but AI features need the local model.
      </p>
    </div>
  );
}
