import express from 'express';
import request from 'supertest';
import { z } from 'zod';
import { errorFilter } from '../backend/src/common/filters/error.filter';

describe('Zod validation handling', () => {
  it('returns 400 for Zod validation errors', async () => {
    const app = express();
    app.use(express.json());

    app.post('/invalid', (req, _res, next) => {
      const schema = z.object({ name: z.string() });
      try {
        schema.parse(req.body);
      } catch (err) {
        next(err);
      }
    });

    app.use(errorFilter);

    const res = await request(app).post('/invalid').send({ name: 42 });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Requête invalide');
  });
});
