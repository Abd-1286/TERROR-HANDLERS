import { useEffect, useMemo, useState } from "react";
import { Target, Sparkles, Check, X } from "lucide-react";
import OllamaBanner from "../components/OllamaBanner";
import { checkOllama } from "../lib/ollama";
import { useModel } from "../lib/settings";
import { usePersistentState, KEYS } from "../lib/storage";
import { optimizeTransaction, upsertGoal } from "../lib/goals";

const money = (n) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

export default function Goals() {
  const [ollama, setOllama] = useState({ ok: null });
  const model = useModel();

  const [goals, setGoals] = usePersistentState(KEYS.goals, []);
  const [text, setText] = useState("");
  const [working, setWorking] = useState(false);
  const [note, setNote] = useState(null); // { kind, message }

  useEffect(() => {
    checkOllama().then(setOllama);
  }, []);

  const activeSavings = useMemo(
    () =>
      goals
        .filter((g) => g.status === "active")
        .reduce((s, g) => s + (g.target_savings || 0), 0),
    [goals],
  );

  async function optimize() {
    if (!text.trim()) return;
    if (!ollama.ok) {
      setNote({ kind: "warn", message: "Ollama isn't running — start it to optimize." });
      return;
    }
    setWorking(true);
    setNote(null);
    try {
      const { parsed, better, goal, reason } = await optimizeTransaction(text, {
        model,
      });
      if (reason === "found") {
        setGoals((g) => upsertGoal(g, goal)); // Step 4: inject into Goals state
        setNote({
          kind: "good",
          message: `Found a better deal on ${parsed.product} — goal created to save ${money(goal.target_savings)}.`,
        });
        setText("");
      } else if (reason === "no_cheaper") {
        setNote({
          kind: "ok",
          message: `Nice — ${money(parsed.price_paid)} for that ${parsed.product} is already the best price in your catalog.`,
        });
      } else {
        setNote({
          kind: "warn",
          message: "Couldn't read a product and price from that transaction.",
        });
      }
    } catch (err) {
      setNote({ kind: "warn", message: err.message || "Optimization failed." });
    } finally {
      setWorking(false);
    }
  }

  function setStatus(id, status) {
    setGoals((g) => g.map((x) => (x.id === id ? { ...x, status } : x)));
  }
  function remove(id) {
    setGoals((g) => g.filter((x) => x.id !== id));
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <header className="mb-6">
        <h2 className="text-2xl font-bold text-white tracking-tight">
          Smart Goals Optimizer
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Log a purchase. A local model normalizes it, checks your offline price
          catalog, and turns any cheaper alternative into a savings goal.
        </p>
      </header>

      <OllamaBanner ollama={ollama} model={model} />

      {/* Transaction input */}
      <div className="glass rounded-2xl p-4 mb-4">
        <label className="block text-sm text-slate-300 mb-2">
          Log a transaction
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && optimize()}
            placeholder="e.g. Bought a laptop for 3000"
            className="flex-1 rounded-xl bg-white/[0.04] border border-white/10 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
          />
          <button
            onClick={optimize}
            disabled={!text.trim() || working || !ollama.ok}
            className="rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed px-5 py-2.5 text-sm font-semibold text-slate-950 transition flex items-center justify-center gap-2"
          >
            <Sparkles size={16} />
            {working ? "Optimizing…" : "Optimize"}
          </button>
        </div>
        <button
          onClick={() => setText("Bought a laptop for 3000")}
          className="text-xs text-slate-500 hover:text-slate-300 mt-2 transition"
        >
          Try an example
        </button>
      </div>

      {note && (
        <div
          className={[
            "mb-6 rounded-lg border px-4 py-3 text-sm",
            note.kind === "good"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : note.kind === "ok"
                ? "border-sky-500/30 bg-sky-500/10 text-sky-300"
                : "border-amber-500/30 bg-amber-500/10 text-amber-200",
          ].join(" ")}
        >
          {note.message}
        </div>
      )}

      {/* Summary */}
      {goals.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card label="Active goals" value={goals.filter((g) => g.status === "active").length} />
          <Card label="Potential savings" value={money(activeSavings)} accent />
          <Card label="Completed" value={goals.filter((g) => g.status === "completed").length} />
        </div>
      )}

      {/* Goals list */}
      {goals.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {goals.map((g) => (
            <GoalCard
              key={g.id}
              goal={g}
              onComplete={() => setStatus(g.id, "completed")}
              onReactivate={() => setStatus(g.id, "active")}
              onRemove={() => remove(g.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Card({ label, value, accent }) {
  return (
    <div className="glass rounded-xl p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${accent ? "text-emerald-400" : "text-white"}`}>
        {value}
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="glass rounded-2xl border-dashed border-white/10 p-10 text-center">
      <Target size={32} className="mx-auto mb-3 text-emerald-400" />
      <p className="text-slate-300">No goals yet.</p>
      <p className="text-slate-500 text-sm mt-1">
        Log a purchase above — if a cheaper alternative exists, a savings goal
        appears here automatically.
      </p>
    </div>
  );
}

const STATUS_BADGE = {
  active: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
  completed: "bg-sky-500/15 text-sky-300 border-sky-400/30",
  dismissed: "bg-slate-600/20 text-slate-400 border-white/10",
};

function GoalCard({ goal, onComplete, onReactivate, onRemove }) {
  const done = goal.status === "completed";
  return (
    <div className="glass rounded-2xl p-5 flex items-start gap-4">
      <span className="h-11 w-11 shrink-0 rounded-xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center">
        <Target size={20} className="text-emerald-300" />
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className={`font-semibold text-white ${done ? "line-through opacity-60" : ""}`}>
            {goal.title}
          </h3>
          <span
            className={`text-xs rounded-full px-2 py-0.5 border capitalize ${STATUS_BADGE[goal.status] || STATUS_BADGE.dismissed}`}
          >
            {goal.status}
          </span>
        </div>
        <p className="text-sm text-slate-400 mt-1">{goal.description}</p>
        {goal.alt_name && (
          <p className="text-xs text-slate-500 mt-1.5">
            {goal.alt_name} · paid {money(goal.price_paid)} → market {money(goal.market_price)}
          </p>
        )}
      </div>
      <div className="text-right shrink-0">
        <div className="text-xl font-bold text-emerald-400 tabular-nums">
          {money(goal.target_savings)}
        </div>
        <div className="flex items-center gap-1 mt-2 justify-end">
          {done ? (
            <button
              onClick={onReactivate}
              title="Reactivate"
              className="text-xs text-slate-400 hover:text-white transition px-2 py-1"
            >
              Reopen
            </button>
          ) : (
            <button
              onClick={onComplete}
              title="Mark saved"
              className="h-7 w-7 rounded-lg bg-white/5 hover:bg-emerald-500/20 text-emerald-300 flex items-center justify-center transition"
            >
              <Check size={15} />
            </button>
          )}
          <button
            onClick={onRemove}
            title="Remove"
            className="h-7 w-7 rounded-lg bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-300 flex items-center justify-center transition"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
