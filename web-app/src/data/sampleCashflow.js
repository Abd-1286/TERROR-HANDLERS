// Sample recurring income/expenses for an instant demo. Net is slightly negative
// (~-$600/month) so the projected balance trends down and dips below zero within
// the default horizon — showing off the shortfall warning.

export const SAMPLE_STARTING_BALANCE = 800;

export const SAMPLE_CASHFLOW_ITEMS = [
  { label: "Salary", amount: 2600, type: "income", day: 1 },
  { label: "Salary", amount: 2600, type: "income", day: 15 },
  { label: "Rent", amount: 1800, type: "expense", day: 2 },
  { label: "Car Payment", amount: 480, type: "expense", day: 5 },
  { label: "Subscriptions", amount: 220, type: "expense", day: 10 },
  { label: "Utilities", amount: 300, type: "expense", day: 12 },
  { label: "Groceries", amount: 750, type: "expense", day: 18 },
  { label: "Insurance", amount: 300, type: "expense", day: 20 },
  { label: "Credit Card", amount: 1500, type: "expense", day: 22 },
  { label: "Student Loan", amount: 450, type: "expense", day: 25 },
];
