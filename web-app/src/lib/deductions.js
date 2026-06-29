// Tax-deduction classification.
//
// Design rule (critical for finance): the MODEL only categorizes each
// transaction. ALL arithmetic — totals, savings — is done in code below, so the
// numbers are always correct even though a small local model does the labeling.

import { chatJSON } from "./ollama";

export const CATEGORIES = [
  "Software & Subscriptions",
  "Home Office",
  "Travel",
  "Meals",
  "Office Supplies",
  "Equipment",
  "Advertising & Marketing",
  "Professional Services",
  "Education",
  "Utilities",
  "Not Deductible",
];

const SYSTEM_PROMPT = `You are a tax-deduction classifier for a US freelancer / small business owner filing Schedule C.
For each transaction, decide whether it is plausibly a BUSINESS tax deduction and assign one category.

Be conservative. These are NOT deductible (use "Not Deductible"):
- groceries, personal shopping, clothing (non-uniform)
- entertainment, streaming for personal use, restaurants that are clearly personal
- personal rent/mortgage, personal transport, ATM withdrawals, transfers
- anything that looks personal rather than business

Valid categories: ${CATEGORIES.join(", ")}.

Return ONLY a JSON object of this exact shape:
{"results":[{"i":<index>,"deductible":<true|false>,"category":"<one category>","confidence":<0..1>,"reason":"<short reason>"}]}`;

const BATCH_SIZE = 12;

// Classify every transaction. Calls the model in small batches and reports
// progress via onProgress(done, total). Returns transactions enriched with
// {deductible, category, confidence, reason}.
export async function classifyTransactions(txns, { model, onProgress } = {}) {
  const enriched = [];

  for (let start = 0; start < txns.length; start += BATCH_SIZE) {
    const batch = txns.slice(start, start + BATCH_SIZE);
    const userPayload = batch.map((t, j) => ({
      i: j,
      description: t.description,
      amount: t.amount,
    }));

    let results = [];
    try {
      const json = await chatJSON({
        model,
        system: SYSTEM_PROMPT,
        user: `Classify these transactions:\n${JSON.stringify(userPayload)}`,
      });
      results = Array.isArray(json) ? json : json.results || [];
    } catch (err) {
      // If a batch fails, mark it undecided rather than aborting the whole run.
      console.error("Batch classification failed:", err);
    }

    const byIndex = new Map(results.map((r) => [r.i, r]));
    batch.forEach((t, j) => {
      const r = byIndex.get(j) || {};
      const category = CATEGORIES.includes(r.category)
        ? r.category
        : "Not Deductible";
      enriched.push({
        ...t,
        deductible: category !== "Not Deductible" && r.deductible !== false,
        category,
        confidence: typeof r.confidence === "number" ? r.confidence : 0,
        reason: r.reason || "",
      });
    });

    onProgress?.(Math.min(start + BATCH_SIZE, txns.length), txns.length);
  }

  return enriched;
}

// ---- All math is plain code (never the model) -----------------------------

// Tax write-offs come from money spent, so we use the magnitude of each amount.
const spend = (t) => Math.abs(t.amount);

export function summarize(txns, marginalRate) {
  const deductible = txns.filter((t) => t.deductible);
  const totalDeductible = deductible.reduce((s, t) => s + spend(t), 0);
  const estimatedSavings = totalDeductible * marginalRate;

  const byCategory = {};
  for (const t of deductible) {
    byCategory[t.category] = (byCategory[t.category] || 0) + spend(t);
  }
  const categories = Object.entries(byCategory)
    .map(([category, total]) => ({ category, total }))
    .sort((a, b) => b.total - a.total);

  return {
    count: deductible.length,
    totalDeductible,
    estimatedSavings,
    categories,
  };
}
