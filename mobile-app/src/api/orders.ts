import { api } from './client';

export async function createOrder(input: { shopId: string; items: { productId: string; quantity: number }[]; deliveryAddress?: string }) {
  const res = await api.post('/orders', input);
  return res.data.data;
}

export async function fetchMyOrders() {
  const res = await api.get('/orders/me');
  return res.data.data;
}

export async function fetchShopOrders(shopId: string) {
  const res = await api.get(`/shops/${shopId}/orders`);
  return res.data.data;
}

export async function updateOrderStatus(orderId: string, status: string) {
  const res = await api.patch(`/orders/${orderId}/status`, { status });
  return res.data.data;
}

export async function createBooking(input: { serviceId: string; scheduledAt?: string; notes?: string }) {
  const res = await api.post('/bookings', input);
  return res.data.data;
}

export async function fetchMyBookings() {
  const res = await api.get('/bookings/me');
  return res.data.data;
}

export async function fetchServiceBookings(serviceId: string) {
  const res = await api.get(`/services/${serviceId}/bookings`);
  return res.data.data;
}

export async function updateBookingStatus(bookingId: string, status: string) {
  const res = await api.patch(`/bookings/${bookingId}/status`, { status });
  return res.data.data;
}
