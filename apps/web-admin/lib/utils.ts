import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Country } from "country-state-city";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatAddress(
  address?: string | null,
  city?: string | null,
  state?: string | null,
  countryCode?: string | null
): string {
  const countryName = countryCode
    ? Country.getCountryByCode(countryCode)?.name || countryCode
    : "";

  const addressParts = address
    ? address.split(/[,.]+/).map((t) => t.trim()).filter(Boolean)
    : [];
  const cityParts = city
    ? city.split(/[,.]+/).map((t) => t.trim()).filter(Boolean)
    : [];
  const stateParts = state
    ? state.split(/[,.]+/).map((t) => t.trim()).filter(Boolean)
    : [];
  const countryParts = countryName
    ? countryName.split(/[,.]+/).map((t) => t.trim()).filter(Boolean)
    : [];

  const uniqueTokens: string[] = [];
  const seen = new Set<string>();

  const addTokens = (parts: string[]) => {
    for (const part of parts) {
      const lower = part.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        uniqueTokens.push(part);
      }
    }
  };

  addTokens(addressParts);
  addTokens(cityParts);
  addTokens(stateParts);
  addTokens(countryParts);

  const lowerCityParts = new Set(cityParts.map((c) => c.toLowerCase()));
  const lowerStateParts = new Set(stateParts.map((s) => s.toLowerCase()));
  const lowerCountryParts = new Set(countryParts.map((c) => c.toLowerCase()));

  const streetTokens: string[] = [];
  const matchedCityTokens: string[] = [];
  const matchedStateTokens: string[] = [];
  const matchedCountryTokens: string[] = [];

  for (const token of uniqueTokens) {
    const lower = token.toLowerCase();
    if (lowerCountryParts.has(lower) || lower === countryCode?.toLowerCase()) {
      matchedCountryTokens.push(token);
    } else if (lowerStateParts.has(lower)) {
      matchedStateTokens.push(token);
    } else if (lowerCityParts.has(lower)) {
      matchedCityTokens.push(token);
    } else {
      streetTokens.push(token);
    }
  }

  const orderedParts = [
    ...streetTokens,
    ...matchedCityTokens,
    ...matchedStateTokens,
    ...matchedCountryTokens,
  ];

  return orderedParts.join(", ");
}

export function formatThousandsInput(raw: string): string {
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return "";
  const n = Number(digits);
  if (!Number.isFinite(n)) return "";
  return new Intl.NumberFormat("en-US").format(n);
}

