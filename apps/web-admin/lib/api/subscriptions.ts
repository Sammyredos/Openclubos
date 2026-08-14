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

export const getSubscriptionsAdmin = async (audience?: string): Promise<SubscriptionsResponse> => {
  
  const url = new URL(`${API_URL}/subscriptions/admin`);
  if (audience) url.searchParams.set('type', audience);
  const res = await fetch(url.toString(), {
    credentials: 'include',
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch subscriptions");
  }

  return res.json();
};

export const getPlans = async () => {
  
  const res = await fetch(`${API_URL}/subscriptions/plans`, {
    credentials: 'include',
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) throw new Error("Failed to fetch plans");
  return res.json();
};

export const createPlan = async (data: any) => {
  
  const res = await fetch(`${API_URL}/subscriptions/plans`, {
    credentials: 'include',
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create plan");
  return res.json();
};

export const updatePlan = async (id: string, data: any) => {
  
  const res = await fetch(`${API_URL}/subscriptions/plans/${id}`, {
    credentials: 'include',
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update plan");
  return res.json();
};

export const deletePlan = async (id: string) => {
  
  const res = await fetch(`${API_URL}/subscriptions/plans/${id}`, {
    credentials: 'include',
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) throw new Error("Failed to delete plan");
  return res.json();
};
