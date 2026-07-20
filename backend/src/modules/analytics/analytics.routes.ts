import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { analyticsController } from './analytics.controller';

// Endpoints de tracking : publics (le client peut ne pas être connecté).
// Montés à la racine /api : /track/product/:id/view, etc.
const router = Router();

router.post('/product/:id/view', asyncHandler(analyticsController.trackProductView));
router.post('/shop/:id/visit', asyncHandler(analyticsController.trackShopVisit));
router.post('/service/:id/visit', asyncHandler(analyticsController.trackServiceVisit));

export default router;
