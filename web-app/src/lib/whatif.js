// What-If scenario engine. Takes the user's real cash-flow baseline and a set of
// adjustments, then projects both the baseline and the adjusted scenario.
// All deterministic — the same inputs always give the same forward projection.

import { projectCashFlow } from "./cashflow";

export const DEFAULT_SCENARIO = {
  incomePct: 0, // % change to all income
  expensePct: 0, // % change to all expenses (negative = spend less)
  balanceDelta: 0, // one-off change to today's balance
  oneTimeAmount: 0, // single event amount (+ windfall / − expense)
  oneTimeDay: 15, // day offset for the one-time event
};

export function simulate(items, balance, scenario, horizon) {
  const baseline = projectCashFlow(balance, items, horizon);

  const adjBalance = (Number(balance) || 0) + scenario.balanceDelta;
  const adjItems = items.map((it) => ({
    ...it,
    amount:
      it.type === "income"
        ? it.amount * (1 + scenario.incomePct / 100)
        : it.amount * (1 + scenario.expensePct / 100),
  }));

  const oneTime = scenario.oneTimeAmount
    ? { dayOffset: scenario.oneTimeDay, amount: scenario.oneTimeAmount }
    : null;

  const scenarioProj = projectCashFlow(adjBalance, adjItems, horizon, oneTime);

  return { baseline, scenario: scenarioProj };
}
