import { Request, Response } from 'express';
import { getCollection } from '../services/database';
import logger from '../utils/logger';

interface Department {
  value: string;
  label: string;
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
    
    // Buscar departamento pelo ID (value)
    const department = await collection.findOne({ value: id });
    
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