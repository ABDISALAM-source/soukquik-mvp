import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { authGuard } from '../../common/guards/auth.guard';
import { requireRole } from '../../common/guards/role.guard';
import { brandsController } from './brands.controller';

const router = Router();

router.get('/', asyncHandler(brandsController.search));
// Création à la volée réservée aux vendeurs (au fil de l'ajout d'un produit).
router.post('/', authGuard, requireRole(['vendor']), asyncHandler(brandsController.create));

export default router;
