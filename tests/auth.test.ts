import request from 'supertest';
import { createApp } from '../backend/src/app';

const app = createApp();

describe('Auth', () => {
  const email = `test_${Date.now()}@example.com`;

  it('registers a new client', async () => {
    const res = await request(app).post('/api/auth/register').send({
      fullName: 'Test User',
      email,
      phone: `+2530000${Date.now() % 100000}`,
      password: 'password123',
      role: 'client',
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('rejects login with wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email,
      password: 'wrongpassword',
    });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});
