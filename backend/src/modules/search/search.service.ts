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
        extra = `AND category_id = $${params.length}`;
      }
      let orderBy = 'created_at DESC';
      if (filters.sort === 'price_asc') orderBy = 'price ASC';
      if (filters.sort === 'price_desc') orderBy = 'price DESC';
      const { rows } = await pool.query(
        `SELECT id, name, price, image_url, shop_id FROM products WHERE is_active = true AND name ILIKE $1 ${extra} ORDER BY ${orderBy} LIMIT 30`,
        params
      );
      results.products = rows.map((r: any) => ({
        id: r.id,
        name: r.name,
        price: r.price,
        imageUrl: r.image_url,
        shopId: r.shop_id,
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
        `SELECT id, title, price, provider_id FROM services WHERE is_active = true AND title ILIKE $1 ${extra} ORDER BY ${orderBy} LIMIT 30`,
        params
      );
      results.services = rows.map((r: any) => ({
        id: r.id,
        title: r.title,
        price: r.price,
        providerId: r.provider_id,
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
        `SELECT id, name, logo_url FROM shops WHERE is_active = true AND name ILIKE $1 ${extra} ORDER BY created_at DESC LIMIT 30`,
        params
      );
      results.shops = rows.map((r: any) => ({
        id: r.id,
        name: r.name,
        logoUrl: r.logo_url,
      }));
    }

    return results;
  },
};
