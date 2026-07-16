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

export async function fetchTrendingShops(limit?: number) {
  const res = await api.get('/shops/trending', { params: { limit } });
  return res.data.data;
}

export async function fetchTrendingServices(limit?: number) {
  const res = await api.get('/services/trending', { params: { limit } });
  return res.data.data;
}

export async function fetchShopPopularProducts(shopId: string, limit?: number) {
  const res = await api.get(`/shops/${shopId}/popular-products`, { params: { limit } });
  return res.data.data;
}

// Tracking (Phase 10) — best-effort, on ignore les erreurs (analytics ne doit
// jamais bloquer l'affichage).
export async function trackProductView(productId: string) {
  api.post(`/track/product/${productId}/view`).catch(() => {});
}
export async function trackShopVisit(shopId: string) {
  api.post(`/track/shop/${shopId}/visit`).catch(() => {});
}
export async function trackServiceVisit(serviceId: string) {
  api.post(`/track/service/${serviceId}/visit`).catch(() => {});
}

export async function fetchNearbyShops(lat: number, lng: number, radiusKm?: number, limit?: number) {
  const res = await api.get('/shops/nearby', { params: { lat, lng, radiusKm, limit } });
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
  brandId?: string;
  price: number;
  stock?: number;
  imageUrl?: string;
  tags?: string[];
}

export async function createProduct(shopId: string, input: ProductInput) {
  const res = await api.post(`/shops/${shopId}/products`, input);
  return res.data.data;
}

export async function updateProduct(id: string, input: Partial<ProductInput>) {
  const res = await api.patch(`/products/${id}`, input);
  return res.data.data;
}

// --- Cascade d'ajout d'article (Phase 10 Lot B) ---
export async function fetchRootCategories() {
  const res = await api.get('/categories', { params: { roots: true } });
  return res.data.data as { id: string; name: string; type: string; parentId: string | null }[];
}

export async function fetchSubcategories(parentId: string) {
  const res = await api.get('/categories', { params: { parentId } });
  return res.data.data as { id: string; name: string; parentId: string }[];
}

export async function searchBrands(q: string) {
  const res = await api.get('/brands', { params: { q } });
  return res.data.data as { id: string; name: string; logoUrl: string | null }[];
}

export async function findOrCreateBrand(name: string) {
  const res = await api.post('/brands', { name });
  return res.data.data as { id: string; name: string };
}

export async function fetchPriceHint(categoryId: string) {
  const res = await api.get('/products/price-hint', { params: { categoryId } });
  return res.data.data as { count: number; min: number | null; median: number | null; max: number | null };
}

// --- Comparaison multi-boutiques + recherche photo (Phase 10 Lot C) ---
export interface CompareResult {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  shopId: string;
  shopName: string;
  shopLatitude: number | null;
  shopLongitude: number | null;
  brandName: string | null;
  distanceKm: number | null;
  similarity?: number;
}

export async function compareProduct(q: string, opts?: { lat?: number; lng?: number; sort?: 'price' | 'distance' }) {
  const res = await api.get('/products/compare', { params: { q, lat: opts?.lat, lng: opts?.lng, sort: opts?.sort } });
  return res.data.data as CompareResult[];
}

export async function imageSearch(imageBase64: string, opts?: { lat?: number; lng?: number }) {
  const res = await api.post('/products/image-search', { imageBase64, lat: opts?.lat, lng: opts?.lng });
  return res.data.data as { matched: boolean; results: CompareResult[] };
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

export async function fetchNearbyServices(lat: number, lng: number, radiusKm?: number, limit?: number) {
  const res = await api.get('/services/nearby', { params: { lat, lng, radiusKm, limit } });
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

export async function fetchProviderAnalytics() {
  const res = await api.get('/services/analytics/mine');
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
