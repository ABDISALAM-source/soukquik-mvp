import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { authGuard } from '../../common/guards/auth.guard';
import { requireRole } from '../../common/guards/role.guard';
import { productsController } from './products.controller';

const router = Router();

router.get('/:id', asyncHandler(productsController.getById));
router.patch('/:id', authGuard, requireRole(['vendor']), asyncHandler(productsController.update));
router.delete('/:id', authGuard, requireRole(['vendor']), asyncHandler(productsController.remove));

export default router;
