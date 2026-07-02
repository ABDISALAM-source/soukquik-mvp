import request from 'supertest';
import { createApp } from '../backend/src/app';

const app = createApp();

describe('Products (public read)', () => {
  it('lists products of a shop without auth (may be empty for unknown shop)', async () => {
    const res = await request(app).get('/api/shops/00000000-0000-0000-0000-000000000000/products');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('rejects product creation without auth', async () => {
    const res = await request(app)
      .post('/api/shops/00000000-0000-0000-0000-000000000000/products')
      .send({ name: 'Test', price: 100, stock: 1 });
    expect(res.status).toBe(401);
  });
});
