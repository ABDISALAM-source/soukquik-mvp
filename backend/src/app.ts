import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { env } from './config/env';
import { errorFilter } from './common/filters/error.filter';

import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';
import categoriesRoutes from './modules/categories/categories.routes';
import shopsRoutes from './modules/shops/shops.routes';
import productsRoutes from './modules/products/products.routes';
import servicesRoutes from './modules/services/services.routes';
import ordersRoutes from './modules/orders/orders.routes';
import bookingsRoutes from './modules/bookings/bookings.routes';
import chatRoutes from './modules/chat/chat.routes';
import searchRoutes from './modules/search/search.routes';
import adminRoutes from './modules/admin/admin.routes';
import likesRoutes from './modules/likes/likes.routes';
import reviewsRoutes from './modules/reviews/reviews.routes';
import notificationsRoutes from './modules/notifications/notifications.routes';
import promotionsRoutes from './modules/promotions/promotions.routes';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.corsOrigin }));
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ success: true, data: { status: 'ok' }, error: null });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/categories', categoriesRoutes);
  app.use('/api/shops', shopsRoutes); // inclut aussi /shops/:shopId/products, /orders et /presence
  app.use('/api/products', productsRoutes); // /products/:id
  app.use('/api/services', servicesRoutes); // inclut aussi /services/:serviceId/bookings
  app.use('/api/orders', ordersRoutes);
  app.use('/api/bookings', bookingsRoutes);
  app.use('/api/chats', chatRoutes);
  app.use('/api/search', searchRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/likes', likesRoutes);
  app.use('/api/reviews', reviewsRoutes);
  app.use('/api/notifications', notificationsRoutes);
  app.use('/api/promotions', promotionsRoutes);

  app.use((_req, res) => {
    res.status(404).json({ success: false, data: null, error: 'Route introuvable' });
  });

  app.use(errorFilter);

  return app;
}
