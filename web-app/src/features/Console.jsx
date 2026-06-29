// Clean modern console — a soft emerald/teal mesh background with a unified
// frosted-glass carousel and widget dashboard. Selecting a module enters it.

import { useEffect, useState } from "react";
import { motion, MotionConfig } from "motion/react";
import { ChevronLeft, ChevronRight, TrendingUp, ShieldAlert, Repeat, Receipt } from "lucide-react";
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
import Goals from "./Goals";
import Settings from "./Settings";

const ITEMS = [
  "deductions",
  "subscriptions",
  "cashflow",
  "anomalies",
  "goals",
  "whatif",
  "settings",
];

// Subtle identity glow behind each glass icon.
const HALO = {
  deductions: "rgba(52,211,153,0.5)",
  subscriptions: "rgba(45,212,191,0.5)",
  cashflow: "rgba(56,189,248,0.5)",
  anomalies: "rgba(45,212,191,0.5)",
  goals: "rgba(52,211,153,0.5)",
  whatif: "rgba(56,189,248,0.5)",
  settings: "rgba(148,163,184,0.45)",
};

const money0 = (n) =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
const money2 = (n) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

const STATUS = { healthy: "Healthy", tight: "Tight", shortfall: "Shortfall" };
const SAMPLE_SPARK = [3, 5, 4, 7, 6, 9, 8, 11, 10, 13, 12, 15];

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
    case "goals":
      return <Goals />;
    case "settings":
      return <Settings />;
    default:
      return null;
  }
}

function readData() {
  const txns = loadJSON(KEYS.deductions, []);
  const rate = loadJSON(KEYS.deductionRate, 0.24);
  const deduct =
    txns.length && txns.every((x) => "category" in x)
      ? summarize(txns, rate)
      : null;

  const subs = loadJSON(KEYS.subscriptions, []);
  const subT = totals(subs);

  const items = loadJSON(KEYS.cashflowItems, []);
  const bal = loadJSON(KEYS.cashflowBalance, 0);
  const fc = items.length ? projectCashFlow(Number(bal) || 0, items, 60) : null;

  const anomT = loadJSON(KEYS.anomalies, []);
  const an = anomT.length ? detectAnomalies(anomT) : { stats: null };

  const goals = loadJSON(KEYS.goals, []);
  const activeGoals = goals.filter((g) => g.status === "active");
  const goalSavings = activeGoals.reduce(
    (s, g) => s + (g.target_savings || 0),
    0,
  );

  const stat = {
    deductions: deduct
      ? { stat: `${deduct.count}`, label: "write-offs" }
      : { stat: "—", label: "ready to scan" },
    subscriptions: subs.length
      ? { stat: money0(subT.monthly), label: "per month" }
      : { stat: "—", label: "ready to track" },
    cashflow: fc
      ? { stat: STATUS[fc.status], label: "60-day outlook" }
      : { stat: "—", label: "ready to forecast" },
    anomalies: an.stats
      ? { stat: `${an.stats.flaggedCount}`, label: "flagged" }
      : { stat: "—", label: "ready to scan" },
    whatif: { stat: "Live", label: "scenarios" },
    goals: activeGoals.length
      ? { stat: money0(goalSavings), label: "to optimize" }
      : { stat: "—", label: "smart goals" },
    settings: { stat: "•", label: "preferences" },
  };

  const widgets = {
    cashSeries: fc ? fc.series.map((p) => p.balance) : SAMPLE_SPARK,
    cashStatus: fc ? STATUS[fc.status] : "Sample",
    subMonthly: subs.length ? subT.monthly : null,
    flagged: an.stats ? an.stats.flaggedCount : 0,
    deductCount: deduct ? deduct.count : null,
  };

  return { stat, widgets };
}

