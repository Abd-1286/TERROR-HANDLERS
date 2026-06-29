// Subscription extraction + math.
//
// Same rule as the rest of the app: the MODEL only reads the user's words and
// names each service/plan. PRICES come from the catalog, and ALL totals and
// renewal countdowns are computed in code below.

import { chatJSON } from "./ollama";
import { SUBSCRIPTION_CATALOG } from "../data/subscriptionCatalog";

const SYSTEM_PROMPT = `You extract subscription services from a user's plain-English description.
For each subscription mentioned, identify the service name, the specific plan/tier if stated,
and whether it is the ad-supported tier.

Known services include: ${SUBSCRIPTION_CATALOG.map((s) => s.service).join(", ")}.

Return ONLY a JSON object of this exact shape:
{"subscriptions":[{"service":"Netflix","plan":"Premium","adSupported":false,"price":24.99,"cycle":"monthly"}]}
- "plan" is the tier name if the user gave one, else "".
- "adSupported" is true only if the user clearly said "with ads".
- "price" and "cycle" are best guesses; they may be corrected from a catalog.`;

// Ask the model to turn free text into rough subscription objects.
export async function extractSubscriptions(text, { model } = {}) {
  const json = await chatJSON({
    model,
    system: SYSTEM_PROMPT,
    user: `Extract subscriptions from: "${text}"`,
  });
  const raw = Array.isArray(json) ? json : json.subscriptions || [];
  return raw.map(enrichFromCatalog);
}

// Match a raw {service, plan, adSupported} to the catalog to get a trustworthy
// price + cancel URL + ad flag. Falls back to the model's guess if unknown.
export function enrichFromCatalog(raw) {
  const svc = SUBSCRIPTION_CATALOG.find((c) =>
    looseMatch(c.service, raw.service),
  );

  if (svc) {
    let plan = null;
    if (raw.plan) {
      plan =
        svc.plans.find((p) => p.plan.toLowerCase() === raw.plan.toLowerCase()) ||
        svc.plans.find((p) => looseMatch(p.plan, raw.plan));
    }
    if (!plan && typeof raw.adSupported === "boolean") {
      plan = svc.plans.find((p) => p.adSupported === raw.adSupported);
    }
    if (!plan) plan = svc.plans[0];

    return {
      service: svc.service,
      icon: svc.icon,
      cancelUrl: svc.cancelUrl,
      plan: plan.plan,
      price: plan.price,
      cycle: plan.cycle,
      adSupported: plan.adSupported,
    };
  }

  // Unknown service — keep what the model gave us.
  return {
    service: raw.service || "Unknown",
    icon: "💳",
    cancelUrl: null,
    plan: raw.plan || "Standard",
    price: typeof raw.price === "number" ? raw.price : 0,
    cycle: raw.cycle === "yearly" ? "yearly" : "monthly",
    adSupported: !!raw.adSupported,
  };
}

function looseMatch(a, b) {
  if (!a || !b) return false;
  const x = a.toLowerCase();
  const y = b.toLowerCase();
  return x === y || x.includes(y) || y.includes(x);
}

// ---- All math is plain code (never the model) -----------------------------

// Cost normalized to a monthly figure (annual plans / 12).
export function monthlyAmount(sub) {
  return sub.cycle === "yearly" ? sub.price / 12 : sub.price;
}

export function totals(subs) {
  const active = subs.filter((s) => !s.cancelled);
  const monthly = active.reduce((sum, s) => sum + monthlyAmount(s), 0);
  return { monthly, yearly: monthly * 12, activeCount: active.length };
}

// Whole days from today until the given YYYY-MM-DD date (can be negative).
export function daysUntil(dateStr) {
  if (!dateStr) return null;
  const target = new Date(`${dateStr}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86400000);
}

// Default next-renewal date: one cycle from today.
export function defaultRenewal(cycle) {
  const d = new Date();
  if (cycle === "yearly") d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  return d.toISOString().slice(0, 10);
}

// Build a full subscription record (adds id + tracking fields) from a catalog
// entry or an enriched extraction result.
export function makeSubscription(base) {
  return {
    id: crypto.randomUUID(),
    service: base.service,
    icon: base.icon || "💳",
    cancelUrl: base.cancelUrl ?? null,
    plan: base.plan,
    price: base.price,
    cycle: base.cycle || "monthly",
    adSupported: !!base.adSupported,
    nextRenewal: defaultRenewal(base.cycle || "monthly"),
    autoRenew: true,
    cancelled: false,
  };
}
