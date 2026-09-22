export function getBankLogoUrl(bankIdentifier?: string | null): string | undefined {
  if (!bankIdentifier) return undefined;
  if (bankIdentifier.startsWith('http://') || bankIdentifier.startsWith('https://')) {
    return bankIdentifier;
  }
  return undefined;
}
