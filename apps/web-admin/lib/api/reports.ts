export interface Report {
  id: string;
  name: string;
  type: string;
  format: 'PDF' | 'CSV' | 'XLSX';
  status: 'PENDING' | 'GENERATING' | 'READY' | 'FAILED';
  fileUrl?: string | null;
  url?: string;
  sizeBytes?: number;
  createdAt: string;
  tournamentId?: string | null;
  tournament?: {
    id: string;
    name: string;
  };
  [key: string]: any;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

export async function getReports(
  arg1?: any,
  arg2?: any,
): Promise<any> {
  try {
    const res = await fetch(`${API_BASE}/reports`, {
      credentials: 'include',
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
      return data.reports || [];
    }
  } catch {}
  return [];
}

export async function generateReport(data: {
  name: string;
  type: string;
  format: string;
  tournamentId?: string;
  clubId?: string;
  [key: string]: any;
}): Promise<Report> {
  const res = await fetch(`${API_BASE}/reports/generate`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to generate report');
  return res.json();
}

export async function deleteReport(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE}/reports/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to delete report');
  return res.json();
}
