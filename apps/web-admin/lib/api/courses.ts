import { getAuthToken } from './auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

export async function getCourses(clubId?: string) {
  const token = getAuthToken();
  const url = clubId ? `${API_BASE}/courses?clubId=${clubId}` : `${API_BASE}/courses`;
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.message || 'Failed to fetch courses');
  }
  return res.json();
}
