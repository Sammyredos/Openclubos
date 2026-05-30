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

export function parseThousandsInput(raw: string): number | undefined {
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return undefined;
  const n = Number(digits);
  return Number.isFinite(n) ? n : undefined;
}

export function formatWithCommas(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function pad2(n: number) {
  return n < 10 ? `0${n}` : String(n);
}

export function toLocalYMD(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function getTomorrowYMD(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return toLocalYMD(d);
}

export function formatNumber(value: string | number): string {
  const raw = value.toString().trim();
  const rawNoComma = raw.replace(/,/g, "");
  if (/^-?₦?\d+(\.\d+)?[KMB]$/i.test(rawNoComma)) return raw;
  const numericValue =
    typeof value === "string"
      ? parseFloat(value.replace(/[^0-9.-]+/g, ""))
      : value;

  if (isNaN(numericValue)) return value.toString();

  const isNaira = raw.includes("₦");
  const absValue = Math.abs(numericValue);
  const sign = numericValue < 0 ? "-" : "";
  const compactDecimals = 2;

  function truncFixed(n: number, decimals: number) {
    const factor = 10 ** decimals;
    const truncated = Math.trunc(n * factor) / factor;
    return truncated.toFixed(decimals);
  }

  if (isNaira) {
    if (absValue >= 1_000_000_000) {
      return `${sign}₦${truncFixed(absValue / 1_000_000_000, compactDecimals)}B`;
    }
    if (absValue >= 1_000_000) {
      return `${sign}₦${truncFixed(absValue / 1_000_000, compactDecimals)}M`;
    }
    if (absValue >= 10_000) {
      return `${sign}₦${truncFixed(absValue / 1_000, compactDecimals)}K`;
    }

    const nf = new Intl.NumberFormat("en-NG");
    return `${sign}₦${nf.format(Math.round(absValue))}`;
  }

  if (absValue >= 1_000_000_000) {
    return `${sign}${truncFixed(absValue / 1_000_000_000, compactDecimals)}B`;
  }
  if (absValue >= 1_000_000) {
    return `${sign}${truncFixed(absValue / 1_000_000, compactDecimals)}M`;
  }
  if (absValue >= 1_000) {
    return `${sign}${truncFixed(absValue / 1_000, compactDecimals)}K`;
  }

  const nf = new Intl.NumberFormat("en-US");
  return `${sign}${nf.format(absValue)}`;
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

export function getGolfCategory(handicap: number | null | undefined): string {
  if (handicap === null || handicap === undefined) return "Open";
  if (handicap >= 0 && handicap <= 5) return "Category 1";
  if (handicap >= 6 && handicap <= 12) return "Category 2";
  if (handicap >= 13 && handicap <= 20) return "Category 3";
  if (handicap >= 21 && handicap <= 28) return "Category 4";
  if (handicap >= 29) return "Category 5/6";
  return "Open";
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
