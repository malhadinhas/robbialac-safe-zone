import express from 'express';
import { createAccident, updateAccident } from '../controllers/accidentController';
import { isAuthenticated, hasRole } from '../middleware/authMiddleware';
import { upload } from '../middleware/uploadMiddleware';

const router = express.Router();

router.post(
  '/',
  isAuthenticated,
  hasRole(['admin_qa', 'admin_app']),
  upload.single('document'),
  createAccident
);

router.put(
  '/:id',
  isAuthenticated,
  hasRole(['admin_qa', 'admin_app']),
  upload.single('document'),
  updateAccident
);

export default router;
