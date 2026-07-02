import { Router } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { searchController } from './search.controller';

const router = Router();
router.get('/', asyncHandler(searchController.search));

export default router;
