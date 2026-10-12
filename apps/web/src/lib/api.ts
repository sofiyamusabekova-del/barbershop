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

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export async function fetchServices(): Promise<ApiService[]> {
  try {
    const res = await fetch(`${API_BASE}/services`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    return data.data || [];
  } catch (error) {
    console.error('API fetchServices error:', error);
    return [];
  }
}

export async function fetchBarbers(): Promise<ApiBarber[]> {
  try {
    const res = await fetch(`${API_BASE}/barbers`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);
    const data = await res.json();
    return data.data || [];
  } catch (error) {
    console.error('API fetchBarbers error:', error);
    return [];
  }
}

export async function fetchBarberById(id: string): Promise<ApiBarber | null> {
  try {
    const res = await fetch(`${API_BASE}/barbers/${id}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data || null;
  } catch (error) {
    console.error('API fetchBarberById error:', error);
    return null;
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

    const res = await fetch(`${API_BASE}/availability?${query.toString()}`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data || [];
  } catch (error) {
    console.error('API fetchAvailability error:', error);
    return [];
  }
}

export async function createBooking(payload: CreateBookingPayload): Promise<{
  success: boolean;
  data?: ApiBooking;
  error?: { code: string; message: string };
}> {
  try {
    const res = await fetch(`${API_BASE}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: data.error || { code: 'UNKNOWN_ERROR', message: 'Ошибка бронирования' },
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

export async function fetchBookingByToken(token: string): Promise<ApiBooking | null> {
  try {
    const res = await fetch(`${API_BASE}/bookings/${token}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return data.data || null;
  } catch (error) {
    console.error('API fetchBookingByToken error:', error);
    return null;
  }
}

export async function cancelBooking(token: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/bookings/${token}/cancel`, {
      method: 'POST',
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error?.message || 'Ошибка отмены' };
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Ошибка сети' };
  }
}

export async function rescheduleBooking(
  token: string,
  startsAt: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/bookings/${token}/reschedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ startsAt }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error?.message || 'Ошибка переноса' };
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Ошибка сети' };
  }
}
