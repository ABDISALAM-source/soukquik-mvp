import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { categoriesController } from './categories.controller';

const router = Router();
router.get('/', asyncHandler(categoriesController.list));

export default router;
