"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const departmentController_1 = require("../controllers/departmentController");
const router = (0, express_1.Router)();
// Listar todos os departamentos
router.get('/', departmentController_1.getDepartments);
// Buscar departamentos com número de funcionários
router.get('/with-employees', departmentController_1.getDepartmentsWithEmployees);
// Buscar um departamento específico (usando :departmentId como param)
router.get('/:departmentId', departmentController_1.getDepartmentById);
// Adicionar rota PUT para atualizar contagem de funcionários
router.put('/:departmentId/employee-count', departmentController_1.updateDepartmentEmployeeCount);
exports.default = router;
