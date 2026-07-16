import { Errors } from '../../common/errors';
import { analyticsRepository } from '../analytics/analytics.repository';
import { shopsRepository } from './shops.repository';
import { mapProduct } from '../products/products.repository';
import { CreateShopInput, UpdateShopInput } from './shops.types';

export const shopsService = {
  list(filters: { category?: string; q?: string }) {
    return shopsRepository.findAll(filters);
  },

  nearby(lat: number, lng: number, radiusKm: number, limit: number) {
    return shopsRepository.findNearby(lat, lng, radiusKm, limit);
  },

  async trending(limit: number) {
    const rows = await analyticsRepository.trendingShops(limit);
    return rows.map((r: any) => ({
      ...shopsRepository.mapPublic(r),
      recentSales: r.recent_sales,
      recentVisits: r.recent_visits,
    }));
  },

  async getById(id: string) {
    const shop = await shopsRepository.findById(id);
    if (!shop) throw Errors.notFound('Boutique introuvable');
    // Enrichissement Phase 10 : ventes totales + vues, affichés sur la page
    // boutique côté client.
    const [salesCount, viewsCount] = await Promise.all([
      analyticsRepository.shopSalesCount(id),
      analyticsRepository.shopViewsCount(id),
    ]);
    return { ...shop, salesCount, viewsCount };
  },

  async popularProducts(shopId: string, limit: number) {
    const rows = await analyticsRepository.popularProductsByShop(shopId, limit);
    return rows.map((r: any) => ({ ...mapProduct(r), salesCount: r.sales_count, viewsCount: r.views_count }));
  },

  create(ownerId: string, input: CreateShopInput) {
    return shopsRepository.create(ownerId, input);
  },

  async update(id: string, ownerId: string, input: UpdateShopInput) {
    const shop = await shopsRepository.findRawById(id);
    if (!shop) throw Errors.notFound('Boutique introuvable');
    if (shop.owner_id !== ownerId) throw Errors.forbidden("Vous n'êtes pas propriétaire de cette boutique");
    return shopsRepository.update(id, input);
  },

  async remove(id: string, ownerId: string) {
    const shop = await shopsRepository.findRawById(id);
    if (!shop) throw Errors.notFound('Boutique introuvable');
    if (shop.owner_id !== ownerId) throw Errors.forbidden("Vous n'êtes pas propriétaire de cette boutique");
    await shopsRepository.softDelete(id);
  },

  async analytics(id: string, ownerId: string) {
    const shop = await shopsRepository.findRawById(id);
    if (!shop) throw Errors.notFound('Boutique introuvable');
    if (shop.owner_id !== ownerId) throw Errors.forbidden("Vous n'êtes pas propriétaire de cette boutique");
    const [base, visits] = await Promise.all([
      shopsRepository.analytics(id),
      analyticsRepository.shopVisitStats(id),
    ]);
    return { ...base, ...visits };
  },
};
