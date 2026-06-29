// Home dashboard: an at-a-glance overview of every feature, built from the data
// the user has saved locally. Re-reads localStorage each time it's shown.

import { loadJSON, KEYS } from "../lib/storage";
import { summarize } from "../lib/deductions";
import { totals } from "../lib/subscriptions";
import { projectCashFlow } from "../lib/cashflow";
import { detectAnomalies } from "../lib/anomalies";

const money = (n) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

const STATUS = {
  healthy: { label: "Healthy", className: "text-emerald-400" },
  tight: { label: "Tight", className: "text-amber-400" },
  shortfall: { label: "Shortfall", className: "text-red-400" },
};

export default function Home({ onSelect }) {
  // Tax deductions
  const txns = loadJSON(KEYS.deductions, []);
  const rate = loadJSON(KEYS.deductionRate, 0.24);
  const deductAnalyzed = txns.length > 0 && txns.every((t) => "category" in t);
  const deduct = deductAnalyzed ? summarize(txns, rate) : null;

  // Subscriptions
  const subs = loadJSON(KEYS.subscriptions, []);
  const subTotals = totals(subs);

  // Cash flow
  const items = loadJSON(KEYS.cashflowItems, []);
  const balance = loadJSON(KEYS.cashflowBalance, 0);
  const forecast =
    items.length > 0 ? projectCashFlow(Number(balance) || 0, items, 60) : null;

  // Spending anomalies
  const anomalyTxns = loadJSON(KEYS.anomalies, []);
  const { anomalies, stats: anomalyStats } =
    anomalyTxns.length > 0
      ? detectAnomalies(anomalyTxns)
      : { anomalies: [], stats: null };

  const cards = [
    {
      id: "deductions",
      icon: "🧾",
      title: "Tax Deduction Finder",
      stat: deduct ? `${deduct.count}` : "—",
      statLabel: deduct ? "write-offs found" : "",
      sub: deduct
        ? `${money(deduct.totalDeductible)} deductible · ~${money(deduct.estimatedSavings)} saved`
        : "Import a bank CSV to find business write-offs.",
      accent: "text-emerald-400",
    },
    {
      id: "subscriptions",
      icon: "🔁",
      title: "Subscription Manager",
      stat: subs.length ? `${money(subTotals.monthly)}` : "—",
      statLabel: subs.length ? "per month" : "",
      sub: subs.length
        ? `${subTotals.activeCount} active · ${money(subTotals.yearly)} / year`
        : "Track all your subscriptions and total the cost.",
      accent: "text-emerald-400",
    },
    {
      id: "cashflow",
      icon: "📈",
      title: "Cash-Flow Forecaster",
      stat: forecast ? STATUS[forecast.status].label : "—",
      statLabel: forecast ? "60-day outlook" : "",
      sub: forecast
        ? `Lowest ${money(forecast.minBalance)} · ends ${money(forecast.endBalance)}`
        : "Project your balance and avoid overdrafts.",
      accent: forecast ? STATUS[forecast.status].className : "text-white",
    },
    {
      id: "anomalies",
      icon: "🚨",
      title: "Spending Anomalies",
      stat: anomalyStats ? `${anomalyStats.flaggedCount}` : "—",
      statLabel: anomalyStats ? "flagged" : "",
      sub: anomalyStats
        ? anomalies.length
          ? `${money(anomalyStats.totalFlagged)} in unusual charges`
          : "No anomalies — spending looks consistent."
        : "Flag unusual charges against your normal pattern.",
      accent: anomalies.length ? "text-red-400" : "text-emerald-400",
    },
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <header className="mb-2">
        <h2 className="text-3xl font-bold text-white">Welcome to FinDesk</h2>
        <p className="text-slate-400 mt-1">
          Your private finance toolkit — everything runs and stays on this device.
        </p>
      </header>

      <div className="inline-flex items-center gap-2 text-xs text-emerald-300/90 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1 mb-7">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        All data saved locally · no internet required
      </div>

      <div className="grid grid-cols-2 gap-4">
        {cards.map((c) => (
          <button
            key={c.id}
            disabled={c.disabled}
            onClick={() => !c.disabled && onSelect(c.id)}
            className={[
              "text-left rounded-2xl border p-5 transition group",
              c.disabled
                ? "border-slate-800 bg-slate-900/40 cursor-not-allowed"
                : "border-slate-800 bg-slate-900/60 hover:border-emerald-500/40 hover:bg-slate-900",
            ].join(" ")}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{c.icon}</span>
              {!c.disabled && (
                <span className="text-slate-600 group-hover:text-emerald-400 transition text-sm">
                  Open →
                </span>
              )}
            </div>
            <h3 className="text-sm font-semibold text-slate-200">{c.title}</h3>
            <div className="mt-2 flex items-baseline gap-2">
              <span className={`text-2xl font-bold ${c.accent}`}>{c.stat}</span>
              {c.statLabel && (
                <span className="text-xs text-slate-500">{c.statLabel}</span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">{c.sub}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
