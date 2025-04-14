import { Request, Response } from 'express';
import { getCollection } from '../services/database';
import { Incident } from '../types';
import logger from '../utils/logger';

export async function getIncidents(req: Request, res: Response) {
  try {
    console.log('Tentando obter a coleção de incidentes...');
    const collection = await getCollection<Incident>('incidents');
    
    console.log('Buscando incidentes...');
    const incidents = await collection.find({}).toArray();
    console.log(`Encontrados ${incidents.length} incidentes`);
    
    const formattedIncidents = incidents.map(incident => ({
      ...incident,
      date: new Date(incident.date),
      completionDate: incident.completionDate ? new Date(incident.completionDate) : undefined,
      resolutionDeadline: incident.resolutionDeadline ? new Date(incident.resolutionDeadline) : undefined
    }));
    
    res.json(formattedIncidents);
  } catch (error) {
    console.error('Erro detalhado ao buscar incidentes:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar incidentes',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}

export async function getIncidentById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const collection = await getCollection<Incident>('incidents');
    const incident = await collection.findOne({ id });
    
    if (!incident) {
      return res.status(404).json({ error: 'Incidente não encontrado' });
    }
    
    res.json({
      ...incident,
      date: new Date(incident.date),
      completionDate: incident.completionDate ? new Date(incident.completionDate) : undefined,
      resolutionDeadline: incident.resolutionDeadline ? new Date(incident.resolutionDeadline) : undefined
    });
  } catch (error) {
    console.error('Erro ao buscar incidente:', error);
    res.status(500).json({ error: 'Erro ao buscar incidente' });
  }
}

export async function createIncident(req: Request, res: Response) {
  try {
    const incidentData = req.body;
    const collection = await getCollection<Incident>('incidents');
    
    const newIncident: Incident = {
      ...incidentData,
      id: crypto.randomUUID(),
      date: new Date(),
      status: 'Reportado',
      reportedBy: req.body.reportedBy
    };
    
    await collection.insertOne(newIncident);
    res.status(201).json(newIncident);
  } catch (error) {
    console.error('Erro ao criar incidente:', error);
    res.status(500).json({ error: 'Erro ao criar incidente' });
  }
}

export async function updateIncident(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const collection = await getCollection<Incident>('incidents');

    // Primeiro, verifica se o incidente existe
    const existingIncident = await collection.findOne({ id });
    if (!existingIncident) {
      logger.warn(`Tentativa de atualizar incidente inexistente: ${id}`);
      return res.status(404).json({ error: 'Incidente não encontrado' });
    }

    // Validações de campos obrigatórios
    const requiredFields = ['title', 'description', 'status', 'location', 'date', 'department'];
    const missingFields = requiredFields.filter(field => !updateData[field]);
    
    if (missingFields.length > 0) {
      logger.warn(`Campos obrigatórios ausentes na atualização do incidente ${id}: ${missingFields.join(', ')}`);
      return res.status(400).json({ 
        error: 'Campos obrigatórios ausentes', 
        details: `Os seguintes campos são obrigatórios: ${missingFields.join(', ')}` 
      });
    }

    // Valida o status
    if (!['Reportado', 'Em Análise', 'Resolvido', 'Arquivado'].includes(updateData.status)) {
      logger.warn(`Status inválido na atualização do incidente ${id}: ${updateData.status}`);
      return res.status(400).json({ 
        error: 'Status inválido',
        details: 'O status deve ser um dos seguintes: Reportado, Em Análise, Resolvido, Arquivado'
      });
    }

    // Mantém o _id original e remove do objeto de atualização
    const { _id } = existingIncident;
    const { _id: updateId, ...updateDataWithoutId } = updateData;

    // Prepara os dados para atualização
    const updatedIncident = {
      ...updateDataWithoutId,
      _id, // Mantém o _id original
      id: existingIncident.id, // Garante que o ID não seja alterado
      // Converte as datas corretamente
      date: updateData.date ? new Date(updateData.date) : existingIncident.date,
      completionDate: updateData.completionDate ? new Date(updateData.completionDate) : existingIncident.completionDate,
      resolutionDeadline: updateData.resolutionDeadline ? new Date(updateData.resolutionDeadline) : existingIncident.resolutionDeadline
    };

    // Atualiza o documento usando replaceOne
    const result = await collection.replaceOne(
      { _id }, // Usa o _id para buscar o documento
      updatedIncident
    );
    
    if (result.modifiedCount === 0) {
      logger.error(`Falha ao atualizar incidente ${id} no banco de dados`);
      return res.status(500).json({ error: 'Erro ao atualizar incidente no banco de dados' });
    }
    
    logger.info(`Incidente ${id} atualizado com sucesso`);
    res.json({ 
      message: 'Incidente atualizado com sucesso',
      incident: updatedIncident
    });
  } catch (error) {
    logger.error(`Erro ao atualizar incidente: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    
    // Verifica se é um erro de payload muito grande
    if (error instanceof Error && error.message.includes('request entity too large')) {
      return res.status(413).json({ 
        error: 'Arquivo muito grande',
        details: 'O tamanho total dos arquivos enviados excede o limite permitido de 10MB. Por favor, reduza o tamanho dos arquivos.'
      });
    }
    
    res.status(500).json({ 
      error: 'Erro ao atualizar incidente',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}

export async function deleteIncident(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const collection = await getCollection<Incident>('incidents');
    
    const result = await collection.deleteOne({ id });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Incidente não encontrado' });
    }
    
    res.json({ message: 'Incidente excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir incidente:', error);
    res.status(500).json({ error: 'Erro ao excluir incidente' });
  }
} 