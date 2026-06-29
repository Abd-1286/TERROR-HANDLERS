// Local persistence. All data is stored in localStorage on the user's device
// (no server, no cloud) so it's there every time they reopen the app.

import { useEffect, useState } from "react";

// Centralized keys so the Home dashboard and features read the same data.
export const KEYS = {
  deductions: "findesk.deductions",
  deductionRate: "findesk.deductions.rate",
  subscriptions: "findesk.subscriptions",
  cashflowItems: "findesk.cashflow.items",
  cashflowBalance: "findesk.cashflow.balance",
  anomalies: "findesk.anomalies",
  goals: "findesk.goals",
  settings: "findesk.settings",
};

// Every key holding user data — used by Settings for export / import / clear.
export const DATA_KEYS = [
  KEYS.deductions,
  KEYS.deductionRate,
  KEYS.subscriptions,
  KEYS.cashflowItems,
  KEYS.cashflowBalance,
  KEYS.anomalies,
  KEYS.goals,
  KEYS.settings,
];

export function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

// Drop-in replacement for useState that persists to localStorage on every change.
export function usePersistentState(key, initialValue) {
  const [value, setValue] = useState(() => loadJSON(key, initialValue));

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // storage full / unavailable — keep working in-memory
    }
  }, [key, value]);

  return [value, setValue];
}
