import { api } from './client';

export async function fetchShops(params?: { category?: string; q?: string }) {
  const res = await api.get('/shops', { params });
  return res.data.data;
}

export async function fetchShop(id: string) {
  const res = await api.get(`/shops/${id}`);
  return res.data.data;
}

export async function fetchShopProducts(shopId: string) {
  const res = await api.get(`/shops/${shopId}/products`);
  return res.data.data;
}

export async function fetchProduct(id: string) {
  const res = await api.get(`/products/${id}`);
  return res.data.data;
}

export async function fetchServices(params?: { category?: string; q?: string; sort?: string }) {
  const res = await api.get('/services', { params });
  return res.data.data;
}

export async function fetchService(id: string) {
  const res = await api.get(`/services/${id}`);
  return res.data.data;
}

export async function search(params: { q?: string; type?: string; category?: string; sort?: string }) {
  const res = await api.get('/search', { params });
  return res.data.data;
}

export async function fetchCategories() {
  const res = await api.get('/categories');
  return res.data.data;
}
