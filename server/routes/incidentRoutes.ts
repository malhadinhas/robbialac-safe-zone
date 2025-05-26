import express from 'express';
import { ObjectId } from 'mongodb';
import { getDb } from '../services/mongoService';

const router = express.Router();

// Interface para o tipo Incident
interface Incident {
  id?: string;
  title: string;
  description: string;
  location: string;
  date: Date;
  severity: "Baixo" | "Médio" | "Alto";
  status: "Reportado" | "Em Análise" | "Resolvido" | "Arquivado";
  reportedBy: string;
  department: string;
  implementedAction?: string;
  responsible?: string;
  adminNotes?: string;
  pointsAwarded: number;
  completionDate?: Date;
  resolutionDeadline?: Date;
  gravityValue?: number;
  frequency?: "Baixa" | "Moderada" | "Alta";
  frequencyValue?: number;
  risk?: number;
  qaQuality?: "Baixa" | "Média" | "Alta";
  resolutionDays?: number;
  reporterName?: string;
  factoryArea?: string;
  suggestionToFix?: string;
  images?: string[];
}

// GET /api/incidents - Listar todos os incidentes
router.get('/', async (req, res) => {
  try {
    const db = getDb();
    const incidents = await db.collection('incidents').find({}).toArray();
    res.json(incidents.map(incident => ({
      ...incident,
      id: incident._id.toString()
    })));
  } catch (error) {
    console.error('Erro ao buscar incidentes:', error);
    res.status(500).json({ error: 'Erro ao buscar incidentes' });
  }
});

// GET /api/incidents/:id - Buscar um incidente específico
router.get('/:id', async (req, res) => {
  try {
    const db = getDb();
    const incident = await db.collection('incidents').findOne({
      _id: new ObjectId(req.params.id)
    });

    if (!incident) {
      return res.status(404).json({ error: 'Incidente não encontrado' });
    }

    res.json({
      ...incident,
      id: incident._id.toString()
    });
  } catch (error) {
    console.error('Erro ao buscar incidente:', error);
    res.status(500).json({ error: 'Erro ao buscar incidente' });
  }
});

// POST /api/incidents - Criar um novo incidente
router.post('/', async (req, res) => {
  try {
    const db = getDb();
    const incident: Incident = req.body;
    
    // Converter datas de string para Date
    if (typeof incident.date === 'string') {
      incident.date = new Date(incident.date);
    }
    if (incident.resolutionDeadline && typeof incident.resolutionDeadline === 'string') {
      incident.resolutionDeadline = new Date(incident.resolutionDeadline);
    }
    if (incident.completionDate && typeof incident.completionDate === 'string') {
      incident.completionDate = new Date(incident.completionDate);
    }

    const result = await db.collection('incidents').insertOne(incident);
    res.status(201).json({
      ...incident,
      id: result.insertedId.toString()
    });
  } catch (error) {
    console.error('Erro ao criar incidente:', error);
    res.status(500).json({ error: 'Erro ao criar incidente' });
  }
});

// PUT /api/incidents/:id - Atualizar um incidente
router.put('/:id', async (req, res) => {
  try {
    const db = getDb();
    const incident: Incident = req.body;
    
    // Converter datas de string para Date
    if (typeof incident.date === 'string') {
      incident.date = new Date(incident.date);
    }
    if (incident.resolutionDeadline && typeof incident.resolutionDeadline === 'string') {
      incident.resolutionDeadline = new Date(incident.resolutionDeadline);
    }
    if (incident.completionDate && typeof incident.completionDate === 'string') {
      incident.completionDate = new Date(incident.completionDate);
    }

    const { id, ...updateData } = incident;
    
    const result = await db.collection('incidents').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Incidente não encontrado' });
    }

    res.json({ message: 'Incidente atualizado com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar incidente:', error);
    res.status(500).json({ error: 'Erro ao atualizar incidente' });
  }
});

// DELETE /api/incidents/:id - Excluir um incidente
router.delete('/:id', async (req, res) => {
  try {
    const db = getDb();
    const result = await db.collection('incidents').deleteOne({
      _id: new ObjectId(req.params.id)
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Incidente não encontrado' });
    }

    res.json({ message: 'Incidente excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir incidente:', error);
    res.status(500).json({ error: 'Erro ao excluir incidente' });
  }
});

export const incidentRoutes = router; 