import { useEffect, useMemo, useState } from "react";
import OllamaBanner from "../components/OllamaBanner";
import { checkOllama } from "../lib/ollama";
import { useModel } from "../lib/settings";
import { usePersistentState, KEYS } from "../lib/storage";
import { parseCSV, rowsToTransactions } from "../lib/csv";
import { classifyTransactions, summarize } from "../lib/deductions";
import { SAMPLE_TRANSACTIONS } from "../data/sample";

const money = (n) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

export default function TaxDeductionFinder() {
  const [ollama, setOllama] = useState({ ok: null });
  const model = useModel();
  // marginal tax rate for savings estimate (persisted)
  const [rate, setRate] = usePersistentState(KEYS.deductionRate, 0.24);

  const [txns, setTxns] = usePersistentState(KEYS.deductions, []);
  const [analyzing, setAnalyzing] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [error, setError] = useState("");

  // Probe the local Ollama server on mount.
  useEffect(() => {
    checkOllama().then(setOllama);
  }, []);

  const analyzed = txns.length > 0 && txns.every((t) => "category" in t);
  const summary = useMemo(
    () => (analyzed ? summarize(txns, rate) : null),
    [txns, rate, analyzed],
  );

  function loadSample() {
    setError("");
    setTxns(SAMPLE_TRANSACTIONS.map((t) => ({ ...t })));
  }

  async function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    try {
      const text = await file.text();
      const parsed = rowsToTransactions(parseCSV(text));
      if (parsed.length === 0) {
        setError("Couldn't find transactions in that CSV.");
        return;
      }
      setTxns(parsed);
    } catch {
      setError("Failed to read that file.");
    }
    e.target.value = ""; // allow re-selecting the same file
  }

  async function analyze() {
    if (!ollama.ok) {
      setError("Ollama isn't running — start it before analyzing.");
      return;
    }
    setAnalyzing(true);
    setError("");
    setProgress({ done: 0, total: txns.length });
    try {
      const result = await classifyTransactions(txns, {
        model,
        onProgress: (done, total) => setProgress({ done, total }),
      });
      setTxns(result);
    } catch (err) {
      setError(err.message || "Analysis failed.");
    } finally {
      setAnalyzing(false);
    }
  }

  // User override: flip a transaction's deductible flag; totals recompute.
  function toggleDeductible(id) {
    setTxns((prev) =>
      prev.map((t) => (t.id === id ? { ...t, deductible: !t.deductible } : t)),
    );
  }

  function exportReport() {
    const rows = [["Date", "Description", "Amount", "Category"]];
    for (const t of txns.filter((t) => t.deductible)) {
      rows.push([t.date, t.description, Math.abs(t.amount).toFixed(2), t.category]);
    }
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "deductions-report.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <header className="mb-6">
        <h2 className="text-2xl font-bold text-white">Tax Deduction Finder</h2>
        <p className="text-slate-400 text-sm mt-1">
          Import a bank or card CSV. A local model flags likely business write-offs —
          you confirm, then export a report for your accountant.
        </p>
      </header>

      <OllamaBanner ollama={ollama} model={model} />

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <label className="cursor-pointer rounded-lg bg-slate-800 hover:bg-slate-700 px-4 py-2 text-sm font-medium text-slate-100 transition">
          Upload CSV
          <input type="file" accept=".csv,text/csv" onChange={onFile} className="hidden" />
        </label>
        <button
          onClick={loadSample}
          className="rounded-lg bg-slate-800 hover:bg-slate-700 px-4 py-2 text-sm font-medium text-slate-100 transition"
        >
          Load sample data
        </button>

        <div className="flex items-center gap-2 text-sm text-slate-400 ml-auto">
          <span>Tax rate</span>
          <select
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="bg-slate-800 rounded-md px-2 py-1 text-slate-100"
          >
            {[0.1, 0.12, 0.22, 0.24, 0.32, 0.35].map((r) => (
              <option key={r} value={r}>
                {Math.round(r * 100)}%
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={analyze}
          disabled={txns.length === 0 || analyzing || !ollama.ok}
          className="rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed px-5 py-2 text-sm font-semibold text-slate-950 transition"
        >
          {analyzing
            ? `Analyzing ${progress.done}/${progress.total}…`
            : `Analyze ${txns.length || ""} transactions`}
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {summary && <SummaryCards summary={summary} />}

      {summary && summary.categories.length > 0 && (
        <CategoryBreakdown summary={summary} />
      )}

      {txns.length > 0 && (
        <TransactionTable
          txns={txns}
          analyzed={analyzed}
          onToggle={toggleDeductible}
        />
      )}

      {analyzed && summary && (
        <div className="mt-6">
          <button
            onClick={exportReport}
            className="rounded-lg bg-slate-800 hover:bg-slate-700 px-4 py-2 text-sm font-medium text-slate-100 transition"
          >
            Export deductions report (CSV)
          </button>
        </div>
      )}
    </div>
  );
}

function SummaryCards({ summary }) {
  const cards = [
    { label: "Deductible spend", value: money(summary.totalDeductible), accent: "text-emerald-400" },
    { label: "Est. tax savings", value: money(summary.estimatedSavings), accent: "text-emerald-400" },
    { label: "Write-offs found", value: summary.count, accent: "text-white" },
  ];
  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      {cards.map((c) => (
        <div key={c.label} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">{c.label}</p>
          <p className={`text-2xl font-bold mt-1 ${c.accent}`}>{c.value}</p>
        </div>
      ))}
    </div>
  );
}

function CategoryBreakdown({ summary }) {
  const max = summary.categories[0]?.total || 1;
  return (
    <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500 mb-3">By category</p>
      <div className="space-y-2">
        {summary.categories.map((c) => (
          <div key={c.category} className="flex items-center gap-3">
            <span className="w-44 shrink-0 text-sm text-slate-300">{c.category}</span>
            <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-emerald-500"
                style={{ width: `${(c.total / max) * 100}%` }}
              />
            </div>
            <span className="w-20 text-right text-sm text-slate-400">{money(c.total)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TransactionTable({ txns, analyzed, onToggle }) {
  return (
    <div className="rounded-xl border border-slate-800 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-900/80 text-slate-400">
          <tr>
            <th className="text-left font-medium px-4 py-2.5">Description</th>
            <th className="text-right font-medium px-4 py-2.5">Amount</th>
            {analyzed && <th className="text-left font-medium px-4 py-2.5">Category</th>}
            {analyzed && <th className="text-center font-medium px-4 py-2.5">Deduct?</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {txns.map((t) => (
            <tr key={t.id} className="hover:bg-slate-900/40">
              <td className="px-4 py-2.5">
                <div className="text-slate-200">{t.description}</div>
                {t.reason && (
                  <div className="text-xs text-slate-500 mt-0.5">{t.reason}</div>
                )}
              </td>
              <td className="px-4 py-2.5 text-right text-slate-300 tabular-nums">
                {money(Math.abs(t.amount))}
              </td>
              {analyzed && (
                <td className="px-4 py-2.5">
                  <CategoryBadge category={t.category} deductible={t.deductible} />
                </td>
              )}
              {analyzed && (
                <td className="px-4 py-2.5 text-center">
                  <input
                    type="checkbox"
                    checked={t.deductible}
                    onChange={() => onToggle(t.id)}
                    className="h-4 w-4 accent-emerald-500 cursor-pointer"
                  />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CategoryBadge({ category, deductible }) {
  return (
    <span
      className={[
        "inline-block rounded-full px-2.5 py-0.5 text-xs",
        deductible
          ? "bg-emerald-500/15 text-emerald-300"
          : "bg-slate-700/50 text-slate-400",
      ].join(" ")}
    >
      {category}
    </span>
  );
}
