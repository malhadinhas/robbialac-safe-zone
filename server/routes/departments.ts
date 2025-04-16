import { Router } from 'express';
import { 
  getDepartments, 
  getDepartmentById, 
  getDepartmentsWithEmployees,
  updateDepartmentEmployeeCount
} from '../controllers/departmentController';

const router = Router();

// Listar todos os departamentos
router.get('/', getDepartments);

// Buscar departamentos com número de funcionários
router.get('/with-employees', getDepartmentsWithEmployees);

// Buscar um departamento específico (usando :departmentId como param)
router.get('/:departmentId', getDepartmentById);

// Adicionar rota PUT para atualizar contagem de funcionários
router.put('/:departmentId/employee-count', updateDepartmentEmployeeCount);

export default router; 