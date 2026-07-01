import { getAuthToken } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export interface Subscription {
  id: string;
  organizer: string;
  email: string;
  avatarColor: string;
  initials: string;
  plan: string;
  planLimit: string;
  billingCycle: string;
  status: string;
  nextBillingDate: string;
  nextBillingSub: string;
  amount: string;
}

export interface SubscriptionStats {
  activeSubscriptions: number;
  monthlyRevenue: number;
  annualRevenue: number;
  pastDue: number;
}

export interface SubscriptionsResponse {
  items: Subscription[];
  total: number;
  stats: SubscriptionStats;
}

export const getSubscriptionsAdmin = async (): Promise<SubscriptionsResponse> => {
  const token = getAuthToken();
  const res = await fetch(`${API_URL}/subscriptions/admin`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch subscriptions");
  }

  return res.json();
};
