import { Router } from 'express';
import { getDepartments, getDepartmentById, getDepartmentsWithEmployees } from '../controllers/departmentController';

const router = Router();

// Listar todos os departamentos
router.get('/', getDepartments);

// Buscar departamentos com número de funcionários
router.get('/with-employees', getDepartmentsWithEmployees);

// Buscar um departamento específico
router.get('/:id', getDepartmentById);

export default router; 