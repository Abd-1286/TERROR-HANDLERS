import { useEffect, useMemo, useState } from "react";
import OllamaBanner from "../components/OllamaBanner";
import { checkOllama, DEFAULT_MODEL } from "../lib/ollama";
import { usePersistentState, KEYS } from "../lib/storage";
import {
  extractRecurring,
  projectCashFlow,
  explainForecast,
  makeItem,
} from "../lib/cashflow";
import {
  SAMPLE_STARTING_BALANCE,
  SAMPLE_CASHFLOW_ITEMS,
} from "../data/sampleCashflow";

const money = (n) =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

const prettyDate = (iso) =>
  iso
    ? new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : "";

export default function CashFlowForecaster() {
  const [ollama, setOllama] = useState({ ok: null });
  const [model] = useState(DEFAULT_MODEL);

  const [startingBalance, setStartingBalance] = usePersistentState(
    KEYS.cashflowBalance,
    800,
  );
  const [horizon, setHorizon] = useState(60);
  const [items, setItems] = usePersistentState(KEYS.cashflowItems, []);

  const [text, setText] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState("");

  const [insight, setInsight] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    checkOllama().then(setOllama);
  }, []);

  const forecast = useMemo(
    () =>
      items.length > 0
        ? projectCashFlow(Number(startingBalance) || 0, items, horizon)
        : null,
    [startingBalance, items, horizon],
  );

  function loadSample() {
    setError("");
    setInsight(null);
    setStartingBalance(SAMPLE_STARTING_BALANCE);
    setItems(SAMPLE_CASHFLOW_ITEMS.map(makeItem));
  }

  async function onExtract() {
    if (!text.trim()) return;
    if (!ollama.ok) {
      setError("Ollama isn't running — start it to use AI extraction.");
      return;
    }
    setExtracting(true);
    setError("");
    try {
      const extracted = await extractRecurring(text, { model });
      if (extracted.length === 0) {
        setError("Couldn't find recurring income or expenses in that text.");
      } else {
        setItems((prev) => [...prev, ...extracted.map(makeItem)]);
        setText("");
        setInsight(null);
      }
    } catch (err) {
      setError(err.message || "Extraction failed.");
    } finally {
      setExtracting(false);
    }
  }

  function removeItem(id) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    setInsight(null);
  }

  async function getInsight() {
    if (!forecast || !ollama.ok) return;
    setAnalyzing(true);
    setError("");
    try {
      const result = await explainForecast(forecast, items, { model });
      setInsight(result);
    } catch (err) {
      setError(err.message || "Couldn't generate insight.");
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <header className="mb-6">
        <h2 className="text-2xl font-bold text-white">Cash-Flow Forecaster</h2>
        <p className="text-slate-400 text-sm mt-1">
          Project your balance forward from recurring income and bills. See your
          lowest point — and get warned before you overdraft.
        </p>
      </header>

      <OllamaBanner ollama={ollama} model={model} />

      {/* Inputs */}
      <div className="mb-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="flex flex-wrap items-end gap-4 mb-4">
          <label className="text-sm">
            <span className="block text-slate-400 mb-1">Current balance</span>
            <div className="flex items-center gap-1">
              <span className="text-slate-500">$</span>
              <input
                type="number"
                value={startingBalance}
                onChange={(e) => setStartingBalance(e.target.value)}
                className="w-28 bg-slate-950 border border-slate-800 rounded-md px-2 py-1.5 text-slate-100"
              />
            </div>
          </label>
          <label className="text-sm">
            <span className="block text-slate-400 mb-1">Forecast horizon</span>
            <select
              value={horizon}
              onChange={(e) => setHorizon(Number(e.target.value))}
              className="bg-slate-950 border border-slate-800 rounded-md px-2 py-1.5 text-slate-100"
            >
              {[30, 60, 90].map((d) => (
                <option key={d} value={d}>
                  {d} days
                </option>
              ))}
            </select>
          </label>
          <button
            onClick={loadSample}
            className="ml-auto rounded-lg bg-slate-800 hover:bg-slate-700 px-4 py-2 text-sm font-medium text-slate-100 transition"
          >
            Load sample data
          </button>
        </div>

        <label className="block text-sm text-slate-300 mb-2">
          Describe your recurring income & bills
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          placeholder="e.g. I get paid $2,600 on the 1st and 15th, rent is $1,800 on the 2nd, $450 car payment on the 5th…"
          className="w-full resize-none rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
        />
        <button
          onClick={onExtract}
          disabled={!text.trim() || extracting || !ollama.ok}
          className="mt-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed px-5 py-2 text-sm font-semibold text-slate-950 transition"
        >
          {extracting ? "Extracting…" : "Extract with AI"}
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {!forecast ? (
        <EmptyState />
      ) : (
        <>
          <SummaryCards forecast={forecast} />
          <ForecastChart forecast={forecast} />
          <InsightPanel
            forecast={forecast}
            insight={insight}
            analyzing={analyzing}
            onAnalyze={getInsight}
            canAnalyze={ollama.ok}
          />
          <ItemList items={items} onRemove={removeItem} />
        </>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-slate-800 p-10 text-center">
      <div className="text-4xl mb-3">📈</div>
      <p className="text-slate-400">No forecast yet.</p>
      <p className="text-slate-600 text-sm mt-1">
        Describe your income and bills above, or load the sample data.
      </p>
    </div>
  );
}

const STATUS_STYLES = {
  healthy: { label: "Healthy", className: "text-emerald-400" },
  tight: { label: "Tight", className: "text-amber-400" },
  shortfall: { label: "Shortfall", className: "text-red-400" },
};

function SummaryCards({ forecast }) {
  const status = STATUS_STYLES[forecast.status];
  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <p className="text-xs uppercase tracking-wide text-slate-500">
          Projected balance ({forecast.series.length - 1}d)
        </p>
        <p
          className={`text-2xl font-bold mt-1 ${forecast.endBalance < 0 ? "text-red-400" : "text-white"}`}
        >
          {money(forecast.endBalance)}
        </p>
      </div>
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <p className="text-xs uppercase tracking-wide text-slate-500">
          Lowest point
        </p>
        <p
          className={`text-2xl font-bold mt-1 ${forecast.minBalance < 0 ? "text-red-400" : "text-white"}`}
        >
          {money(forecast.minBalance)}
        </p>
        <p className="text-xs text-slate-500 mt-0.5">
          on {prettyDate(forecast.minDate)}
        </p>
      </div>
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <p className="text-xs uppercase tracking-wide text-slate-500">Status</p>
        <p className={`text-2xl font-bold mt-1 ${status.className}`}>
          {status.label}
        </p>
        {forecast.firstNegativeDate && (
          <p className="text-xs text-red-400/80 mt-0.5">
            negative on {prettyDate(forecast.firstNegativeDate)}
          </p>
        )}
      </div>
    </div>
  );
}

// Hand-rolled SVG line chart of the projected balance.
function ForecastChart({ forecast }) {
  const { series } = forecast;
  const W = 680;
  const H = 200;
  const padX = 10;
  const padTop = 16;
  const padBottom = 24;

  const balances = series.map((p) => p.balance);
  const maxB = Math.max(...balances, 0);
  const minB = Math.min(...balances, 0);
  const range = maxB - minB || 1;

  const x = (i) => padX + (i / (series.length - 1)) * (W - padX * 2);
  const y = (b) => padTop + (1 - (b - minB) / range) * (H - padTop - padBottom);

  const line = series
    .map((p, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(p.balance).toFixed(1)}`)
    .join(" ");
  const area = `${line} L ${x(series.length - 1).toFixed(1)} ${y(minB).toFixed(1)} L ${x(0).toFixed(1)} ${y(minB).toFixed(1)} Z`;

  const zeroY = y(0);
  const showZero = minB < 0;
  const minIdx = series.findIndex((p) => p.date === forecast.minDate);
  const danger = forecast.minBalance < 0;

  return (
    <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500 mb-3">
        Projected balance
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img">
        <defs>
          <linearGradient id="cf-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>

        <path d={area} fill="url(#cf-fill)" />
        <path d={line} fill="none" stroke="#10b981" strokeWidth="2" />

        {showZero && (
          <>
            <line
              x1={padX}
              x2={W - padX}
              y1={zeroY}
              y2={zeroY}
              stroke="#ef4444"
              strokeWidth="1"
              strokeDasharray="4 4"
              opacity="0.7"
            />
            <text x={W - padX} y={zeroY - 4} textAnchor="end" fontSize="10" fill="#ef4444">
              $0
            </text>
          </>
        )}

        {minIdx >= 0 && (
          <circle
            cx={x(minIdx)}
            cy={y(forecast.minBalance)}
            r="4"
            fill={danger ? "#ef4444" : "#10b981"}
            stroke="#0b0f14"
            strokeWidth="2"
          />
        )}

        {/* endpoint labels */}
        <text x={padX} y={H - 6} fontSize="10" fill="#64748b">
          {prettyDate(series[0].date)}
        </text>
        <text x={W - padX} y={H - 6} textAnchor="end" fontSize="10" fill="#64748b">
          {prettyDate(series[series.length - 1].date)}
        </text>
      </svg>
    </div>
  );
}

function InsightPanel({ forecast, insight, analyzing, onAnalyze, canAnalyze }) {
  return (
    <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs uppercase tracking-wide text-slate-500">AI insight</p>
        <button
          onClick={onAnalyze}
          disabled={analyzing || !canAnalyze}
          className="rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 text-xs font-medium text-slate-200 transition"
        >
          {analyzing ? "Thinking…" : insight ? "Refresh" : "Explain my forecast"}
        </button>
      </div>
      {insight ? (
        <div>
          <p className="text-slate-100 text-sm font-medium mb-2">
            {insight.headline}
          </p>
          <ul className="space-y-1.5">
            {insight.tips.map((tip, i) => (
              <li key={i} className="flex gap-2 text-sm text-slate-300">
                <span className="text-emerald-400">→</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-sm text-slate-500">
          {forecast.status === "shortfall"
            ? "You're projected to go negative — ask the AI how to fix it."
            : "Get a plain-English read on your forecast and tips to improve it."}
        </p>
      )}
    </div>
  );
}

function ItemList({ items, onRemove }) {
  return (
    <div className="rounded-xl border border-slate-800 overflow-hidden">
      <div className="bg-slate-900/80 px-4 py-2.5 text-xs uppercase tracking-wide text-slate-500">
        Recurring items
      </div>
      <div className="divide-y divide-slate-800">
        {items.map((it) => (
          <div key={it.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
            <span
              className={[
                "h-2 w-2 rounded-full shrink-0",
                it.type === "income" ? "bg-emerald-400" : "bg-red-400",
              ].join(" ")}
            />
            <span className="flex-1 text-slate-200">{it.label}</span>
            <span className="text-slate-500 text-xs">
              day {it.day} of month
            </span>
            <span
              className={[
                "w-24 text-right tabular-nums font-medium",
                it.type === "income" ? "text-emerald-400" : "text-red-300",
              ].join(" ")}
            >
              {it.type === "income" ? "+" : "−"}
              {money(it.amount)}
            </span>
            <button
              onClick={() => onRemove(it.id)}
              className="text-slate-600 hover:text-slate-300 text-lg leading-none"
              title="Remove"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
