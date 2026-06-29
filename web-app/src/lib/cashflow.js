// Cash-flow projection.
//
// Same rule as the rest of the app: the MODEL only turns the user's words into
// recurring income/expense items (and later explains the result). The forward
// projection — running balance, lowest point, overdraft date — is ALL code.

import { chatJSON } from "./ollama";

const EXTRACT_PROMPT = `You extract recurring monthly income and expenses from a user's description of their finances.
For each item, return: a short label, a positive amount (number), a type ("income" or "expense"),
and the day of the month (1-31) it happens. If a day isn't stated, pick a reasonable one.

Return ONLY a JSON object of this exact shape:
{"items":[{"label":"Salary","amount":2600,"type":"income","day":1},{"label":"Rent","amount":1800,"type":"expense","day":2}]}`;

export async function extractRecurring(text, { model } = {}) {
  const json = await chatJSON({
    model,
    system: EXTRACT_PROMPT,
    user: `Extract recurring income and expenses from: "${text}"`,
  });
  const raw = Array.isArray(json) ? json : json.items || [];
  return raw
    .map((r) => ({
      label: String(r.label || "Item").slice(0, 40),
      amount: Math.abs(Number(r.amount) || 0),
      type: r.type === "income" ? "income" : "expense",
      day: clampDay(r.day),
    }))
    .filter((r) => r.amount > 0);
}

function clampDay(d) {
  const n = Math.round(Number(d) || 1);
  return Math.min(31, Math.max(1, n));
}

// Project the daily balance forward `horizonDays` days from today, applying each
// recurring item on its day-of-month (clamped to the last day of short months).
export function projectCashFlow(startingBalance, items, horizonDays) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let balance = startingBalance;
  const series = [];
  let minBalance = startingBalance;
  let minDate = iso(today);
  let firstNegativeDate = null;
  let totalIncome = 0;
  let totalExpense = 0;

  for (let d = 0; d <= horizonDays; d++) {
    const date = new Date(today);
    date.setDate(today.getDate() + d);
    const dom = date.getDate();
    const daysInMonth = new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0,
    ).getDate();

    const events = [];
    for (const it of items) {
      const effDay = Math.min(it.day, daysInMonth);
      if (effDay === dom) {
        const signed = it.type === "income" ? it.amount : -it.amount;
        balance += signed;
        if (it.type === "income") totalIncome += it.amount;
        else totalExpense += it.amount;
        events.push({ label: it.label, amount: signed });
      }
    }

    series.push({ date: iso(date), balance, events });
    if (balance < minBalance) {
      minBalance = balance;
      minDate = iso(date);
    }
    if (firstNegativeDate === null && balance < 0) firstNegativeDate = iso(date);
  }

  const status = firstNegativeDate
    ? "shortfall"
    : minBalance < 200
      ? "tight"
      : "healthy";

  return {
    series,
    startingBalance,
    endBalance: balance,
    minBalance,
    minDate,
    firstNegativeDate,
    totalIncome,
    totalExpense,
    status,
  };
}

// Ask the model to explain a (code-computed) forecast and suggest fixes.
export async function explainForecast(forecast, items, { model } = {}) {
  const system = `You are a concise personal cash-flow advisor. You are given a forecast that was already calculated.
Do NOT recompute numbers — use the ones provided. Respond ONLY as JSON:
{"headline":"one clear sentence","tips":["short actionable tip","..."]}
If there is a shortfall, the tips should reference specific items, dates, or amounts to fix it.`;

  const payload = {
    status: forecast.status,
    startingBalance: round(forecast.startingBalance),
    endBalance: round(forecast.endBalance),
    lowestBalance: round(forecast.minBalance),
    lowestOn: forecast.minDate,
    goesNegativeOn: forecast.firstNegativeDate,
    items: items.map((i) => ({
      label: i.label,
      amount: i.amount,
      type: i.type,
      day: i.day,
    })),
  };

  const json = await chatJSON({
    model,
    system,
    user: `Forecast:\n${JSON.stringify(payload)}`,
  });
  return {
    headline: json.headline || "",
    tips: Array.isArray(json.tips) ? json.tips : [],
  };
}

const iso = (d) => d.toISOString().slice(0, 10);
const round = (n) => Math.round(n * 100) / 100;

export function makeItem(base) {
  return {
    id: crypto.randomUUID(),
    label: base.label,
    amount: base.amount,
    type: base.type,
    day: base.day,
  };
}
