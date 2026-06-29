// Spending anomaly detection.
//
// Same rule as the rest of the app: ALL the statistics and flagging are done in
// code here (robust median/MAD outlier detection + duplicate-charge detection).
// The MODEL is only used afterward to explain, in plain English, why a flagged
// charge stands out.

import { chatJSON } from "./ollama";

const money = (n) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD" });

// Detect anomalies among expense transactions.
// Returns { anomalies: [...], stats: {...} | null }.
export function detectAnomalies(txns) {
  const expenses = txns
    .filter((t) => t.amount < 0)
    .map((t) => ({ ...t, spend: Math.abs(t.amount) }));

  if (expenses.length < 4) return { anomalies: [], stats: null };

  const spends = expenses.map((e) => e.spend);
  const median = quantile(spends, 0.5);
  const mad = medianAbsoluteDeviation(spends, median);

  const flagged = [];
  const seen = new Set();

  // 1. Large-amount outliers via robust modified z-score (median + MAD).
  for (const e of expenses) {
    let z;
    if (mad > 0) z = (0.6745 * (e.spend - median)) / mad;
    else z = e.spend > median * 4 ? 99 : 0; // all-equal fallback
    if (z > 3.5 && e.spend > median * 2) {
      flagged.push({
        id: e.id,
        txn: e,
        type: "large",
        score: z,
        reason: `${(e.spend / median).toFixed(1)}× your typical ${money(median)} transaction`,
      });
      seen.add(e.id);
    }
  }

  // 2. Duplicate charges: same merchant + same amount, 2+ times.
  const groups = {};
  for (const e of expenses) {
    const key = `${normalize(e.description)}__${e.spend.toFixed(2)}`;
    (groups[key] ||= []).push(e);
  }
  for (const key of Object.keys(groups)) {
    const g = groups[key];
    if (g.length >= 2) {
      for (let i = 1; i < g.length; i++) {
        const e = g[i];
        if (seen.has(e.id)) continue;
        flagged.push({
          id: e.id,
          txn: e,
          type: "duplicate",
          score: g.length,
          reason: `Charged ${g.length}× for ${money(e.spend)} — possible duplicate`,
        });
        seen.add(e.id);
      }
    }
  }

  flagged.sort((a, b) => b.txn.spend - a.txn.spend);
  const totalFlagged = flagged.reduce((s, f) => s + f.txn.spend, 0);

  return {
    anomalies: flagged,
    stats: {
      median,
      typicalMax: quantile(spends, 0.9),
      count: expenses.length,
      flaggedCount: flagged.length,
      totalFlagged,
    },
  };
}

// Ask the model to explain each flagged charge in one sentence.
export async function explainAnomalies(anomalies, stats, { model } = {}) {
  const system = `You are a spending-pattern analyst. For each flagged transaction, write ONE short sentence on why it looks unusual, using the stats provided. Don't recompute numbers.
Return ONLY JSON: {"explanations":[{"i":0,"reason":"..."}]}`;

  const payload = {
    typicalTransaction: round(stats.median),
    mostUnder: round(stats.typicalMax),
    flagged: anomalies.map((a, i) => ({
      i,
      description: a.txn.description,
      amount: round(a.txn.spend),
      type: a.type,
    })),
  };

  const json = await chatJSON({
    model,
    system,
    user: `Stats and flagged transactions:\n${JSON.stringify(payload)}`,
  });
  const list = Array.isArray(json) ? json : json.explanations || [];
  const byIndex = new Map(list.map((r) => [r.i, r.reason]));
  return anomalies.map((a, i) => byIndex.get(i) || "");
}

// ---- helpers --------------------------------------------------------------

function quantile(arr, q) {
  const sorted = [...arr].sort((a, b) => a - b);
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  return sorted[base + 1] !== undefined
    ? sorted[base] + rest * (sorted[base + 1] - sorted[base])
    : sorted[base];
}

function medianAbsoluteDeviation(arr, med) {
  const deviations = arr.map((x) => Math.abs(x - med));
  return quantile(deviations, 0.5);
}

function normalize(s) {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

const round = (n) => Math.round(n * 100) / 100;
