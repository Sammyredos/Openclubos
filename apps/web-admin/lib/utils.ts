import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
