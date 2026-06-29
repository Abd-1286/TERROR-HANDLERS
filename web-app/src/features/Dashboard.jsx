import { motion, AnimatePresence, LayoutGroup, MotionConfig } from "motion/react";
import { LayoutGrid } from "lucide-react";
import { FeatureIcon } from "../components/Icon";
import { useSettings } from "../lib/settings";
import { useT } from "../lib/i18n";
import { loadJSON, KEYS } from "../lib/storage";
import { summarize } from "../lib/deductions";
import { totals } from "../lib/subscriptions";
import { projectCashFlow } from "../lib/cashflow";
import { detectAnomalies } from "../lib/anomalies";

import TaxDeductionFinder from "./TaxDeductionFinder";
import SubscriptionManager from "./SubscriptionManager";
import CashFlowForecaster from "./CashFlowForecaster";
import SpendingAnomalies from "./SpendingAnomalies";
import WhatIfSimulator from "./WhatIfSimulator";

const money = (n) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

const STATUS = {
  healthy: { label: "Healthy", className: "text-emerald-400" },
  tight: { label: "Tight", className: "text-amber-400" },
  shortfall: { label: "Shortfall", className: "text-red-400" },
};

const FEATURES = ["deductions", "subscriptions", "cashflow", "anomalies", "whatif"];

function renderFeature(id) {
  switch (id) {
    case "deductions":
      return <TaxDeductionFinder />;
    case "subscriptions":
      return <SubscriptionManager />;
    case "cashflow":
      return <CashFlowForecaster />;
    case "anomalies":
      return <SpendingAnomalies />;
    case "whatif":
      return <WhatIfSimulator />;
    default:
      return null;
  }
}

// Build the live summary shown on each grid card from saved data.
function buildSummaries(t) {
  const txns = loadJSON(KEYS.deductions, []);
  const rate = loadJSON(KEYS.deductionRate, 0.24);
  const deductAnalyzed = txns.length > 0 && txns.every((x) => "category" in x);
  const deduct = deductAnalyzed ? summarize(txns, rate) : null;

  const subs = loadJSON(KEYS.subscriptions, []);
  const subTotals = totals(subs);

  const items = loadJSON(KEYS.cashflowItems, []);
  const balance = loadJSON(KEYS.cashflowBalance, 0);
  const forecast =
    items.length > 0 ? projectCashFlow(Number(balance) || 0, items, 60) : null;

  const anomalyTxns = loadJSON(KEYS.anomalies, []);
  const { anomalies, stats: anomalyStats } =
    anomalyTxns.length > 0
      ? detectAnomalies(anomalyTxns)
      : { anomalies: [], stats: null };

  return {
    deductions: {
      stat: deduct ? `${deduct.count}` : "—",
      statLabel: deduct ? "write-offs" : "",
      summary: deduct
        ? `${money(deduct.totalDeductible)} deductible · ~${money(deduct.estimatedSavings)} saved`
        : t("card.deductions.empty"),
      accent: "text-emerald-400",
    },
    subscriptions: {
      stat: subs.length ? `${money(subTotals.monthly)}` : "—",
      statLabel: subs.length ? "per month" : "",
      summary: subs.length
        ? `${subTotals.activeCount} active · ${money(subTotals.yearly)} / year`
        : t("card.subscriptions.empty"),
      accent: "text-emerald-400",
    },
    cashflow: {
      stat: forecast ? STATUS[forecast.status].label : "—",
      statLabel: forecast ? "60-day outlook" : "",
      summary: forecast
        ? `Lowest ${money(forecast.minBalance)} · ends ${money(forecast.endBalance)}`
        : t("card.cashflow.empty"),
      accent: forecast ? STATUS[forecast.status].className : "text-white",
    },
    anomalies: {
      stat: anomalyStats ? `${anomalyStats.flaggedCount}` : "—",
      statLabel: anomalyStats ? "flagged" : "",
      summary: anomalyStats
        ? anomalies.length
          ? `${money(anomalyStats.totalFlagged)} in unusual charges`
          : "No anomalies — spending looks consistent."
        : t("card.anomalies.empty"),
      accent: anomalies.length ? "text-red-400" : "text-emerald-400",
    },
    whatif: {
      stat: "Live",
      statLabel: "scenarios",
      summary: t("card.whatif.empty"),
      accent: "text-emerald-400",
    },
  };
}