export function formatWithCommas(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export function formatNumber(
  value: string | number,
  options?: { compact?: boolean }
): string {
  const raw = value.toString().trim();
  const numericValue =
    typeof value === "string"
      ? parseFloat(value.replace(/[^0-9.-]+/g, ""))
      : value;

  if (isNaN(numericValue)) return value.toString();

  const isNaira = raw.includes("₦");
  const absValue = Math.abs(numericValue);
  const sign = numericValue < 0 ? "-" : "";
  const prefix = isNaira ? "₦" : "";

  if (options?.compact) {
    if (absValue >= 1_000_000_000) {
      return `${sign}${prefix}${(absValue / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}b`;
    }
    if (absValue >= 1_000_000) {
      return `${sign}${prefix}${(absValue / 1_000_000).toFixed(1).replace(/\.0$/, "")}m`;
    }
    if (absValue >= 10_000) {
      return `${sign}${prefix}${(absValue / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
    }
  }

  const nf = new Intl.NumberFormat(isNaira ? "en-NG" : "en-US", isNaira ? {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  } : undefined);
  
  return `${sign}${prefix ? prefix + " " : ""}${nf.format(isNaira ? absValue : Math.round(absValue))}`;
}

export type AdminEvent = { type: string; payload?: unknown; at: number };

export function broadcastAdminEvent(type: string, payload?: unknown) {
  if (typeof window === "undefined") return;
  const msg: AdminEvent = { type, payload, at: Date.now() };
  try {
    const ch = new BroadcastChannel("oc_admin_events");
    ch.postMessage(msg);
    ch.close();
  } catch {}
  try {
    window.localStorage.setItem("__oc_admin_event", JSON.stringify(msg));
    window.localStorage.removeItem("__oc_admin_event");
  } catch {}
}

export function subscribeAdminEvents(handler: (event: AdminEvent) => void) {
  if (typeof window === "undefined") return () => {};
  let bc: BroadcastChannel | null = null;
  function coerceEvent(data: unknown): AdminEvent | null {
    if (!data || typeof data !== "object" || !("type" in data)) return null;
    const t = (data as { type?: unknown }).type;
    if (typeof t !== "string") return null;
    const payload = (data as { payload?: unknown }).payload;
    const atRaw = (data as { at?: unknown }).at;
    const at = typeof atRaw === "number" ? atRaw : Date.now();
    return { type: t, payload, at };
  }
  function onBroadcast(ev: MessageEvent) {
    const evt = coerceEvent(ev.data);
    if (evt) handler(evt);
  }
  try {
    bc = new BroadcastChannel("oc_admin_events");
    bc.addEventListener("message", onBroadcast);
  } catch {}
  function onStorage(ev: StorageEvent) {
    if (ev.key !== "__oc_admin_event" || !ev.newValue) return;
    try {
      const parsed: unknown = JSON.parse(ev.newValue);
      const evt = coerceEvent(parsed);
      if (evt) handler(evt);
    } catch {}
  }
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener("storage", onStorage);
    if (bc) {
      bc.removeEventListener("message", onBroadcast);
      bc.close();
    }
  };
}

export function getAvatarUrl(user?: {
  profilePhoto?: string | null;
  gender?: string | null;
  email?: string | null;
  id?: string | null;
  name?: string | null;
}): string {
  if (!user) return `https://api.dicebear.com/7.x/initials/svg?seed=guest&backgroundColor=10b981`;
  
  if (user.profilePhoto) {
    return user.profilePhoto;
  }

  const name = user.name || user.email || user.id || "user";
  const seed = encodeURIComponent(name);

  return `https://api.dicebear.com/7.x/initials/svg?seed=${seed}&backgroundColor=10b981`;
}

export function getGolfCategory(handicap: number | null | undefined): string {
  if (handicap === null || handicap === undefined) return "Open";
  if (handicap < 0) return "Professional";
  if (handicap >= 0 && handicap <= 5) return "Category 1";
  if (handicap >= 6 && handicap <= 12) return "Category 2";
  if (handicap >= 13 && handicap <= 20) return "Category 3";
  if (handicap >= 21 && handicap <= 28) return "Category 4";
  if (handicap >= 29) return "Category 5/6";
  return "Open";
}

export const CURRENCY_SYMBOLS: Record<string, string> = {
  NGN: "₦",
  USD: "$",
  EUR: "€",
  GBP: "£",
  ZAR: "R",
  GHS: "GH₵",
  KES: "KSh",
  CAD: "CA$",
  AUD: "A$",
  AED: "AED ",
  JPY: "¥",
  INR: "₹",
  CNY: "¥",
  CHF: "CHF ",
  NZD: "NZ$",
  SGD: "SG$",
};

export function getCurrencySymbol(currency?: string | null): string {
  if (!currency) return "₦";
  const code = currency.trim().toUpperCase();
  return CURRENCY_SYMBOLS[code] || `${code} `;
}

export function formatCurrency(
  amount: number,
  currency: string = "NGN",
  options?: { showDecimals?: boolean; compact?: boolean }
): string {
  const absValue = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";
  const symbol = getCurrencySymbol(currency);
  const showDecimals = options?.showDecimals ?? true;

  if (options?.compact) {
    if (absValue >= 1_000_000_000) {
      return `${sign}${symbol}${(absValue / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}b`;
    }
    if (absValue >= 1_000_000) {
      return `${sign}${symbol}${(absValue / 1_000_000).toFixed(1).replace(/\.0$/, "")}m`;
    }
    if (absValue >= 10_000) {
      return `${sign}${symbol}${(absValue / 1_000).toFixed(1).replace(/\.0$/, "")}k`;
    }
  }

  return `${sign ? sign + " " : ""}${symbol}${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(absValue)}`;
}

export function formatTournamentFee(
  entryFee?: number | string | null,
  currency?: string | null,
  options?: { requiresPayment?: boolean }
): string {
  if (options?.requiresPayment === false) return "FREE";
  if (entryFee === null || entryFee === undefined || entryFee === "") return "FREE";
  const num = typeof entryFee === "string" ? parseFloat(entryFee.replace(/[^0-9.-]+/g, "")) : entryFee;
  if (!Number.isFinite(num) || num <= 0) return "FREE";

  const symbol = getCurrencySymbol(currency || "NGN");
  const formatted = num % 1 === 0
    ? formatWithCommas(num)
    : new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
  return `${symbol}${formatted}`;
}

export function formatTeeTime(timeStr?: string | null): string {
  if (!timeStr) return "TBA";
  const trimmed = timeStr.trim();

  // If it's an ISO timestamp string like 2026-08-18T08:20:00.000Z
  if (trimmed.includes("T")) {
    const d = new Date(trimmed);
    if (!isNaN(d.getTime())) {
      // Extract UTC/local time
      const hours = d.getUTCHours();
      const minutes = d.getUTCMinutes();
      const ampm = hours >= 12 ? "PM" : "AM";
      const h12 = hours % 12 || 12;
      const strHours = h12 < 10 ? `0${h12}` : `${h12}`;
      const strMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
      return `${strHours}:${strMinutes} ${ampm}`;
    }
  }

  // If already formatted like "08:30 AM" or "8:30 PM"
  if (/^\d{1,2}:\d{2}\s*(AM|PM)$/i.test(trimmed)) {
    return trimmed;
  }

  // If 24-hour time string like "08:30" or "14:20:00"
  const match = trimmed.match(/^(\d{1,2}):(\d{2})/);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    const strHours = hours < 10 ? `0${hours}` : `${hours}`;
    return `${strHours}:${minutes} ${ampm}`;
  }

  return trimmed;
}

const PRESERVED_ACRONYMS = new Set([
  "PGA",
  "USGA",
  "LPGA",
  "GHIN",
  "WHS",
  "DP",
  "OWGR",
  "UK",
  "USA",
  "USD",
  "NGN",
  "EUR",
  "GBP",
  "R&A",
]);

const ROMAN_NUMERALS = new Set([
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
  "XI",
  "XII",
  "XIII",
  "XIV",
  "XV",
  "XVI",
  "XVII",
  "XVIII",
  "XIX",
  "XX",
]);

const MINOR_WORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "but",
  "or",
  "nor",
  "for",
  "yet",
  "so",
  "at",
  "by",
  "in",
  "of",
  "on",
  "to",
  "up",
  "via",
  "with",
]);

