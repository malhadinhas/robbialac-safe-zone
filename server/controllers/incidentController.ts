import { Request, Response } from 'express';
import logger from '../utils/logger';
import crypto from 'crypto';
import Like from '../models/Like';
import Comment from '../models/Comment';
import IncidentModel from '../models/Incident';
import DepartmentModel from '../models/Department';
import { isValidObjectId } from 'mongoose';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: string;
  };
}

export async function getIncidents(req: Request, res: Response): Promise<void> {
  try {
    const statusFilter = req.query.status as string;
    let query = {};

    if (statusFilter === 'not_archived') {
      query = { status: { $ne: 'Arquivado' } };
    } else if (statusFilter === 'archived') {
      query = { status: 'Arquivado' };
    }

    const incidents = await IncidentModel.find(query).lean();

    const formatted = incidents.map((incident: any) => ({
      ...incident,
      likes: ((incident as any).likes || []).length,
      comments: ((incident as any).comments || []).length
    }));

    res.json(formatted);
  } catch (error) {
    logger.error('Erro ao buscar incidentes:', error);
    res.status(500).json({ message: 'Erro interno ao buscar incidentes' });
  }
}

export async function getIncidentById(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;

    if (!isValidObjectId(id)) {
      res.status(400).json({ message: 'ID inválido' });
      return;
    }

    const incident = await IncidentModel.findById(id).lean();

    if (!incident) {
      res.status(404).json({ message: 'Incidente não encontrado' });
      return;
    }

    const response = {
      ...incident,
      likes: ((incident as any).likes || []).length,
      comments: ((incident as any).comments || []).length
    };

    res.json(response);
  } catch (error) {
    logger.error('Erro ao buscar incidente por ID:', error);
    res.status(500).json({ message: 'Erro interno ao buscar incidente' });
  }
}

export async function createIncident(req: Request, res: Response): Promise<void> {
  try {
    const { title, description, department, date } = req.body;

    if (!title || !department || !date) {
      res.status(400).json({ message: 'Campos obrigatórios em falta.' });
      return;
    }

    const newIncident = new IncidentModel({
      title,
      description,
      department,
      date: new Date(date),
      status: 'Novo',
      likes: [],
      comments: []
    });

    await newIncident.save();
    res.status(201).json({ message: 'Incidente criado com sucesso', incident: newIncident });
  } catch (error) {
    logger.error('Erro ao criar incidente:', error);
    res.status(500).json({ message: 'Erro interno ao criar incidente' });
  }
}

export async function updateIncident(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id;

    if (!isValidObjectId(id)) {
      res.status(400).json({ message: 'ID inválido' });
      return;
    }

    const updated = await IncidentModel.findByIdAndUpdate(id, req.body, { new: true });

    if (!updated) {
      res.status(404).json({ message: 'Incidente não encontrado' });
      return;
    }

    res.json({ message: 'Incidente atualizado com sucesso', incident: updated });
  } catch (error) {
    logger.error('Erro ao atualizar incidente:', error);
    res.status(500).json({ message: 'Erro interno ao atualizar incidente' });
  }
}

export async function deleteIncident(req: Request, res: Response): Promise<void> {
  try {
    const id = req.params.id;

    if (!isValidObjectId(id)) {
      res.status(400).json({ message: 'ID inválido' });
      return;
    }

    const deleted = await IncidentModel.findByIdAndDelete(id);

    if (!deleted) {
      res.status(404).json({ message: 'Incidente não encontrado' });
      return;
    }

    res.json({ message: 'Incidente removido com sucesso' });
  } catch (error) {
    logger.error('Erro ao deletar incidente:', error);
    res.status(500).json({ message: 'Erro interno ao deletar incidente' });
  }
}

export async function getIncidentsByDepartment(req: Request, res: Response): Promise<void> {
  try {
    const { department, year } = req.query;

    const match: any = {};
    if (department) match.department = department;
    if (year) {
      const start = new Date(`${year}-01-01`);
      const end = new Date(`${year}-12-31`);
      match.date = { $gte: start, $lte: end };
    }

    const incidents = await IncidentModel.find(match).lean();
    res.json(incidents);
  } catch (error) {
    logger.error('Erro ao buscar incidentes por departamento:', error);
    res.status(500).json({ message: 'Erro ao buscar incidentes' });
  }
}

export async function getRecentIncidents(_req: Request, res: Response): Promise<void> {
  try {
    const recent = await IncidentModel.find({})
      .sort({ date: -1 })
      .limit(10)
      .lean();

    res.json(recent);
  } catch (error) {
    logger.error('Erro ao buscar incidentes recentes:', error);
    res.status(500).json({ message: 'Erro ao buscar incidentes recentes' });
  }
}
