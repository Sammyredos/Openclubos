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

export function formatNumber(value: string | number): string {
  const raw = value.toString().trim();
  const numericValue =
    typeof value === "string"
      ? parseFloat(value.replace(/[^0-9.-]+/g, ""))
      : value;

  if (isNaN(numericValue)) return value.toString();

  const isNaira = raw.includes("₦");
  const absValue = Math.abs(numericValue);
  const sign = numericValue < 0 ? "-" : "";

  function formatKMB(n: number, divisor: number, suffix: string) {
    const val = n / divisor;
    const formatted = new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 1,
    }).format(val);
    return `${formatted}${suffix}`;
  }

  const prefix = isNaira ? "₦" : "";

  if (absValue >= 1_000_000_000) {
    return `${sign}${prefix}${formatKMB(absValue, 1_000_000_000, "b")}`;
  }
  if (absValue >= 1_000_000) {
    return `${sign}${prefix}${formatKMB(absValue, 1_000_000, "m")}`;
  }
  if (absValue >= 10_000) {
    return `${sign}${prefix}${formatKMB(absValue, 1_000, "k")}`;
  }

  const nf = new Intl.NumberFormat(isNaira ? "en-NG" : "en-US");
  return `${sign}${prefix}${nf.format(Math.round(absValue))}`;
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
  if (handicap >= 0 && handicap <= 5) return "Category 1";
  if (handicap >= 6 && handicap <= 12) return "Category 2";
  if (handicap >= 13 && handicap <= 20) return "Category 3";
  if (handicap >= 21 && handicap <= 28) return "Category 4";
  if (handicap >= 29) return "Category 5/6";
  return "Open";
}

export function formatCurrency(amount: number): string {
  const absValue = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";

  if (absValue > 11_000_000) {
    return `${sign}₦11m and above`;
  }

  if (absValue >= 1_000_000) {
    const val = absValue / 1_000_000;
    const formatted = new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 1,
    }).format(val);
    return `${sign}₦${formatted}m`;
  }

  return `${sign}₦${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(absValue)}`;
}