export default function Console() {
  const { settings } = useSettings();
  const t = useT();
  const [index, setIndex] = useState(0);
  const [entered, setEntered] = useState(null);
  const { stat, widgets } = readData();

  const go = (dir) =>
    setIndex((i) => Math.min(ITEMS.length - 1, Math.max(0, i + dir)));

  useEffect(() => {
    if (entered) return;
    const onKey = (e) => {
      if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "Enter") setEntered(ITEMS[index]);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [entered, index]);

  return (
    <MotionConfig reducedMotion={settings.reduceMotion ? "always" : "never"}>
      <div
        className={[
          "relative h-screen w-screen overflow-hidden flex flex-col text-white",
          entered ? "app-bg" : "mesh-bg",
        ].join(" ")}
      >
        <Header
          title={entered ? t(`nav.${entered}`) : "FINDESK"}
          onBack={entered ? () => setEntered(null) : null}
        />

        {entered ? (
          <div className="relative z-10 flex-1 overflow-y-auto">
            {renderFeature(entered)}
          </div>
        ) : (
          <div className="relative z-10 flex-1 min-h-0 flex flex-col">
            <Carousel
              index={index}
              setIndex={setIndex}
              go={go}
              onOpen={setEntered}
              stat={stat}
              t={t}
            />
            <Widgets widgets={widgets} onOpen={setEntered} />
            <footer className="pb-5 pt-1 flex justify-center">
              <div className="glass rounded-full px-5 py-2 text-xs font-medium tracking-wide text-slate-300">
                All data saved locally · no internet required
              </div>
            </footer>
          </div>
        )}
      </div>
    </MotionConfig>
  );
}

function Header({ title, onBack }) {
  return (
    <header className="relative z-20 h-16 flex items-center justify-center shrink-0">
      {onBack && (
        <button
          onClick={onBack}
          className="absolute left-5 glass rounded-full pl-2 pr-4 py-1.5 flex items-center gap-1 text-sm font-medium text-slate-200 hover:text-white hover:border-white/20 transition"
        >
          <ChevronLeft size={18} />
          Back
        </button>
      )}
      <h1 className="text-white font-semibold text-lg tracking-[0.4em] pl-[0.4em]">
        {title}
      </h1>
    </header>
  );
}

function Carousel({ index, setIndex, go, onOpen, stat, t }) {
  const SPACING = 250;
  const EASE = { duration: 0.5, ease: [0.22, 1, 0.36, 1] };

  return (
    <div className="flex-1 min-h-0 flex flex-col items-center justify-center select-none">
      <div className="relative w-full h-[300px] flex items-center justify-center">
        <button
          onClick={() => go(-1)}
          disabled={index === 0}
          className="glass absolute left-6 z-30 rounded-full h-11 w-11 flex items-center justify-center text-slate-200 hover:text-white hover:border-white/20 disabled:opacity-25 transition"
        >
          <ChevronLeft size={22} />
        </button>
        <button
          onClick={() => go(1)}
          disabled={index === ITEMS.length - 1}
          className="glass absolute right-6 z-30 rounded-full h-11 w-11 flex items-center justify-center text-slate-200 hover:text-white hover:border-white/20 disabled:opacity-25 transition"
        >
          <ChevronRight size={22} />
        </button>

        {ITEMS.map((id, i) => {
          const offset = i - index;
          const abs = Math.abs(offset);
          const isCenter = offset === 0;
          const scale = isCenter ? 1 : abs === 1 ? 0.66 : 0.46;
          const opacity = abs > 2 ? 0 : isCenter ? 1 : abs === 1 ? 0.6 : 0.3;

          return (
            <motion.div
              key={id}
              className="absolute"
              style={{ width: 200, marginLeft: -100, left: "50%", zIndex: 20 - abs }}
              animate={{ x: offset * SPACING, scale, opacity }}
              transition={EASE}
              onClick={() => (isCenter ? onOpen(id) : setIndex(i))}
            >
              <div
                className={`flex flex-col items-center ${abs > 2 ? "pointer-events-none" : "cursor-pointer"}`}
              >
                <GlassIcon id={id} active={isCenter} size={172} />

                {isCenter && (
                  <div className="mt-6 flex flex-col items-center text-center">
                    <div className="glass rounded-full px-5 py-2 whitespace-nowrap">
                      <span className="text-sm font-semibold tracking-wide text-white">
                        {t(`nav.${id}`)}
                      </span>
                    </div>
                    <div className="text-3xl font-bold leading-none mt-3 text-white">
                      {stat[id].stat}
                    </div>
                    <div className="text-xs font-medium text-slate-300 mt-1 tracking-wide">
                      {stat[id].label}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 mt-2">
        {ITEMS.map((id, i) => (
          <button
            key={id}
            onClick={() => setIndex(i)}
            className="h-2 w-2 rounded-full transition"
            style={{
              background: i === index ? "#ffffff" : "rgba(255,255,255,0.35)",
            }}
          />
        ))}
      </div>
    </div>
  );
}

function GlassIcon({ id, active, size }) {
  return (
    <div
      className={`glass ${active ? "tile-active" : ""} rounded-[28px] flex items-center justify-center`}
      style={{ width: size, height: size }}
    >
      <div
        className="absolute rounded-full"
        style={{
          inset: size * 0.22,
          background: `radial-gradient(circle, ${HALO[id]}, transparent 70%)`,
          filter: "blur(18px)",
          opacity: active ? 0.7 : 0.45,
        }}
      />
      <span className="relative z-10">
        <FeatureIcon
          id={id}
          size={size * 0.38}
          strokeWidth={1.8}
          className="text-white"
        />
      </span>
    </div>
  );
}

function Widgets({ widgets, onOpen }) {
  return (
    <div className="px-6 shrink-0">
      <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
        <WidgetCard onClick={() => onOpen("cashflow")}>
          <WidgetHead icon={TrendingUp} label="Cash Flow" />
          <div className="mt-3">
            <Sparkline data={widgets.cashSeries} />
          </div>
          <p className="text-xs text-slate-300 font-medium mt-2">
            {widgets.cashStatus}
          </p>
        </WidgetCard>

        <WidgetCard onClick={() => onOpen("subscriptions")}>
          <WidgetHead icon={Repeat} label="Subscriptions" />
          <div className="mt-3">
            <span className="text-2xl font-bold text-white">
              {widgets.subMonthly != null ? money2(widgets.subMonthly) : "—"}
            </span>
            <span className="text-xs font-medium text-slate-400"> /mo</span>
          </div>
        </WidgetCard>

        <WidgetCard onClick={() => onOpen("anomalies")}>
          <WidgetHead icon={ShieldAlert} label="Alerts" />
          <div className="mt-3 inline-flex">
            <span
              className={[
                "rounded-full px-3 py-1 text-sm font-semibold border backdrop-blur-sm",
                widgets.flagged > 0
                  ? "bg-red-500/15 border-red-400/30 text-red-300"
                  : "bg-emerald-500/15 border-emerald-400/30 text-emerald-300",
              ].join(" ")}
            >
              {widgets.flagged > 0 ? `${widgets.flagged} flagged` : "All clear"}
            </span>
          </div>
        </WidgetCard>

        <WidgetCard onClick={() => onOpen("deductions")}>
          <WidgetHead icon={Receipt} label="Deductions" />
          <div className="text-2xl font-bold mt-3 text-white leading-none">
            {widgets.deductCount != null ? widgets.deductCount : "—"}
          </div>
          <p className="text-xs text-slate-300 font-medium mt-2">write-offs</p>
        </WidgetCard>
      </div>
    </div>
  );
}

function WidgetCard({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="glass rounded-2xl p-4 text-left hover:border-white/20 transition"
    >
      {children}
    </button>
  );
}

function WidgetHead({ icon: Icon, label }) {
  return (
    <div className="flex items-center gap-2">
      <Icon size={15} className="text-slate-300" />
      <span className="text-xs font-semibold tracking-wide text-slate-300 uppercase">
        {label}
      </span>
    </div>
  );
}

function Sparkline({ data }) {
  const W = 120;
  const H = 32;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const r = max - min || 1;
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * W},${H - ((v - min) / r) * H}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-8" preserveAspectRatio="none">
      <polyline
        points={pts}
        fill="none"
        stroke="#34d399"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
        style={{ filter: "drop-shadow(0 0 3px rgba(52,211,153,0.7))" }}
      />
    </svg>
  );
}
