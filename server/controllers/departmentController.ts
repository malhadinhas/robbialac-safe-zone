import { Request, Response } from 'express';
import { getCollection } from '../services/database';
import logger from '../utils/logger';
import { ObjectId } from 'mongodb';

interface Department {
  id: string;
  name: string;
  color: string;
  employeeCount: number;
}

// Buscar todos os departamentos
export const getDepartments = async (req: Request, res: Response) => {
  try {
    // Obter a coleção de departamentos
    const collection = await getCollection<Department>('departments');
    
    // Buscar todos os departamentos
    const departments = await collection.find().toArray();
    
    logger.info('Departamentos recuperados com sucesso', { count: departments.length });
    res.json(departments);
  } catch (error) {
    logger.error('Erro ao recuperar departamentos', { error });
    res.status(500).json({ message: 'Erro ao recuperar departamentos' });
  }
};

// Buscar um departamento específico
export const getDepartmentById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const collection = await getCollection<Department>('departments');
    
    // Buscar departamento pelo ID
    const department = await collection.findOne({ id });
    
    if (!department) {
      logger.warn('Departamento não encontrado', { id });
      return res.status(404).json({ message: 'Departamento não encontrado' });
    }
    
    logger.info('Departamento recuperado com sucesso', { id });
    res.json(department);
  } catch (error) {
    logger.error('Erro ao recuperar departamento', { id: req.params.id, error });
    res.status(500).json({ message: 'Erro ao recuperar departamento' });
  }
};

// Buscar departamentos com número de funcionários
export const getDepartmentsWithEmployees = async (req: Request, res: Response) => {
  try {
    const collection = await getCollection<Department>('departments');
    const departments = await collection.find().toArray();
    
    logger.info('Departamentos com funcionários recuperados com sucesso', { count: departments.length });
    res.json(departments);
  } catch (error) {
    logger.error('Erro ao recuperar departamentos com funcionários', { error });
    res.status(500).json({ message: 'Erro ao recuperar departamentos com funcionários' });
  }
};

// Atualizar contagem de funcionários de um departamento
export const updateDepartmentEmployeeCount = async (req: Request, res: Response) => {
  try {
    const { departmentId } = req.params; // Obter o _id dos parâmetros da rota
    const { employeeCount } = req.body;  // Obter a contagem do corpo

    // Validar entrada
    if (employeeCount === undefined || isNaN(Number(employeeCount)) || Number(employeeCount) < 0) {
      logger.warn('Contagem de funcionários inválida fornecida', { departmentId, employeeCount });
      return res.status(400).json({ message: 'Contagem de funcionários inválida.' });
    }

    if (!ObjectId.isValid(departmentId)) {
      logger.warn('ID de departamento inválido fornecido', { departmentId });
      return res.status(400).json({ message: 'ID de departamento inválido.' });
    }

    const collection = await getCollection<Department>('departments');
    
    // Atualizar o campo employeeCount do departamento correspondente
    const result = await collection.updateOne(
      { _id: new ObjectId(departmentId) }, // Filtrar pelo _id
      { $set: { employeeCount: Number(employeeCount) } } // Definir o novo valor
    );

    if (result.matchedCount === 0) {
      logger.warn('Departamento não encontrado para atualização de contagem', { departmentId });
      return res.status(404).json({ message: 'Departamento não encontrado' });
    }

    if (result.modifiedCount === 0) {
      // Isso pode acontecer se o valor enviado for o mesmo que já existe
      logger.info('Contagem de funcionários não modificada (valor igual ao existente)', { departmentId });
      return res.status(200).json({ message: 'Contagem de funcionários não modificada (valor igual ao existente)' });
    }

    logger.info('Contagem de funcionários atualizada com sucesso', { departmentId, employeeCount });
    res.status(200).json({ message: 'Contagem de funcionários atualizada com sucesso' });

  } catch (error) {
    logger.error('Erro ao atualizar contagem de funcionários', { id: req.params.departmentId, error });
    res.status(500).json({ message: 'Erro ao atualizar contagem de funcionários' });
  }
}; 