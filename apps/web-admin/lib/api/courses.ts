import { getAuthToken, handleAuthFailure } from './auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

export interface TeeBox {
  id?: string;
  name: string;
  color: string;
  yardage: number;
  rating?: number;
  slope?: number;
}

interface HoleDetail {
  id?: string;
  number: number;
  par: number;
  index: number;
  distance: number;
}

export interface Course {
  id: string;
  name: string;
  alsoKnownAs?: string | null;
  type: string;
  country: string;
  state: string | null;
  city: string | null;
  
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  
  holes: number;
  par: number;
  yearEstablished?: number | null;
  architect?: string | null;
  courseRating?: number | null;
  slopeRating?: number | null;
  
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  bookingUrl?: string | null;
  
  amenities: string[];
  coverImage?: string | null;
  galleryImages: string[];
  
  status: 'ACTIVE' | 'INACTIVE';
  isFeatured: boolean;
  
  clubId?: string;
  club?: { id: string; name: string };
  teeBoxes?: TeeBox[];
  holeDetails?: HoleDetail[];
  createdAt: string;
  tournamentCount?: number;
}

export interface CourseStats {
  totalCourses: number;
  countries: number;
  cities: number;
  activeCourses: number;
  inactiveCourses: number;
}

export interface CourseResponse {
  items: Course[];
  total: number;
  stats?: CourseStats;
}

export async function getCourses(clubId?: string): Promise<Course[]> {
  const token = getAuthToken();
  const url = clubId ? `${API_BASE}/courses?clubId=${clubId}` : `${API_BASE}/courses`;
  const res = await fetch(url, {
    
  });
  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.message || 'Failed to fetch courses');
  }
  const data = await res.json();
  return Array.isArray(data) ? data : data.items || [];
}

export async function getAdminCourses(params: {
  skip?: number;
  take?: number;
  search?: string;
  country?: string;
  city?: string;
  type?: string;
  status?: string;
}): Promise<CourseResponse> {
  const token = getAuthToken();
  const searchParams = new URLSearchParams();
  if (params.skip !== undefined) searchParams.append('skip', params.skip.toString());
  if (params.take !== undefined) searchParams.append('take', params.take.toString());
  if (params.search) searchParams.append('search', params.search);
  if (params.country) searchParams.append('country', params.country);
  if (params.city) searchParams.append('city', params.city);
  if (params.type) searchParams.append('type', params.type);
  if (params.status) searchParams.append('status', params.status);

  const res = await fetch(`${API_BASE}/courses/admin?${searchParams.toString()}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : undefined),
    },
    credentials: 'include', cache: 'no-store',
  });

  if (!res.ok) {
    await handleAuthFailure(res);
    const error = await res.json().catch(() => null);
    throw new Error(error?.message || 'Failed to fetch admin courses');
  }
  return res.json();
}

export async function getCourse(id: string): Promise<Course> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/courses/${id}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : undefined),
    },
    credentials: 'include', cache: 'no-store',
  });

  if (!res.ok) {
    await handleAuthFailure(res);
    const error = await res.json().catch(() => null);
    throw new Error(error?.message || 'Failed to fetch course');
  }
  return res.json();
}

export async function createCourse(data: any) {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/courses`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : undefined),
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.message || 'Failed to create course');
  }
  return res.json();
}

export async function updateCourse(id: string, data: any) {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/courses/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : undefined),
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.message || 'Failed to update course');
  }
  return res.json();
}

export async function deleteCourse(id: string) {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}/courses/${id}`, {
    method: 'DELETE',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : undefined),
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => null);
    throw new Error(error?.message || 'Failed to delete course');
  }
  
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}
