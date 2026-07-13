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

export interface ShopInput {
  name: string;
  description?: string;
  categoryId?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  logoUrl?: string;
}

export async function createShop(input: ShopInput) {
  const res = await api.post('/shops', input);
  return res.data.data;
}

export async function updateShop(id: string, input: Partial<ShopInput>) {
  const res = await api.patch(`/shops/${id}`, input);
  return res.data.data;
}

export async function fetchProduct(id: string) {
  const res = await api.get(`/products/${id}`);
  return res.data.data;
}

export interface ProductInput {
  name: string;
  description?: string;
  categoryId?: string;
  price: number;
  stock?: number;
  imageUrl?: string;
}

export async function createProduct(shopId: string, input: ProductInput) {
  const res = await api.post(`/shops/${shopId}/products`, input);
  return res.data.data;
}

export async function updateProduct(id: string, input: Partial<ProductInput>) {
  const res = await api.patch(`/products/${id}`, input);
  return res.data.data;
}

export async function deactivateProduct(id: string) {
  await api.delete(`/products/${id}`);
}

export async function fetchServices(params?: { category?: string; q?: string; sort?: string }) {
  const res = await api.get('/services', { params });
  return res.data.data;
}

export async function fetchService(id: string) {
  const res = await api.get(`/services/${id}`);
  return res.data.data;
}

export interface ServiceInput {
  title: string;
  description?: string;
  categoryId?: string;
  price: number;
  priceUnit?: string;
  latitude?: number;
  longitude?: number;
  serviceAreaKm?: number;
}

export async function createService(input: ServiceInput) {
  const res = await api.post('/services', input);
  return res.data.data;
}

export async function updateService(id: string, input: Partial<ServiceInput>) {
  const res = await api.patch(`/services/${id}`, input);
  return res.data.data;
}

export async function deactivateService(id: string) {
  await api.delete(`/services/${id}`);
}

export async function search(params: { q?: string; type?: string; category?: string; sort?: string }) {
  const res = await api.get('/search', { params });
  return res.data.data;
}

export async function fetchCategories() {
  const res = await api.get('/categories');
  return res.data.data;
}
