// Smart Goals Optimizer — 100% local.
//
// Pipeline:
//   1. transaction string  (from local history)
//   2. local 3B model      -> normalized JSON { product, price_paid, specs }
//   3. offline catalog      -> cheapest same-class item below price_paid
//   4. goal injection       -> savings goal object spliced into Goals state
//
// The model only NORMALIZES the string. The catalog match and the savings math
// are done in plain code, so the numbers are always correct on a small model.

import { chatJSON } from "./ollama";
import { PRODUCT_CATALOG } from "../data/catalog";

// ---- Step 2: system prompt, tuned hard for a 3B local context window ----
// Terse, imperative, few-shot, pure-JSON. chatJSON() additionally sends
// Ollama `format: "json"`, guaranteeing zero markdown / backticks.
export const PARSE_PROMPT = `Extract the purchase from the transaction. Output ONE JSON object only. No prose. No markdown. No backticks.

Schema:
{"product": string, "price_paid": number, "specs": string}

Rules:
- product = generic lowercase class only: laptop, phone, headphones, monitor, tv, tablet, watch, camera, keyboard. If unknown, use the closest single noun.
- price_paid = the number only, no currency symbol.
- specs = size/brand/model words if present, else "".

Examples:
Bought a laptop for 3000 => {"product":"laptop","price_paid":3000,"specs":""}
paid $89 for sony headphones => {"product":"headphones","price_paid":89,"specs":"sony"}
new 55 inch tv 1200 dollars => {"product":"tv","price_paid":1200,"specs":"55 inch"}
got an ipad 11 for 480 => {"product":"tablet","price_paid":480,"specs":"ipad 11"}
coffee 6 => {"product":"coffee","price_paid":6,"specs":""}

Output only the JSON object.`;

// Step 2 — normalize the transaction string via the local model.
export async function parseTransaction(text, { model } = {}) {
  const json = await chatJSON({ model, system: PARSE_PROMPT, user: text });
  return {
    product: String(json.product || "").toLowerCase().trim(),
    price_paid: Number(json.price_paid) || 0,
    specs: typeof json.specs === "string" ? json.specs : "",
  };
}

// Crude singularize so "laptops"/"laptop" and "headphones"/"headphone" match.
function normClass(s) {
  let c = (s || "").toLowerCase().trim();
  if (c.length > 3 && c.endsWith("s")) c = c.slice(0, -1);
  return c;
}

// Step 3 — local array filter over the offline catalog: same class, cheaper.
export function findBetterPrice(parsed, catalog = PRODUCT_CATALOG) {
  const cls = normClass(parsed.product);
  const matches = catalog.filter(
    (item) => normClass(item.product) === cls && item.price < parsed.price_paid,
  );
  if (matches.length === 0) return null;
  return matches.reduce((best, item) => (item.price < best.price ? item : best));
}

const fmt = (n) =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

// Step 4 — build the Goal state object (exact requested shape + UI extras).
export function makeGoal(parsed, better) {
  const savings = Math.round((parsed.price_paid - better.price) * 100) / 100;
  const product = parsed.product || "item";
  return {
    id: `goal_optimize_${product.replace(/\s+/g, "_")}`,
    title: `Optimize ${cap(product)} Purchase`,
    description: `Alternative vendor (${better.vendor}) found for ${fmt(better.price)}. Potential cash runway saved: ${fmt(savings)}.`,
    status: "active",
    target_savings: savings,
    // --- extras for the UI (ignored by the core shape) ---
    product,
    vendor: better.vendor,
    alt_name: better.name,
    market_price: better.price,
    price_paid: parsed.price_paid,
    created: Date.now(),
  };
}

// Full pipeline: parse -> match -> goal (or null if no cheaper option).
export async function optimizeTransaction(text, { model, catalog } = {}) {
  const parsed = await parseTransaction(text, { model });
  if (!parsed.product || !parsed.price_paid) {
    return { parsed, better: null, goal: null, reason: "unparsed" };
  }
  const better = findBetterPrice(parsed, catalog);
  if (!better) return { parsed, better: null, goal: null, reason: "no_cheaper" };
  return { parsed, better, goal: makeGoal(parsed, better), reason: "found" };
}

// State-management helper: insert/replace a goal by id (immutable).
export function upsertGoal(goals, goal) {
  const without = goals.filter((g) => g.id !== goal.id);
  return [goal, ...without];
}
