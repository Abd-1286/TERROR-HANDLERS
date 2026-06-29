import { useEffect, useMemo, useState } from "react";
import OllamaBanner from "../components/OllamaBanner";
import { checkOllama, DEFAULT_MODEL } from "../lib/ollama";
import { usePersistentState, KEYS } from "../lib/storage";
import { CATALOG_OPTIONS } from "../data/subscriptionCatalog";
import {
  extractSubscriptions,
  makeSubscription,
  monthlyAmount,
  totals,
  daysUntil,
} from "../lib/subscriptions";

const money = (n) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

// Scale a subscription's normalized monthly cost to the chosen viewing period.
function amountForPeriod(sub, period) {
  const m = monthlyAmount(sub);
  return period === "yearly" ? m * 12 : m;
}
const periodSuffix = (period) => (period === "yearly" ? "/yr" : "/mo");

export default function SubscriptionManager() {
  const [ollama, setOllama] = useState({ ok: null });
  const [model] = useState(DEFAULT_MODEL);

  const [text, setText] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState("");

  const [subs, setSubs] = usePersistentState(KEYS.subscriptions, []);
  const [selectedId, setSelectedId] = useState(null);
  const [period, setPeriod] = useState("monthly"); // monthly | yearly view

  useEffect(() => {
    checkOllama().then(setOllama);
  }, []);

  const summary = useMemo(() => totals(subs), [subs]);
  const selected = subs.find((s) => s.id === selectedId) || null;

  // Add subs, skipping duplicates of the same service+plan.
  function addSubs(newOnes) {
    setSubs((prev) => {
      const seen = new Set(prev.map((s) => `${s.service}__${s.plan}`));
      const merged = [...prev];
      for (const s of newOnes) {
        const key = `${s.service}__${s.plan}`;
        if (!seen.has(key)) {
          seen.add(key);
          merged.push(s);
        }
      }
      return merged;
    });
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
      const enriched = await extractSubscriptions(text, { model });
      if (enriched.length === 0) {
        setError("Couldn't find any subscriptions in that text.");
      } else {
        addSubs(enriched.map(makeSubscription));
        setText("");
      }
    } catch (err) {
      setError(err.message || "Extraction failed.");
    } finally {
      setExtracting(false);
    }
  }

  function quickAdd(key) {
    if (!key) return;
    const opt = CATALOG_OPTIONS.find((o) => o.key === key);
    if (opt) addSubs([makeSubscription(opt)]);
  }

  function updateSub(id, patch) {
    setSubs((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function removeSub(id) {
    setSubs((prev) => prev.filter((s) => s.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <header className="mb-6">
        <h2 className="text-2xl font-bold text-white">Subscription Manager</h2>
        <p className="text-slate-400 text-sm mt-1">
          Tell the AI what you subscribe to. It identifies each plan, totals your
          monthly spend, and tracks when every subscription renews.
        </p>
      </header>

      <OllamaBanner ollama={ollama} model={model} />

      {/* AI extraction input */}
      <div className="mb-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <label className="block text-sm text-slate-300 mb-2">
          Describe your subscriptions
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          placeholder="e.g. I have Netflix Premium, Spotify Family, Disney+ with ads, and ChatGPT Plus"
          className="w-full resize-none rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
        />
        <div className="flex flex-wrap items-center gap-3 mt-3">
          <button
            onClick={onExtract}
            disabled={!text.trim() || extracting || !ollama.ok}
            className="rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed px-5 py-2 text-sm font-semibold text-slate-950 transition"
          >
            {extracting ? "Extracting…" : "Extract with AI"}
          </button>

          <span className="text-slate-600 text-sm">or add manually</span>
          <select
            value=""
            onChange={(e) => quickAdd(e.target.value)}
            className="bg-slate-800 rounded-md px-2 py-1.5 text-sm text-slate-100 max-w-[14rem]"
          >
            <option value="">+ Quick add a plan…</option>
            {CATALOG_OPTIONS.map((o) => (
              <option key={o.key} value={o.key}>
                {o.service} — {o.plan}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {subs.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <SummaryCard label="Monthly total" value={money(summary.monthly)} accent />
          <SummaryCard label="Yearly total" value={money(summary.yearly)} accent />
          <SummaryCard label="Active subscriptions" value={summary.activeCount} />
        </div>
      )}

      {subs.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-500">Your subscriptions</span>
            <PeriodToggle period={period} onChange={setPeriod} />
          </div>
          <div className="space-y-2">
            {subs.map((s) => (
              <SubscriptionRow
                key={s.id}
                sub={s}
                period={period}
                onOpen={() => setSelectedId(s.id)}
              />
            ))}
          </div>
          <SpendBarChart subs={subs} period={period} />
        </>
      )}

      {selected && (
        <DetailModal
          sub={selected}
          onClose={() => setSelectedId(null)}
          onUpdate={(patch) => updateSub(selected.id, patch)}
          onRemove={() => removeSub(selected.id)}
        />
      )}
    </div>
  );
}

function SummaryCard({ label, value, accent }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${accent ? "text-emerald-400" : "text-white"}`}>
        {value}
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-slate-800 p-10 text-center">
      <div className="text-4xl mb-3">🔁</div>
      <p className="text-slate-400">No subscriptions yet.</p>
      <p className="text-slate-600 text-sm mt-1">
        Describe them above and let the AI pull them in.
      </p>
    </div>
  );
}

// One renewal-status pill, shown on each row and in the modal.
function renewalLabel(sub) {
  if (sub.cancelled) return { text: "Cancelled", className: "text-slate-500" };
  const days = daysUntil(sub.nextRenewal);
  if (days === null) return { text: "", className: "" };
  const verb = sub.autoRenew ? "Renews" : "Ends";
  if (days < 0) return { text: `${verb.slice(0, -1)}ed`, className: "text-amber-400" };
  if (days === 0) return { text: `${verb} today`, className: "text-amber-400" };
  const cls = sub.autoRenew ? "text-slate-400" : "text-amber-400";
  return { text: `${verb} in ${days} day${days === 1 ? "" : "s"}`, className: cls };
}

function SubscriptionRow({ sub, period, onOpen }) {
  const renewal = renewalLabel(sub);
  return (
    <div
      className={[
        "flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3",
        sub.cancelled ? "opacity-50" : "",
      ].join(" ")}
    >
      <span className="text-2xl">{sub.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`font-medium text-slate-100 ${sub.cancelled ? "line-through" : ""}`}>
            {sub.service}
          </span>
          <span className="text-xs rounded-full bg-slate-700/60 text-slate-300 px-2 py-0.5">
            {sub.plan}
          </span>
          {sub.adSupported && (
            <span className="text-xs rounded-full bg-amber-500/15 text-amber-300 px-2 py-0.5">
              ads
            </span>
          )}
        </div>
        <div className={`text-xs mt-0.5 ${renewal.className}`}>{renewal.text}</div>
      </div>
      <div className="text-right">
        <div className="text-slate-100 font-semibold tabular-nums">
          {money(amountForPeriod(sub, period))}
          <span className="text-slate-500 font-normal text-xs">{periodSuffix(period)}</span>
        </div>
        <div className="text-[11px] text-slate-500">
          billed {money(sub.price)}/{sub.cycle === "yearly" ? "yr" : "mo"}
        </div>
      </div>
      <button
        onClick={onOpen}
        className="rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 transition"
      >
        Details
      </button>
    </div>
  );
}

function DetailModal({ sub, onClose, onUpdate, onRemove }) {
  const renewal = renewalLabel(sub);
  return (
    <div
      className="fixed inset-0 z-20 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-5">
          <span className="text-3xl">{sub.icon}</span>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white">{sub.service}</h3>
            <p className="text-sm text-slate-400">
              {sub.plan}
              {sub.adSupported ? " · ad-supported" : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 text-xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="space-y-4 text-sm">
          {/* Price */}
          <Field label="Price">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">$</span>
              <input
                type="number"
                step="0.01"
                value={sub.price}
                onChange={(e) => onUpdate({ price: Number(e.target.value) || 0 })}
                className="w-24 bg-slate-950 border border-slate-800 rounded-md px-2 py-1 text-slate-100"
              />
              <select
                value={sub.cycle}
                onChange={(e) => onUpdate({ cycle: e.target.value })}
                className="bg-slate-950 border border-slate-800 rounded-md px-2 py-1 text-slate-100"
              >
                <option value="monthly">/ month</option>
                <option value="yearly">/ year</option>
              </select>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {money(monthlyAmount(sub))} per month
            </p>
          </Field>

          {/* Next renewal */}
          <Field label="Next renewal">
            <input
              type="date"
              value={sub.nextRenewal}
              onChange={(e) => onUpdate({ nextRenewal: e.target.value })}
              className="bg-slate-950 border border-slate-800 rounded-md px-2 py-1 text-slate-100"
            />
            <p className={`text-xs mt-1 ${renewal.className}`}>{renewal.text}</p>
          </Field>

          {/* Auto-renew toggle */}
          <Field label="Auto-renew">
            <button
              onClick={() => onUpdate({ autoRenew: !sub.autoRenew })}
              disabled={sub.cancelled}
              className={[
                "relative inline-flex h-6 w-11 items-center rounded-full transition disabled:opacity-40",
                sub.autoRenew ? "bg-emerald-500" : "bg-slate-700",
              ].join(" ")}
            >
              <span
                className={[
                  "inline-block h-4 w-4 rounded-full bg-white transition",
                  sub.autoRenew ? "translate-x-6" : "translate-x-1",
                ].join(" ")}
              />
            </button>
            <p className="text-xs text-slate-500 mt-1">
              {sub.autoRenew
                ? "Will renew automatically on the date above."
                : "Will end on the renewal date and not charge again."}
            </p>
          </Field>
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          {sub.cancelled ? (
            <button
              onClick={() => onUpdate({ cancelled: false, autoRenew: true })}
              className="rounded-lg bg-emerald-500 hover:bg-emerald-400 px-4 py-2 text-sm font-semibold text-slate-950 transition"
            >
              Resubscribe
            </button>
          ) : (
            <button
              onClick={() => onUpdate({ cancelled: true, autoRenew: false })}
              className="rounded-lg bg-red-500/90 hover:bg-red-500 px-4 py-2 text-sm font-semibold text-white transition"
            >
              Cancel subscription
            </button>
          )}

          {sub.cancelUrl && (
            <a
              href={sub.cancelUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg bg-slate-800 hover:bg-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition"
            >
              Open cancel page ↗
            </a>
          )}

          <button
            onClick={onRemove}
            className="ml-auto text-xs text-slate-500 hover:text-slate-300"
          >
            Remove from list
          </button>
        </div>

        {sub.cancelled && sub.cancelUrl && (
          <p className="mt-3 text-[11px] text-slate-500">
            Marked cancelled here for tracking. To actually stop billing, use the
            provider's cancel page above.
          </p>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-500 mb-1.5">{label}</p>
      {children}
    </div>
  );
}

function PeriodToggle({ period, onChange }) {
  return (
    <div className="inline-flex rounded-lg border border-slate-800 bg-slate-900/60 p-0.5 text-sm">
      {["monthly", "yearly"].map((p) => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={[
            "px-3 py-1 rounded-md capitalize transition",
            period === p
              ? "bg-emerald-500 text-slate-950 font-semibold"
              : "text-slate-400 hover:text-slate-200",
          ].join(" ")}
        >
          {p}
        </button>
      ))}
    </div>
  );
}

// Horizontal bar chart of spend per active subscription, in the chosen period.
function SpendBarChart({ subs, period }) {
  const data = subs
    .filter((s) => !s.cancelled)
    .map((s) => ({ ...s, amount: amountForPeriod(s, period) }))
    .sort((a, b) => b.amount - a.amount);

  if (data.length === 0) return null;
  const max = data[0].amount || 1;

  return (
    <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500 mb-3">
        Spend by subscription ({period})
      </p>
      <div className="space-y-2">
        {data.map((s) => (
          <div key={s.id} className="flex items-center gap-3">
            <span className="w-44 shrink-0 text-sm text-slate-300 truncate">
              {s.icon} {s.service}
            </span>
            <div className="flex-1 h-3 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${(s.amount / max) * 100}%` }}
              />
            </div>
            <span className="w-24 text-right text-sm text-slate-400 tabular-nums">
              {money(s.amount)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
