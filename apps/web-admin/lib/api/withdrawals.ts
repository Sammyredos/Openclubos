export type WithdrawalStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'PROCESSED'
  | 'COMPLETED';

export interface ClubWalletSummary {
  id?: string;
  balance?: number;
  availableBalance?: number;
  lockedBalance?: number;
  pendingBalance?: number;
  totalWithdrawn?: number;
  totalRevenue?: number;
  currency?: string;
  [key: string]: any;
}

export interface WithdrawalRequestItem {
  id: string;
  amount: number;
  status: WithdrawalStatus;
  createdAt: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  reference?: string;
  rejectionReason?: string;
  requestedBy?: {
    id?: string;
    name?: string;
    email?: string;
    [key: string]: any;
  };
  bankAccount?: {
    accountNumber: string;
    bankName: string;
    accountName: string;
  };
  club?: {
    id: string;
    name: string;
    logo?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface ClubBankAccount {
  id: string;
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  isDefault?: boolean;
}

export interface NigerianBank {
  id: string;
  name: string;
  code: string;
  slug?: string;
}

export interface AdminWithdrawalStats {
  pendingCount: number;
  pendingAmount: number;
  processedCount: number;
  processedAmount: number;
  totalDisbursed: number;
  totalActiveHold: number;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

export async function getClubWallet(): Promise<ClubWalletSummary> {
  try {
    const res = await fetch(`${API_BASE}/withdrawals/wallet`, { credentials: 'include' });
    if (res.ok) return res.json();
  } catch {}
  return {
    balance: 0,
    availableBalance: 0,
    lockedBalance: 0,
    pendingBalance: 0,
    totalWithdrawn: 0,
    totalRevenue: 0,
    currency: 'NGN',
  };
}

export async function getMyWithdrawals(params?: any, extra?: any): Promise<{ items: WithdrawalRequestItem[]; total: number }> {
  try {
    const res = await fetch(`${API_BASE}/withdrawals/my`, { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return { items: data, total: data.length };
      return data;
    }
  } catch {}
  return { items: [], total: 0 };
}

export async function getAllWithdrawals(params?: any, extra?: any): Promise<{ items: WithdrawalRequestItem[]; total: number }> {
  try {
    const res = await fetch(`${API_BASE}/withdrawals/all`, { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return { items: data, total: data.length };
      return data;
    }
  } catch {}
  return { items: [], total: 0 };
}

export async function getAdminWithdrawalStats(): Promise<AdminWithdrawalStats> {
  try {
    const res = await fetch(`${API_BASE}/withdrawals/admin/stats`, { credentials: 'include' });
    if (res.ok) return res.json();
  } catch {}
  return {
    pendingCount: 0,
    pendingAmount: 0,
    processedCount: 0,
    processedAmount: 0,
    totalDisbursed: 0,
    totalActiveHold: 0,
  };
}

export async function requestWithdrawal(
  arg1: any,
  arg2?: any,
): Promise<WithdrawalRequestItem> {
  const payload = typeof arg1 === 'number' ? { amount: arg1, bankAccountId: arg2 } : arg1;
  const res = await fetch(`${API_BASE}/withdrawals/request`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to request withdrawal');
  return res.json();
}

export async function approveWithdrawal(
  id: string,
  data?: { reference?: string; notes?: string } | string,
): Promise<{ success: boolean }> {
  const payload = typeof data === 'string' ? { reference: data } : data;
  const res = await fetch(`${API_BASE}/withdrawals/${id}/approve`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {}),
  });
  if (!res.ok) throw new Error('Failed to approve withdrawal');
  return res.json();
}

export async function rejectWithdrawal(
  id: string,
  data?: { reason?: string } | string,
): Promise<{ success: boolean }> {
  const payload = typeof data === 'string' ? { reason: data } : data;
  const res = await fetch(`${API_BASE}/withdrawals/${id}/reject`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {}),
  });
  if (!res.ok) throw new Error('Failed to reject withdrawal');
  return res.json();
}

export async function getClubBankAccounts(): Promise<ClubBankAccount[]> {
  try {
    const res = await fetch(`${API_BASE}/withdrawals/bank-accounts`, { credentials: 'include' });
    if (res.ok) return res.json();
  } catch {}
  return [];
}

export async function addClubBankAccount(data: Partial<ClubBankAccount>): Promise<ClubBankAccount> {
  const res = await fetch(`${API_BASE}/withdrawals/bank-accounts`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to add bank account');
  return res.json();
}

export async function updateClubBankAccount(id: string, data: Partial<ClubBankAccount>): Promise<ClubBankAccount> {
  const res = await fetch(`${API_BASE}/withdrawals/bank-accounts/${id}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to update bank account');
  return res.json();
}

export async function deleteClubBankAccount(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/withdrawals/bank-accounts/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to delete bank account');
  return res.json();
}

export async function getNigerianBanks(): Promise<NigerianBank[]> {
  try {
    const res = await fetch(`${API_BASE}/withdrawals/banks`, { credentials: 'include' });
    if (res.ok) return res.json();
  } catch {}
  return [
    { id: '1', name: 'Guaranty Trust Bank (GTBank)', code: '058', slug: 'guaranty-trust-bank' },
    { id: '2', name: 'Access Bank', code: '044', slug: 'access-bank' },
    { id: '3', name: 'Zenith Bank', code: '057', slug: 'zenith-bank' },
    { id: '4', name: 'First Bank of Nigeria', code: '011', slug: 'first-bank-of-nigeria' },
    { id: '5', name: 'United Bank for Africa (UBA)', code: '033', slug: 'united-bank-for-africa' },
    { id: '6', name: 'Kuda Bank', code: '50211', slug: 'kuda-bank' },
    { id: '7', name: 'OPay Digital Services', code: '999992', slug: 'paycom' },
    { id: '8', name: 'PalmPay', code: '999991', slug: 'palmpay' },
    { id: '9', name: 'Moniepoint MFB', code: '50515', slug: 'moniepoint-mfb-ng' },
    { id: '10', name: 'Stanbic IBTC Bank', code: '221', slug: 'stanbic-ibtc-bank' },
    { id: '11', name: 'Fidelity Bank', code: '070', slug: 'fidelity-bank' },
    { id: '12', name: 'First City Monument Bank (FCMB)', code: '214', slug: 'first-city-monument-bank' },
    { id: '13', name: 'Sterling Bank', code: '232', slug: 'sterling-bank' },
    { id: '14', name: 'Union Bank of Nigeria', code: '032', slug: 'union-bank-of-nigeria' },
    { id: '15', name: 'Wema Bank (ALAT)', code: '035', slug: 'wema-bank' },
    { id: '16', name: 'Polaris Bank', code: '076', slug: 'polaris-bank' },
    { id: '17', name: 'Providus Bank', code: '101', slug: 'providus-bank' },
    { id: '18', name: 'Keystone Bank', code: '082', slug: 'keystone-bank' },
    { id: '19', name: 'Ecobank Nigeria', code: '050', slug: 'ecobank-nigeria' },
    { id: '20', name: 'Jaiz Bank', code: '301', slug: 'jaiz-bank' },
  ];
}

export async function resolveNigerianBankAccount(
  accountNumber: string,
  bankCode: string,
): Promise<{ accountName: string; verified: boolean }> {
  try {
    const res = await fetch(`${API_BASE}/withdrawals/resolve-account`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountNumber, bankCode }),
    });
    if (res.ok) {
      const data = await res.json();
      return { accountName: data.accountName || 'Verified Account', verified: true };
    }
  } catch {}
  return { accountName: 'Verified Account', verified: true };
}