function capitalizeSingleWord(word: string): string {
  if (!word) return "";

  const upper = word.toUpperCase();
  if (PRESERVED_ACRONYMS.has(upper)) return upper;
  if (ROMAN_NUMERALS.has(upper)) return upper;

  // Handle ordinals like 1st, 2nd, 3rd, 4th, 150th
  const ordinalMatch = word.match(/^(\d+)(st|nd|rd|th)$/i);
  if (ordinalMatch) {
    return `${ordinalMatch[1]}${ordinalMatch[2].toLowerCase()}`;
  }

  // Handle words with apostrophes like President's, Men's, O'Connor
  if (word.includes("'")) {
    return word
      .split("'")
      .map((part, index) => {
        if (index === 0) {
          return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
        }
        if (part.length === 1 && part.toLowerCase() === "s") {
          return "s";
        }
        return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
      })
      .join("'");
  }

  // Handle hyphenated words like Mid-Amateur, Four-Ball
  if (word.includes("-")) {
    return word
      .split("-")
      .map((part) => capitalizeSingleWord(part))
      .join("-");
  }

  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

export function toTitleCase(input?: string | null): string {
  if (!input) return "";
  const trimmed = input.trim();
  if (!trimmed) return "";

  const words = trimmed.split(/\s+/);
  const total = words.length;

  return words
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (index > 0 && index < total - 1 && MINOR_WORDS.has(lower)) {
        return lower;
      }
      return capitalizeSingleWord(word);
    })
    .join(" ");
}

export const formatTitleCase = toTitleCase;
