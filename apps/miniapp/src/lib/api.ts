export interface ApiService {
  id: string;
  name: string;
  description: string;
  durationMin: number;
  price: number;
  category: string;
  sortOrder: number;
}

export interface ApiBarber {
  id: string;
  name: string;
  role: string;
  photoUrl: string;
  bio: string;
  experienceYears: number;
  sortOrder: number;
  barberServices?: {
    serviceId: string;
    durationMin?: number | null;
    price?: number | null;
  }[];
  portfolioItems?: {
    id: string;
    imageUrl: string;
    title?: string;
  }[];
}

export interface ApiTimeSlot {
  time: string;
  startsAt: string;
  endsAt: string;
  barberId: string;
}

export interface CreateBookingPayload {
  serviceIds: string[];
  barberId: string;
  startsAt: string;
  client: {
    name: string;
    phone: string;
  };
  comment?: string;
  source?: 'web' | 'telegram' | 'admin';
}

export interface ApiBooking {
  id: string;
  clientId: string;
  barberId: string;
  startsAt: string;
  endsAt: string;
  totalPrice: number;
  totalDurationMin: number;
  status: 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  source: string;
  manageToken: string;
  comment?: string;
  createdAt: string;
  client?: {
    id: string;
    name: string;
    phone: string;
  };
  barber?: {
    id: string;
    name: string;
    role: string;
    photoUrl: string;
  };
  bookingServices?: {
    id: string;
    serviceId: string;
    name: string;
    price: number;
    durationMin: number;
  }[];
}

export async function request(path: string, options?: RequestInit) {
  const origin = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/\/+$/, '')
    : '';
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${origin}${normalizedPath}`;
  return fetch(url, options);
}

const API_BASE = '/api/v1';

export async function fetchServices(): Promise<ApiService[]> {
  try {
    const res = await request(`${API_BASE}/services`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    return data.data || [];
  } catch (error) {
    console.error('fetchServices error:', error);
    return [];
  }
}

export async function fetchBarbers(): Promise<ApiBarber[]> {
  try {
    const res = await request(`${API_BASE}/barbers`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    return data.data || [];
  } catch (error) {
    console.error('fetchBarbers error:', error);
    return [];
  }
}

export async function fetchAvailability(params: {
  serviceIds: string[];
  barberId?: string;
  date: string;
}): Promise<ApiTimeSlot[]> {
  try {
    const query = new URLSearchParams({
      serviceIds: params.serviceIds.join(','),
      date: params.date,
    });
    if (params.barberId) {
      query.set('barberId', params.barberId);
    }

    const res = await request(`${API_BASE}/availability?${query.toString()}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch (error) {
    console.error('fetchAvailability error:', error);
    return [];
  }
}

export async function createBooking(payload: CreateBookingPayload): Promise<{
  success: boolean;
  data?: ApiBooking;
  error?: { code: string; message: string };
}> {
  try {
    const res = await request(`${API_BASE}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: data.error || { code: 'UNKNOWN_ERROR', message: 'Ошибка при создании записи' },
      };
    }
    return { success: true, data: data.data };
  } catch (error: any) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: error.message || 'Ошибка сети' },
    };
  }
}

export async function authenticateTelegram(initData: string): Promise<{
  success: boolean;
  client?: any;
  user?: any;
  error?: string;
}> {
  try {
    const res = await request(`${API_BASE}/me/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error?.message || 'Ошибка авторизации' };
    }
    return { success: true, client: data.data?.client, user: data.data?.user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function fetchMyBookings(params: { telegramId?: number | string; phone?: string }): Promise<ApiBooking[]> {
  try {
    const query = new URLSearchParams();
    if (params.telegramId) query.set('telegramId', params.telegramId.toString());
    if (params.phone) query.set('phone', params.phone);

    const res = await request(`${API_BASE}/me/bookings?${query.toString()}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch (error) {
    console.error('fetchMyBookings error:', error);
    return [];
  }
}

export async function cancelBookingByToken(token: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await request(`${API_BASE}/bookings/${token}/cancel`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error?.message || 'Не удалось отменить запись' };
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Ошибка сети' };
  }
}

export async function rescheduleBookingByToken(token: string, startsAt: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await request(`${API_BASE}/bookings/${token}/reschedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startsAt }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error?.message || 'Не удалось перенести запись' };
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Ошибка сети' };
  }
}
