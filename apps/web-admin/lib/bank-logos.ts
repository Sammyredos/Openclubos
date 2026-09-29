/**
 * Utility for resolving high-resolution logos for Nigerian commercial banks and fintechs.
 * Uses primary CDN with automatic fallback to jsDelivr mirror.
 */

const PRIMARY_CDN = "https://nigerianbanks.xyz/logo";
const FALLBACK_CDN = "https://cdn.jsdelivr.net/gh/ichtrojan/nigerian-banks/logos";

/**
 * Mapping of Central Bank of Nigeria (CBN) 3-digit and NIP bank codes to logo slugs.
 */
const BANK_SLUGS_BY_CODE: Record<string, string> = {
  // Commercial Banks
  "044": "access-bank",
  "063": "access-bank-diamond",
  "023": "citibank-nigeria",
  "050": "ecobank-nigeria",
  "070": "fidelity-bank",
  "011": "first-bank-of-nigeria",
  "214": "first-city-monument-bank",
  "058": "guaranty-trust-bank",
  "030": "heritge-bank",
  "301": "jaiz-bank",
  "082": "keystone-bank",
  "303": "lotus-bank",
  "104": "parallex-bank",
  "076": "polaris-bank",
  "105": "premiumtrust-bank",
  "101": "providus-bank",
  "221": "stanbic-ibtc-bank",
  "068": "standard-chartered-bank",
  "232": "sterling-bank",
  "100": "suntrust-bank",
  "302": "taj-bank",
  "102": "titan-trust-bank",
  "032": "union-bank-of-nigeria",
  "033": "united-bank-for-africa",
  "215": "unity-bank",
  "035": "wema-bank",
  "035A": "alat-by-wema",
  "057": "zenith-bank",
  "107": "optimus-bank-limited",
  "106": "signature-bank-ltd",

  // Fintechs, Neobanks & Digital PSB / MFB
  "50211": "kuda-bank",
  "999992": "paycom", // OPay
  "999991": "palmpay",
  "50515": "moniepoint-mfb-ng",
  "565": "carbon",
  "566": "vfd",
  "100002": "paga",
  "100022": "gomoney",
  "125": "rubies-mfb",
  "50126": "eyowo",
  "51318": "fairmoney-microfinance-bank",
  "120003": "mtn-momo-psb",
  "120004": "airtel-smartcash-psb",
  "120001": "9mobile-9payment-service-bank",
  "120002": "hopepsb",
  "00103": "globus-bank",
  "50304": "mint-mfb",
  "51241": "fcmb-mfb",
  "51411": "bloc-mfb",
  "51341": "bankly-mfb",
  "50629": "npf-microfinance-bank",
  "50910": "consumer-microfinance-bank",
};

/**
 * Mapping of normalized lowercase aliases and bank names to logo slugs.
 */
