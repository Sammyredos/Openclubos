export type NotificationType =
  | 'INFO'
  | 'WARNING'
  | 'SUCCESS'
  | 'ERROR'
  | 'TOURNAMENT'
  | 'TOURNAMENT_ALERT'
  | 'TOURNAMENT_UPDATE'
  | 'WITHDRAWAL'
  | 'WITHDRAWAL_REQUESTED'
  | 'WITHDRAWAL_APPROVED'
  | 'WITHDRAWAL_REJECTED'
  | 'PAYMENT'
  | 'MEMBER'
  | string;

export interface AppNotification {
  id: string;
  title: string;
  message?: string;
  body: string;
  type: NotificationType;
  read?: boolean;
  isRead?: boolean;
  createdAt: string;
  link?: string;
  data?: any;
  metadata?: Record<string, any>;
  [key: string]: any;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

export async function getNotifications(params?: {
  skip?: number;
  take?: number;
  read?: boolean;
  unreadOnly?: boolean;
  [key: string]: any;
}): Promise<{
  items: AppNotification[];
  notifications: AppNotification[];
  total: number;
  unreadCount: number;
}> {
  try {
    const searchParams = new URLSearchParams();
    if (params?.skip !== undefined) searchParams.set('skip', String(params.skip));
    if (params?.take !== undefined) searchParams.set('take', String(params.take));
    if (params?.read !== undefined) searchParams.set('read', String(params.read));
    if (params?.unreadOnly !== undefined) searchParams.set('unreadOnly', String(params.unreadOnly));

    const res = await fetch(`${API_BASE}/notifications?${searchParams.toString()}`, {
      credentials: 'include',
    });
    if (res.ok) {
      const data = await res.json();
      const list = Array.isArray(data)
        ? data
        : data.notifications || data.items || [];
      return {
        items: list,
        notifications: list,
        total: data.total || list.length,
        unreadCount: data.unreadCount || 0,
      };
    }
  } catch {}
  return { items: [], notifications: [], total: 0, unreadCount: 0 };
}

export async function getUnreadNotificationCount(): Promise<number> {
  try {
    const res = await fetch(`${API_BASE}/notifications/unread-count`, {
      credentials: 'include',
    });
    if (res.ok) {
      const data = await res.json();
      return typeof data === 'number' ? data : data.count || 0;
    }
  } catch {}
  return 0;
}

export async function markNotificationAsRead(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'PATCH',
      credentials: 'include',
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function markAllNotificationsAsRead(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/notifications/mark-all-read`, {
      method: 'POST',
      credentials: 'include',
    });
    return res.ok;
  } catch {
    return false;
  }
}
