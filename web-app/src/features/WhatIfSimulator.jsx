import { useMemo, useState } from "react";
import { loadJSON, KEYS } from "../lib/storage";
import { simulate, DEFAULT_SCENARIO } from "../lib/whatif";
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

const signedMoney = (n) => (n >= 0 ? `+${money(n)}` : `−${money(Math.abs(n))}`);

const prettyDate = (iso) =>
  iso
    ? new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : "";

export default function WhatIfSimulator() {
  // Baseline comes from the user's saved cash-flow data.
  const [baseItems, setBaseItems] = useState(() =>
    loadJSON(KEYS.cashflowItems, []),
  );
  const [baseBalance, setBaseBalance] = useState(() =>
    Number(loadJSON(KEYS.cashflowBalance, 0)) || 0,
  );
  const [horizon, setHorizon] = useState(60);
  const [scenario, setScenario] = useState(DEFAULT_SCENARIO);

  const hasData = baseItems.length > 0;
  const { baseline, scenario: scen } = useMemo(
    () => (hasData ? simulate(baseItems, baseBalance, scenario, horizon) : {}),
    [baseItems, baseBalance, scenario, horizon, hasData],
  );

  function set(key, value) {
    setScenario((s) => ({ ...s, [key]: value }));
  }

  function loadSample() {
    setBaseItems(SAMPLE_CASHFLOW_ITEMS.map((x) => ({ ...x })));
    setBaseBalance(SAMPLE_STARTING_BALANCE);
    setScenario(DEFAULT_SCENARIO);
  }

  if (!hasData) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <Header />
        <div className="glass rounded-3xl border border-dashed border-white/10 p-10 text-center">
          <p className="text-slate-300">No cash-flow data to simulate yet.</p>
          <p className="text-slate-500 text-sm mt-1">
            Set up the Cash-Flow Forecaster, or try it with sample data.
          </p>
          <button
            onClick={loadSample}
            className="mt-5 rounded-xl bg-[var(--accent)] text-slate-950 px-5 py-2.5 text-sm font-semibold hover:brightness-110 transition"
          >
            Load sample data
          </button>
        </div>
      </div>
    );
  }

  const endDelta = scen.endBalance - baseline.endBalance;
  const minDelta = scen.minBalance - baseline.minBalance;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <Header />

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Levers */}
        <div className="lg:col-span-2 glass glass-sheen rounded-3xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Adjust your scenario
            </p>
            <button
              onClick={() => setScenario(DEFAULT_SCENARIO)}
              className="text-xs text-slate-400 hover:text-white transition"
            >
              Reset
            </button>
          </div>

          <Slider
            label="Income"
            value={scenario.incomePct}
            min={-50}
            max={100}
            step={5}
            format={(v) => `${v >= 0 ? "+" : ""}${v}%`}
            onChange={(v) => set("incomePct", v)}
          />
          <Slider
            label="Expenses"
            value={scenario.expensePct}
            min={-50}
            max={50}
            step={5}
            format={(v) => `${v >= 0 ? "+" : ""}${v}%`}
            onChange={(v) => set("expensePct", v)}
          />
          <Slider
            label="Balance today"
            value={scenario.balanceDelta}
            min={-5000}
            max={10000}
            step={250}
            format={(v) => signedMoney(v)}
            onChange={(v) => set("balanceDelta", v)}
          />

          <div className="pt-2 border-t border-white/10">
            <Slider
              label="One-time event"
              value={scenario.oneTimeAmount}
              min={-5000}
              max={5000}
              step={250}
              format={(v) =>
                v === 0 ? "none" : `${signedMoney(v)}`
              }
              onChange={(v) => set("oneTimeAmount", v)}
            />
            {scenario.oneTimeAmount !== 0 && (
              <Slider
                label="…on day"
                value={scenario.oneTimeDay}
                min={1}
                max={horizon}
                step={1}
                format={(v) => `day ${v}`}
                onChange={(v) => set("oneTimeDay", v)}
              />
            )}
          </div>

          <div className="pt-2 border-t border-white/10 flex items-center justify-between">
            <span className="text-sm text-slate-300">Horizon</span>
            <select
              value={horizon}
              onChange={(e) => setHorizon(Number(e.target.value))}
              className="bg-white/[0.04] border border-white/10 rounded-md px-2 py-1 text-sm text-slate-100"
            >
              {[30, 60, 90].map((d) => (
                <option key={d} value={d}>
                  {d} days
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-3 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <DeltaCard
              label="Projected balance"
              value={money(scen.endBalance)}
              delta={endDelta}
              danger={scen.endBalance < 0}
            />
            <DeltaCard
              label="Lowest point"
              value={money(scen.minBalance)}
              delta={minDelta}
              danger={scen.minBalance < 0}
            />
            <OverdraftCard baseline={baseline} scen={scen} />
          </div>

          <div className="glass glass-sheen rounded-3xl p-5">
            <div className="flex items-center gap-4 mb-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="h-0.5 w-4 bg-slate-500 rounded" /> Baseline
              </span>
              <span className="flex items-center gap-1.5 text-slate-200">
                <span
                  className="h-0.5 w-4 rounded"
                  style={{ background: "var(--accent)" }}
                />{" "}
                Your scenario
              </span>
            </div>
            <DualChart baseline={baseline} scen={scen} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Header() {
  return (
    <header className="mb-6">
      <h2 className="text-2xl font-bold text-white tracking-tight">
        What-If Simulator
      </h2>
      <p className="text-slate-400 text-sm mt-1">
        Drag the sliders and watch your projected balance respond instantly —
        every number recomputed on your device.
      </p>
    </header>
  );
}

function Slider({ label, value, min, max, step, format, onChange }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-slate-300">{label}</span>
        <span className="text-sm font-semibold text-[var(--accent)] tabular-nums">
          {format(value)}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-emerald-500 cursor-pointer"
      />
    </div>
  );
}

function DeltaCard({ label, value, delta, danger }) {
  const show = Math.abs(delta) >= 1;
  return (
    <div className="glass rounded-2xl p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p
        className={`text-xl font-bold mt-1 ${danger ? "text-red-400" : "stat-value"}`}
      >
        {value}
      </p>
      {show && (
        <p
          className={`text-xs mt-0.5 ${delta >= 0 ? "text-emerald-400" : "text-red-400"}`}
        >
          {signedMoney(delta)} vs now
        </p>
      )}
    </div>
  );
}

function OverdraftCard({ baseline, scen }) {
  let label = "Overdraft";
  let value;
  let className = "text-emerald-400";

  if (scen.firstNegativeDate) {
    value = prettyDate(scen.firstNegativeDate);
    className = "text-red-400";
    if (!baseline.firstNegativeDate) label = "New overdraft";
  } else if (baseline.firstNegativeDate) {
    value = "Avoided ✓";
    className = "text-emerald-400";
    label = "Overdraft";
  } else {
    value = "None";
  }

  return (
    <div className="glass rounded-2xl p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`text-xl font-bold mt-1 ${className}`}>{value}</p>
    </div>
  );
}

// Two-line projection chart: baseline (muted) vs scenario (accent + area).
function DualChart({ baseline, scen }) {
  const a = baseline.series;
  const b = scen.series;
  const W = 640;
  const H = 200;
  const padX = 10;
  const padTop = 14;
  const padBottom = 22;

  const all = [...a.map((p) => p.balance), ...b.map((p) => p.balance), 0];
  const maxB = Math.max(...all);
  const minB = Math.min(...all);
  const range = maxB - minB || 1;
  const n = Math.max(a.length, b.length) - 1;

  const x = (i) => padX + (i / n) * (W - padX * 2);
  const y = (v) => padTop + (1 - (v - minB) / range) * (H - padTop - padBottom);

  const path = (series) =>
    series
      .map((p, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(p.balance).toFixed(1)}`)
      .join(" ");

  const scenLine = path(b);
  const area = `${scenLine} L ${x(b.length - 1).toFixed(1)} ${y(minB).toFixed(1)} L ${x(0).toFixed(1)} ${y(minB).toFixed(1)} Z`;
  const zeroY = y(0);
  const showZero = minB < 0;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img">
      <defs>
        <linearGradient id="wf-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" style={{ stopColor: "var(--accent)" }} stopOpacity="0.3" />
          <stop offset="100%" style={{ stopColor: "var(--accent)" }} stopOpacity="0" />
        </linearGradient>
      </defs>

      <path d={area} fill="url(#wf-fill)" />

      {showZero && (
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
      )}

      {/* Baseline */}
      <path
        d={path(a)}
        fill="none"
        stroke="#64748b"
        strokeWidth="1.5"
        strokeDasharray="5 4"
      />
      {/* Scenario */}
      <path d={scenLine} fill="none" style={{ stroke: "var(--accent)" }} strokeWidth="2.5" />

      <text x={padX} y={H - 5} fontSize="10" fill="#64748b">
        {prettyDate(b[0]?.date)}
      </text>
      <text x={W - padX} y={H - 5} textAnchor="end" fontSize="10" fill="#64748b">
        {prettyDate(b[b.length - 1]?.date)}
      </text>
    </svg>
  );
}