const BANK_SLUGS_BY_NAME: Record<string, string> = {
  // GTBank
  "gtb": "guaranty-trust-bank",
  "gtbank": "guaranty-trust-bank",
  "gt bank": "guaranty-trust-bank",
  "guaranty trust bank": "guaranty-trust-bank",
  "guaranty trust": "guaranty-trust-bank",
  "guaranty trust holding": "guaranty-trust-bank",
  "gtco": "guaranty-trust-bank",

  // Access Bank
  "access": "access-bank",
  "access bank": "access-bank",
  "access bank plc": "access-bank",
  "access diamond": "access-bank-diamond",
  "diamond bank": "access-bank-diamond",

  // First Bank
  "first bank": "first-bank-of-nigeria",
  "first bank of nigeria": "first-bank-of-nigeria",
  "first bank plc": "first-bank-of-nigeria",
  "firstbank": "first-bank-of-nigeria",
  "fbn": "first-bank-of-nigeria",

  // Zenith Bank
  "zenith": "zenith-bank",
  "zenith bank": "zenith-bank",
  "zenith bank plc": "zenith-bank",

  // UBA
  "uba": "united-bank-for-africa",
  "united bank for africa": "united-bank-for-africa",
  "united bank for africa plc": "united-bank-for-africa",

  // Kuda
  "kuda": "kuda-bank",
  "kuda bank": "kuda-bank",
  "kuda microfinance bank": "kuda-bank",

  // OPay
  "opay": "paycom",
  "paycom": "paycom",
  "opay digital services": "paycom",

  // PalmPay
  "palmpay": "palmpay",
  "palm pay": "palmpay",

  // Moniepoint
  "moniepoint": "moniepoint-mfb-ng",
  "moniepoint mfb": "moniepoint-mfb-ng",
  "monie point": "moniepoint-mfb-ng",

  // Stanbic IBTC
  "stanbic": "stanbic-ibtc-bank",
  "stanbic ibtc": "stanbic-ibtc-bank",
  "stanbic ibtc bank": "stanbic-ibtc-bank",

  // Fidelity Bank
  "fidelity": "fidelity-bank",
  "fidelity bank": "fidelity-bank",
  "fidelity bank plc": "fidelity-bank",

  // FCMB
  "fcmb": "first-city-monument-bank",
  "first city monument bank": "first-city-monument-bank",

  // Sterling Bank
  "sterling": "sterling-bank",
  "sterling bank": "sterling-bank",

  // Union Bank
  "union": "union-bank-of-nigeria",
  "union bank": "union-bank-of-nigeria",
  "union bank of nigeria": "union-bank-of-nigeria",

  // Wema Bank / ALAT
  "wema": "wema-bank",
  "wema bank": "wema-bank",
  "alat": "alat-by-wema",
  "alat by wema": "alat-by-wema",

  // Polaris Bank
  "polaris": "polaris-bank",
  "polaris bank": "polaris-bank",

  // Providus Bank
  "providus": "providus-bank",
  "providus bank": "providus-bank",

  // Keystone Bank
  "keystone": "keystone-bank",
  "keystone bank": "keystone-bank",

  // Ecobank
  "ecobank": "ecobank-nigeria",
  "ecobank nigeria": "ecobank-nigeria",

  // Jaiz Bank
  "jaiz": "jaiz-bank",
  "jaiz bank": "jaiz-bank",

  // Taj Bank
  "taj": "taj-bank",
  "taj bank": "taj-bank",

  // Lotus Bank
  "lotus": "lotus-bank",
  "lotus bank": "lotus-bank",

  // Fintechs
  "carbon": "carbon",
  "vfd": "vfd",
  "vfd bank": "vfd",
  "vfd microfinance bank": "vfd",
  "paga": "paga",
  "rubies": "rubies-mfb",
  "rubies mfb": "rubies-mfb",
  "eyowo": "eyowo",
  "fairmoney": "fairmoney-microfinance-bank",
  "parallex": "parallex-bank",
  "premiumtrust": "premiumtrust-bank",
  "premium trust": "premiumtrust-bank",
  "optimus": "optimus-bank-limited",
  "signature": "signature-bank-ltd",
  "globus": "globus-bank",
  "globus bank": "globus-bank",
  "suntrust": "suntrust-bank",
  "suntrust bank": "suntrust-bank",
  "unity": "unity-bank",
  "unity bank": "unity-bank",
  "citibank": "citibank-nigeria",
  "standard chartered": "standard-chartered-bank",
  "standard chartered bank": "standard-chartered-bank",
  "heritage": "heritge-bank",
  "heritage bank": "heritge-bank",
  "momo": "mtn-momo-psb",
  "smartcash": "airtel-smartcash-psb",
};

/**
 * Resolves a bank slug from a bank code, name, or slug identifier.
 */
export function resolveBankSlug(bankIdentifier?: string | null): string | undefined {
  if (!bankIdentifier) return undefined;
  const raw = bankIdentifier.trim();
  if (!raw) return undefined;

  // Direct code match (e.g. "058", "044", "50211")
  const paddedCode = raw.padStart(3, "0");
  if (BANK_SLUGS_BY_CODE[raw]) return BANK_SLUGS_BY_CODE[raw];
  if (BANK_SLUGS_BY_CODE[paddedCode]) return BANK_SLUGS_BY_CODE[paddedCode];

  // Direct slug match
  const slugValues = Object.values(BANK_SLUGS_BY_CODE);
  if (slugValues.includes(raw.toLowerCase())) return raw.toLowerCase();

  // Normalized name lookup
  const normalized = raw
    .toLowerCase()
    .replace(/[._\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (BANK_SLUGS_BY_NAME[normalized]) {
    return BANK_SLUGS_BY_NAME[normalized];
  }

  // Substring match for compound names (e.g., "Guaranty Trust Bank (GTB)" -> "guaranty-trust-bank")
  for (const [key, slug] of Object.entries(BANK_SLUGS_BY_NAME)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return slug;
    }
  }

  return undefined;
}

/**
 * Returns the primary CDN URL for a bank logo.
 */
export function getBankLogoUrl(bankIdentifier?: string | null): string | undefined {
  if (!bankIdentifier) return undefined;
  if (bankIdentifier.startsWith("http://") || bankIdentifier.startsWith("https://")) {
    return bankIdentifier;
  }

  const slug = resolveBankSlug(bankIdentifier);
  if (slug) {
    return `${PRIMARY_CDN}/${slug}.png`;
  }

  return undefined;
}

/**
 * Returns the secondary/fallback jsDelivr mirror URL for a bank logo.
 */
export function getBankLogoFallbackUrl(bankIdentifier?: string | null): string | undefined {
  if (!bankIdentifier) return undefined;
  if (bankIdentifier.startsWith("http://") || bankIdentifier.startsWith("https://")) {
    return bankIdentifier;
  }

  const slug = resolveBankSlug(bankIdentifier);
  if (slug) {
    return `${FALLBACK_CDN}/${slug}.png`;
  }

  return undefined;
}
