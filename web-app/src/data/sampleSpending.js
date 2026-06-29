// Sample transactions: mostly normal small spending, plus a few clear anomalies
// (large outliers + a duplicate charge) so the detector has something to flag.
// A payroll deposit is included to show income is ignored.

export const SAMPLE_SPENDING = [
  { id: 1, date: "2026-02-01", description: "PAYROLL DEPOSIT", amount: 3000.0 },
  { id: 2, date: "2026-02-01", description: "STARBUCKS", amount: -5.75 },
  { id: 3, date: "2026-02-02", description: "CHIPOTLE", amount: -12.4 },
  { id: 4, date: "2026-02-02", description: "WHOLE FOODS MARKET", amount: -64.3 },
  { id: 5, date: "2026-02-03", description: "SHELL GAS STATION", amount: -42.1 },
  { id: 6, date: "2026-02-03", description: "UBER TRIP", amount: -18.5 },
  { id: 7, date: "2026-02-04", description: "NETFLIX", amount: -15.49 },
  { id: 8, date: "2026-02-04", description: "SPOTIFY", amount: -11.99 },
  { id: 9, date: "2026-02-05", description: "TRADER JOES", amount: -38.2 },
  { id: 10, date: "2026-02-05", description: "MCDONALDS", amount: -9.85 },
  { id: 11, date: "2026-02-06", description: "BEST BUY - LAPTOP", amount: -1249.99 },
  { id: 12, date: "2026-02-07", description: "CVS PHARMACY", amount: -23.4 },
  { id: 13, date: "2026-02-08", description: "AMAZON", amount: -27.99 },
  { id: 14, date: "2026-02-09", description: "DELTA AIR LINES", amount: -642.0 },
  { id: 15, date: "2026-02-10", description: "TARGET", amount: -54.6 },
  { id: 16, date: "2026-02-11", description: "DOORDASH", amount: -31.75 },
  { id: 17, date: "2026-02-12", description: "CLOUDSTREAM PRO", amount: -89.99 },
  { id: 18, date: "2026-02-12", description: "CLOUDSTREAM PRO", amount: -89.99 },
  { id: 19, date: "2026-02-13", description: "PARKING METER", amount: -8.0 },
  { id: 20, date: "2026-02-14", description: "LUXURY SPA RESORT", amount: -415.0 },
  { id: 21, date: "2026-02-15", description: "BARNES & NOBLE", amount: -19.95 },
  { id: 22, date: "2026-02-16", description: "GYM MEMBERSHIP", amount: -29.99 },
];
