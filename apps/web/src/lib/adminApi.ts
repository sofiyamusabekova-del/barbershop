const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export async function adminFetch(endpoint: string, options: RequestInit = {}) {
  const url = `${API_BASE}/admin${endpoint}`;
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  return response;
}

export async function adminLogin(login: string, password: string) {
  const res = await adminFetch('/login', {
    method: 'POST',
    body: JSON.stringify({ login, password }),
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

export async function adminLogout() {
  const res = await adminFetch('/logout', { method: 'POST' });
  return res.ok;
}

export async function adminGetMe() {
  const res = await adminFetch('/me');
  if (!res.ok) return null;
  const data = await res.json();
  return data.data;
}

export async function adminGetBookings(params: { status?: string; barberId?: string; date?: string } = {}) {
  const q = new URLSearchParams();
  if (params.status) q.set('status', params.status);
  if (params.barberId) q.set('barberId', params.barberId);
  if (params.date) q.set('date', params.date);

  const res = await adminFetch(`/bookings?${q.toString()}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.data || [];
}

export async function adminUpdateBookingStatus(id: string, status: string) {
  const res = await adminFetch(`/bookings/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  return res.ok;
}

export async function adminGetServices() {
  const res = await adminFetch('/services');
  if (!res.ok) return [];
  const data = await res.json();
  return data.data || [];
}

export async function adminCreateService(payload: any) {
  const res = await adminFetch('/services', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function adminUpdateService(id: string, payload: any) {
  const res = await adminFetch(`/services/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function adminDeleteService(id: string) {
  const res = await adminFetch(`/services/${id}`, { method: 'DELETE' });
  return res.ok;
}

export async function adminGetBarbers() {
  const res = await adminFetch('/barbers');
  if (!res.ok) return [];
  const data = await res.json();
  return data.data || [];
}

export async function adminCreateBarber(payload: any) {
  const res = await adminFetch('/barbers', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function adminUpdateBarber(id: string, payload: any) {
  const res = await adminFetch(`/barbers/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function adminUpdateSchedule(barberId: string, payload: any) {
  const res = await adminFetch(`/barbers/${barberId}/schedule`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  return res.ok;
}

export async function adminGetTimeOff() {
  const res = await adminFetch('/time-off');
  if (!res.ok) return [];
  const data = await res.json();
  return data.data || [];
}

export async function adminCreateTimeOff(payload: any) {
  const res = await adminFetch('/time-off', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function adminDeleteTimeOff(id: string) {
  const res = await adminFetch(`/time-off/${id}`, { method: 'DELETE' });
  return res.ok;
}

export async function adminGetReviews() {
  const res = await adminFetch('/reviews');
  if (!res.ok) return [];
  const data = await res.json();
  return data.data || [];
}

export async function adminUpdateReview(id: string, isPublic: boolean) {
  const res = await adminFetch(`/reviews/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ isPublic }),
  });
  return res.ok;
}

export async function adminGetSettings() {
  const res = await adminFetch('/settings');
  if (!res.ok) return [];
  const data = await res.json();
  return data.data || [];
}

export async function adminUpdateSettings(settings: Record<string, string>) {
  const res = await adminFetch('/settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  });
  return res.ok;
}

export async function adminGetAnalytics(params: { from?: string; to?: string; barberId?: string } = {}) {
  const q = new URLSearchParams();
  if (params.from) q.set('from', params.from);
  if (params.to) q.set('to', params.to);
  if (params.barberId) q.set('barberId', params.barberId);

  const res = await adminFetch(`/analytics?${q.toString()}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.data || null;
}
