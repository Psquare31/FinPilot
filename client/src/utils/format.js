// Formatting helpers shared across the app.

const CURRENCY_SYMBOLS = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
};

export const currencySymbol = (code = "INR") => CURRENCY_SYMBOLS[code] || "";

// e.g. 148800 -> "₹1,48,800"
export const formatMoney = (amount = 0, currency = "INR") => {
  const n = Number(amount) || 0;
  const locale = currency === "INR" ? "en-IN" : "en-US";
  return `${currencySymbol(currency)}${n.toLocaleString(locale, {
    maximumFractionDigits: n % 1 === 0 ? 0 : 2,
    minimumFractionDigits: 0,
  })}`;
};

// Compact form for tight spots: ₹1.49L / ₹2.3K
export const formatCompact = (amount = 0, currency = "INR") => {
  const n = Number(amount) || 0;
  const s = currencySymbol(currency);
  const abs = Math.abs(n);
  if (currency === "INR") {
    if (abs >= 1e7) return `${s}${(n / 1e7).toFixed(2)}Cr`;
    if (abs >= 1e5) return `${s}${(n / 1e5).toFixed(2)}L`;
    if (abs >= 1e3) return `${s}${(n / 1e3).toFixed(1)}K`;
  } else {
    if (abs >= 1e6) return `${s}${(n / 1e6).toFixed(2)}M`;
    if (abs >= 1e3) return `${s}${(n / 1e3).toFixed(1)}K`;
  }
  return formatMoney(n, currency);
};

export const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const formatDateShort = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
};

export const todayISO = () => new Date().toISOString().slice(0, 10);

export const monthRange = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
};

export const initials = (first = "", last = "") =>
  `${(first[0] || "").toUpperCase()}${(last[0] || "").toUpperCase()}` || "U";

export const titleCase = (s = "") =>
  s
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

export const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

// Entities come from two backend layers: mapper DTOs expose `id`, raw
// mongoose docs expose `_id`. Normalise everywhere.
export const idOf = (entity) => entity?.id || entity?._id || null;