export default function Dashboard({ selected, onSelectChange }) {
  const { settings } = useSettings();
  const t = useT();
  const summaries = buildSummaries(t);
  const expanded = selected !== null;

  return (
    <MotionConfig reducedMotion={settings.reduceMotion ? "always" : "never"}>
      <div className="min-h-full">
        <div className="px-8 pt-6 max-w-5xl mx-auto">
          {!expanded && (
            <header className="mb-8">
              <h2 className="text-4xl font-extrabold text-white tracking-tight">
                {t("dash.welcome")}
              </h2>
              <p className="text-slate-400 mt-2 max-w-xl">{t("dash.subtitle")}</p>
              <div className="glass-soft inline-flex items-center gap-2 text-xs text-[var(--accent)] rounded-full px-3.5 py-1.5 mt-5">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)] shadow-[0_0_8px_2px_rgba(var(--accent-rgb),0.7)]" />
                {t("dash.localBadge")}
              </div>
            </header>
          )}

          <LayoutGroup>
            <motion.div
              layout
              className={
                expanded
                  ? "flex flex-wrap items-center gap-2.5"
                  : "grid grid-cols-2 gap-5"
              }
            >
              <AnimatePresence>
                {expanded && (
                  <motion.button
                    layout
                    key="overview"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={() => onSelectChange(null)}
                    className="glass-soft rounded-2xl text-slate-300 hover:text-white px-4 py-2 text-sm flex items-center gap-2 transition-all duration-300"
                  >
                    <LayoutGrid size={16} />
                    <span className="whitespace-nowrap">{t("dash.overview")}</span>
                  </motion.button>
                )}
              </AnimatePresence>

              {FEATURES.map((id) => {
                const isActive = selected === id;
                const s = summaries[id];
                return (
                  <motion.button
                    layout
                    key={id}
                    onClick={() => onSelectChange(id)}
                    className={
                      expanded
                        ? [
                            "glass-soft rounded-2xl px-4 py-2 text-sm flex items-center gap-2 transition-all duration-300",
                            isActive
                              ? "text-[var(--accent)] ring-1 ring-[rgba(var(--accent-rgb),0.45)] shadow-[0_8px_22px_-10px_rgba(var(--accent-rgb),0.6)]"
                              : "text-slate-300 hover:text-white",
                          ].join(" ")
                        : [
                            "glass glass-card glass-sheen h-48 text-left rounded-3xl p-5 group",
                            id === "whatif" ? "col-span-2" : "",
                          ].join(" ")
                    }
                  >
                    {expanded ? (
                      <>
                        <FeatureIcon id={id} size={18} />
                        <span className="whitespace-nowrap">{t(`nav.${id}`)}</span>
                      </>
                    ) : (
                      <div className="relative z-10 flex flex-col h-full w-full">
                        <div className="flex items-center justify-between mb-4">
                          <span className="icon-chip h-12 w-12">
                            <FeatureIcon id={id} size={24} />
                          </span>
                          <span className="text-slate-500 group-hover:text-[var(--accent)] transition-colors text-sm font-medium flex items-center gap-1">
                            {t("dash.open")} →
                          </span>
                        </div>
                        <h3 className="text-base font-semibold text-slate-100 tracking-tight">
                          {t(`nav.${id}`)}
                        </h3>
                        <div className="mt-2 flex items-baseline gap-2">
                          <span className="stat-value text-3xl font-extrabold tracking-tight">
                            {s.stat}
                          </span>
                          {s.statLabel && (
                            <span className="text-xs text-slate-500">
                              {s.statLabel}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                          {s.summary}
                        </p>
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </motion.div>
          </LayoutGroup>
        </div>

        {/* Expanded feature content */}
        <AnimatePresence mode="wait">
          {expanded && (
            <motion.div
              key={selected}
              initial={{ opacity: 0, scale: 0.98, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              {renderFeature(selected)}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}
