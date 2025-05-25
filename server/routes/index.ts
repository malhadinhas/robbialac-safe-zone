import { Router } from 'express';
import authRoutes from './authRoutes';
import usersRoutes from './users';
import videosRoutes from './videos';
import zonesRoutes from './zones';
import activityRoutes from './activityRoutes';
import incidentsRoutes from './incidents';
import systemRoutes from './system';
import uploadsRoutes from './uploads';
import secureUrlRoutes from './secureUrlRoutes';
import sensibilizacaoRoutes from './sensibilizacaoRoutes';
import statsRoutes from './statsRoutes';
import departmentsRoutes from './departments';
import interactionRoutes from './interactionRoutes';
import medalsRoutes from './medals';
import analyticsRoutes from './analyticsRoutes';
import accidentRoutes from './accidentRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/videos', videosRoutes);
router.use('/zones', zonesRoutes);
router.use('/activities', activityRoutes);
router.use('/incidents', incidentsRoutes);
router.use('/system', systemRoutes);
router.use('/uploads', uploadsRoutes);
router.use('/secure-url', secureUrlRoutes);
router.use('/sensibilizacao', sensibilizacaoRoutes);
router.use('/stats', statsRoutes);
router.use('/departments', departmentsRoutes);
router.use('/interactions', interactionRoutes);
router.use('/medals', medalsRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/accidents', accidentRoutes);

export default router; 