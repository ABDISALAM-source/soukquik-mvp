import { pool } from '../../config/db';

interface SearchFilters {
  q?: string;
  type?: 'product' | 'service' | 'shop' | 'all';
  category?: string;
  sort?: 'price_asc' | 'price_desc' | 'recent';
}

export const searchService = {
  async search(filters: SearchFilters) {
    const q = filters.q ? `%${filters.q}%` : '%%';
    const type = filters.type || 'all';

    const results: any = { products: [], services: [], shops: [] };

    if (type === 'all' || type === 'product') {
      const params: any[] = [q];
      let extra = '';
      if (filters.category) {
        params.push(filters.category);
        extra = `AND p.category_id = $${params.length}`;
      }
      let orderBy = 'p.created_at DESC';
      if (filters.sort === 'price_asc') orderBy = 'p.price ASC';
      if (filters.sort === 'price_desc') orderBy = 'p.price DESC';
      const { rows } = await pool.query(
        `SELECT p.id, p.name, p.price, p.image_url, p.shop_id, s.latitude AS shop_latitude, s.longitude AS shop_longitude
         FROM products p
         JOIN shops s ON s.id = p.shop_id
         WHERE p.is_active = true AND p.name ILIKE $1 ${extra} ORDER BY ${orderBy} LIMIT 30`,
        params
      );
      results.products = rows.map((r: any) => ({
        id: r.id,
        name: r.name,
        price: r.price,
        imageUrl: r.image_url,
        shopId: r.shop_id,
        shopLatitude: r.shop_latitude,
        shopLongitude: r.shop_longitude,
      }));
    }

    if (type === 'all' || type === 'service') {
      const params: any[] = [q];
      let extra = '';
      if (filters.category) {
        params.push(filters.category);
        extra = `AND category_id = $${params.length}`;
      }
      let orderBy = 'created_at DESC';
      if (filters.sort === 'price_asc') orderBy = 'price ASC';
      if (filters.sort === 'price_desc') orderBy = 'price DESC';
      const { rows } = await pool.query(
        `SELECT id, title, price, provider_id, latitude, longitude FROM services WHERE is_active = true AND title ILIKE $1 ${extra} ORDER BY ${orderBy} LIMIT 30`,
        params
      );
      results.services = rows.map((r: any) => ({
        id: r.id,
        title: r.title,
        price: r.price,
        providerId: r.provider_id,
        latitude: r.latitude,
        longitude: r.longitude,
      }));
    }

    if (type === 'all' || type === 'shop') {
      const params: any[] = [q];
      let extra = '';
      if (filters.category) {
        params.push(filters.category);
        extra = `AND category_id = $${params.length}`;
      }
      const { rows } = await pool.query(
        `SELECT id, name, logo_url, latitude, longitude FROM shops WHERE is_active = true AND name ILIKE $1 ${extra} ORDER BY created_at DESC LIMIT 30`,
        params
      );
      results.shops = rows.map((r: any) => ({
        id: r.id,
        name: r.name,
        logoUrl: r.logo_url,
        latitude: r.latitude,
        longitude: r.longitude,
      }));
    }

    return results;
  },
};
