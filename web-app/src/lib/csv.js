// Tiny dependency-free CSV parser + bank-statement column detector.
// Handles quoted fields, escaped quotes ("") and commas inside quotes.

export function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];

    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++; // skip the escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
      continue;
    }

    if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++; // CRLF
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += c;
    }
  }
  // last field / row if file doesn't end in newline
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

// Turn raw rows into transaction objects {id, date, description, amount}.
// Auto-detects the date / description / amount columns from the header row.
export function rowsToTransactions(rows) {
  if (rows.length < 2) return [];

  const header = rows[0].map((h) => h.trim().toLowerCase());

  const find = (...names) =>
    header.findIndex((h) => names.some((n) => h.includes(n)));

  const dateIdx = find("date");
  const descIdx = find("description", "name", "memo", "details", "payee", "merchant");
  let amountIdx = find("amount", "debit", "value");
  // Some banks split debit/credit; fall back to the last numeric-looking column.
  if (amountIdx === -1) amountIdx = header.length - 1;

  const txns = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const description = (descIdx >= 0 ? r[descIdx] : r.join(" ")).trim();
    const amount = parseAmount(r[amountIdx]);
    if (!description) continue;
    txns.push({
      id: i,
      date: dateIdx >= 0 ? r[dateIdx]?.trim() : "",
      description,
      amount,
    });
  }
  return txns;
}

// Parse "$1,234.56", "(45.00)" (negative), "-12.34" etc. into a number.
function parseAmount(raw) {
  if (!raw) return 0;
  let s = raw.trim();
  let negative = false;
  if (s.startsWith("(") && s.endsWith(")")) {
    negative = true;
    s = s.slice(1, -1);
  }
  s = s.replace(/[^0-9.\-]/g, "");
  const n = parseFloat(s);
  if (Number.isNaN(n)) return 0;
  return negative ? -Math.abs(n) : n;
}
