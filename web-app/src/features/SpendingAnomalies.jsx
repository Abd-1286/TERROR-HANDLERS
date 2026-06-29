import { useEffect, useMemo, useState } from "react";
import OllamaBanner from "../components/OllamaBanner";
import { checkOllama } from "../lib/ollama";
import { useModel } from "../lib/settings";
import { usePersistentState, loadJSON, KEYS } from "../lib/storage";
import { parseCSV, rowsToTransactions } from "../lib/csv";
import { detectAnomalies, explainAnomalies } from "../lib/anomalies";
import { SAMPLE_SPENDING } from "../data/sampleSpending";

const money = (n) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

export default function SpendingAnomalies() {
  const [ollama, setOllama] = useState({ ok: null });
  const model = useModel();

  const [txns, setTxns] = usePersistentState(KEYS.anomalies, []);
  const [aiReasons, setAiReasons] = useState({}); // id -> AI explanation
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    checkOllama().then(setOllama);
  }, []);

  const { anomalies, stats } = useMemo(() => detectAnomalies(txns), [txns]);

  // Transactions already imported in the Tax Deduction Finder (offered as a source).
  const importedCount = loadJSON(KEYS.deductions, []).length;

  function setSource(newTxns) {
    setError("");
    setAiReasons({});
    setTxns(newTxns);
  }

  function loadSample() {
    setSource(SAMPLE_SPENDING.map((t) => ({ ...t })));
  }

  function useImported() {
    setSource(loadJSON(KEYS.deductions, []));
  }

  async function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const parsed = rowsToTransactions(parseCSV(await file.text()));
      if (parsed.length === 0) setError("Couldn't find transactions in that CSV.");
      else setSource(parsed);
    } catch {
      setError("Failed to read that file.");
    }
    e.target.value = "";
  }

  async function explain() {
    if (anomalies.length === 0 || !ollama.ok) return;
    setAnalyzing(true);
    setError("");
    try {
      const reasons = await explainAnomalies(anomalies, stats, { model });
      const map = {};
      anomalies.forEach((a, i) => {
        if (reasons[i]) map[a.id] = reasons[i];
      });
      setAiReasons(map);
    } catch (err) {
      setError(err.message || "Couldn't generate explanations.");
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <header className="mb-6">
        <h2 className="text-2xl font-bold text-white">Spending Anomalies</h2>
        <p className="text-slate-400 text-sm mt-1">
          Learns your normal spending and flags the outliers — unusually large
          charges and possible duplicates.
        </p>
      </header>

      <OllamaBanner ollama={ollama} model={model} />

      {/* Sources */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <label className="cursor-pointer rounded-lg bg-slate-800 hover:bg-slate-700 px-4 py-2 text-sm font-medium text-slate-100 transition">
          Upload CSV
          <input type="file" accept=".csv,text/csv" onChange={onFile} className="hidden" />
        </label>
        {importedCount > 0 && (
          <button
            onClick={useImported}
            className="rounded-lg bg-slate-800 hover:bg-slate-700 px-4 py-2 text-sm font-medium text-slate-100 transition"
          >
            Use imported transactions ({importedCount})
          </button>
        )}
        <button
          onClick={loadSample}
          className="rounded-lg bg-slate-800 hover:bg-slate-700 px-4 py-2 text-sm font-medium text-slate-100 transition"
        >
          Load sample data
        </button>
        {anomalies.length > 0 && (
          <button
            onClick={explain}
            disabled={analyzing || !ollama.ok}
            className="ml-auto rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed px-5 py-2 text-sm font-semibold text-slate-950 transition"
          >
            {analyzing ? "Explaining…" : "Explain with AI"}
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {!stats ? (
        <EmptyState hasTxns={txns.length > 0} />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card
              label="Anomalies flagged"
              value={stats.flaggedCount}
              accent={stats.flaggedCount > 0 ? "text-red-400" : "text-emerald-400"}
            />
            <Card label="Flagged amount" value={money(stats.totalFlagged)} accent="text-red-400" />
            <Card label="Typical transaction" value={money(stats.median)} accent="text-white" />
          </div>

          {anomalies.length === 0 ? (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center text-emerald-300">
              ✓ No anomalies found — your spending looks consistent across{" "}
              {stats.count} transactions.
            </div>
          ) : (
            <div className="space-y-2">
              {anomalies.map((a) => (
                <AnomalyRow key={a.id} anomaly={a} aiReason={aiReasons[a.id]} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function EmptyState({ hasTxns }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-800 p-10 text-center">
      <div className="text-4xl mb-3">🚨</div>
      <p className="text-slate-400">
        {hasTxns ? "Not enough transactions to analyze." : "No transactions loaded."}
      </p>
      <p className="text-slate-600 text-sm mt-1">
        Upload a CSV, reuse your imported transactions, or load the sample.
      </p>
    </div>
  );
}

function Card({ label, value, accent }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${accent}`}>{value}</p>
    </div>
  );
}

const TYPE_BADGE = {
  large: { label: "Large charge", className: "bg-red-500/15 text-red-300" },
  duplicate: { label: "Possible duplicate", className: "bg-amber-500/15 text-amber-300" },
};

function AnomalyRow({ anomaly, aiReason }) {
  const badge = TYPE_BADGE[anomaly.type];
  return (
    <div className="flex items-start gap-4 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
      <span className="text-xl mt-0.5">⚠️</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-slate-100">{anomaly.txn.description}</span>
          <span className={`text-xs rounded-full px-2 py-0.5 ${badge.className}`}>
            {badge.label}
          </span>
          {anomaly.txn.date && (
            <span className="text-xs text-slate-600">{anomaly.txn.date}</span>
          )}
        </div>
        <p className="text-xs text-slate-400 mt-1">{anomaly.reason}</p>
        {aiReason && (
          <p className="text-xs text-emerald-300/90 mt-1 flex gap-1.5">
            <span>✦</span>
            <span>{aiReason}</span>
          </p>
        )}
      </div>
      <span className="text-red-300 font-semibold tabular-nums shrink-0">
        {money(anomaly.txn.spend)}
      </span>
    </div>
  );
}
