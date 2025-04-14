import { Router } from 'express';
import { getDepartments, getDepartmentById } from '../controllers/departmentController';

const router = Router();

// Listar todos os departamentos
router.get('/', getDepartments);

// Buscar um departamento específico
router.get('/:id', getDepartmentById);

export default router; 