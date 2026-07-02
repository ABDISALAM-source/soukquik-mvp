import request from 'supertest';
import { createApp } from '../backend/src/app';

const app = createApp();

describe('Services (public read)', () => {
  it('lists services without auth', async () => {
    const res = await request(app).get('/api/services');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('rejects service creation without auth', async () => {
    const res = await request(app).post('/api/services').send({ title: 'Test', price: 100 });
    expect(res.status).toBe(401);
  });
});
