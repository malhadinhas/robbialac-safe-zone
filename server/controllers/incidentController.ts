import { Request, Response } from 'express';
import { getCollection } from '../services/database';
import { Incident, Department } from '../types';
import logger from '../utils/logger';
import { ObjectId } from 'mongodb';

export async function getIncidents(req: Request, res: Response) {
  try {
    const collection = await getCollection<Incident>('incidents');
    const statusFilter = req.query.status as string; // 'not_archived', 'archived', ou undefined

    let query = {}; // Query vazia por padrão (busca tudo se nenhum status for passado)

    if (statusFilter === 'not_archived') {
      // Buscar todos exceto os arquivados
      query = { status: { $ne: 'Arquivado' } }; 
      logger.info('Buscando incidentes não arquivados...');
    } else if (statusFilter === 'archived') {
      // Buscar apenas os arquivados
      query = { status: 'Arquivado' };
      logger.info('Buscando incidentes arquivados...');
    } else {
      logger.info('Buscando todos os incidentes (sem filtro de status)...');
    }
    
    // Aplicar a query e ordenar por data descendente
    const incidents = await collection.find(query).sort({ date: -1 }).toArray();
    
    // Formatar datas antes de enviar (importante!)
    const formattedIncidents = incidents.map(incident => ({
      ...incident,
      date: incident.date, // As datas já devem estar como Date
      completionDate: incident.completionDate,
      resolutionDeadline: incident.resolutionDeadline
      // Se precisar converter para string ISO aqui por algum motivo, faça:
      // date: incident.date instanceof Date ? incident.date.toISOString() : incident.date,
      // ...etc
    }));

    logger.info(`Encontrados ${incidents.length} incidentes com filtro '${statusFilter || 'nenhum'}'`);
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
    const { incidentId } = req.params;
    if (!ObjectId.isValid(incidentId)) {
      return res.status(400).json({ error: 'ID de incidente inválido' });
    }
    const collection = await getCollection<Incident>('incidents');
    const incident = await collection.findOne({ _id: new ObjectId(incidentId) });
    
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

    // --- Verificação e Criação de Departamento --- 
    if (incidentData.department && typeof incidentData.department === 'string') {
      const departmentName = incidentData.department.trim();
      if (departmentName) {
        const departmentsCollection = await getCollection<Department>('departments');
        const existingDepartment = await departmentsCollection.findOne({ 
          $or: [ // Verifica por label ou value para mais robustez
            { label: departmentName }, 
            { value: departmentName.toLowerCase().replace(/\s+/g, '_') } // Exemplo de criação de value
          ]
        });

        if (!existingDepartment) {
          logger.info(`Departamento "${departmentName}" não encontrado. Criando novo departamento.`);
          const newDepartment: Omit<Department, '_id'> = {
            //_id: new ObjectId(), // O MongoDB gera automaticamente se omitido
            label: departmentName,
            value: departmentName.toLowerCase().replace(/\s+/g, '_'), // Cria um 'value' simples
            employeeCount: 0 // Assumir 0 funcionários inicialmente
            // Adicione outros campos padrão se necessário
          };
          try {
            await departmentsCollection.insertOne(newDepartment as Department);
            logger.info(`Departamento "${departmentName}" criado com sucesso.`);
          } catch (deptError) {
            logger.error(`Falha ao criar automaticamente o departamento "${departmentName}":`, deptError);
            // Decide se quer falhar a criação do incidente ou apenas loggar o erro do departamento
            // Aqui, vamos apenas loggar e continuar com a criação do incidente
          }
        }
      }
    }
    // --- Fim da Verificação --- 

    const incidentsCollection = await getCollection<Incident>('incidents');
    
    const newIncident: Omit<Incident, '_id'> = {
      ...incidentData,
      // _id: new ObjectId(), // Deixar o MongoDB gerar
      id: crypto.randomUUID(),
      date: new Date(),
      status: 'Reportado',
      reportedBy: req.body.reportedBy // Idealmente, isto viria do user autenticado
    };
    
    const result = await incidentsCollection.insertOne(newIncident as Incident);
    // Buscar o documento inserido para retornar com o _id gerado
    const createdIncident = await incidentsCollection.findOne({ _id: result.insertedId });
    
    res.status(201).json(createdIncident);
  } catch (error) {
    console.error('Erro ao criar incidente:', error);
    res.status(500).json({ error: 'Erro ao criar incidente' });
  }
}

export async function updateIncident(req: Request, res: Response) {
  try {
    const { incidentId } = req.params; 
    // updateData agora contém apenas os campos a serem atualizados (ex: { status: 'Arquivado' })
    const updateData = req.body; 

    if (!ObjectId.isValid(incidentId)) {
      logger.warn('ID inválido para atualização', { incidentId });
      return res.status(400).json({ error: 'ID de incidente inválido' });
    }

    // Validar o status se ele estiver sendo atualizado
    if (updateData.status && !['Reportado', 'Em Análise', 'Resolvido', 'Arquivado'].includes(updateData.status)) {
      logger.warn(`Status inválido na atualização do incidente ${incidentId}: ${updateData.status}`);
      return res.status(400).json({ 
        error: 'Status inválido',
        details: 'O status deve ser um dos seguintes: Reportado, Em Análise, Resolvido, Arquivado'
      });
    }
    
    // Se outras validações forem necessárias para campos específicos, adicione aqui.
    // Ex: Se estiver a atualizar a data, validar se é uma data válida.

    // --- REMOVER Validação de campos obrigatórios globais --- 
    /*
    const requiredFields = ['title', 'description', 'status', 'location', 'date', 'department'];
    const missingFields = requiredFields.filter(field => !updateData[field]);
    if (missingFields.length > 0) {
       ...
    }
    */
    // --- FIM da REMOÇÃO ---

    const collection = await getCollection<Incident>('incidents');

    // --- USAR updateOne com $set --- 
    // Preparar o objeto $set com os campos recebidos
    const fieldsToUpdate: any = {};
    for (const key in updateData) {
      if (Object.prototype.hasOwnProperty.call(updateData, key)) {
        // Converter datas se necessário (exemplo)
        if ((key === 'date' || key === 'completionDate' || key === 'resolutionDeadline') && updateData[key]) {
          fieldsToUpdate[key] = new Date(updateData[key]);
        } else {
          fieldsToUpdate[key] = updateData[key];
        }
      }
    }

    // Verificar se há campos para atualizar
    if (Object.keys(fieldsToUpdate).length === 0) {
       logger.info(`Nenhum campo para atualizar para o incidente ${incidentId}`);
       return res.status(400).json({ error: 'Nenhum campo fornecido para atualização' });
    }

    // Atualiza apenas os campos fornecidos usando $set
    const result = await collection.updateOne(
      { _id: new ObjectId(incidentId) }, 
      { $set: fieldsToUpdate }
    );
    // --- FIM da MUDANÇA para updateOne --- 

    if (result.matchedCount === 0) {
      logger.warn(`Tentativa de atualizar incidente inexistente: ${incidentId}`);
      return res.status(404).json({ error: 'Incidente não encontrado' });
    }
    
    if (result.modifiedCount === 0 && result.matchedCount === 1) {
       logger.info(`Incidente ${incidentId} não modificado (valores iguais aos existentes)`);
       // Pode retornar 200 OK ou 304 Not Modified
       return res.status(200).json({ message: 'Incidente não modificado (valores iguais aos existentes)' });
    }

    logger.info(`Incidente ${incidentId} atualizado com sucesso`);
    // Buscar e retornar o incidente atualizado
    const updatedIncident = await collection.findOne({ _id: new ObjectId(incidentId) });
    res.status(200).json(updatedIncident);

  } catch (error) {
    logger.error(`Erro ao atualizar incidente: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    res.status(500).json({ 
      error: 'Erro ao atualizar incidente',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}

export async function deleteIncident(req: Request, res: Response) {
  try {
    const { incidentId } = req.params;
    if (!ObjectId.isValid(incidentId)) {
      return res.status(400).json({ error: 'ID de incidente inválido' });
    }
    const collection = await getCollection<Incident>('incidents');
    
    // Usar _id para apagar
    const result = await collection.deleteOne({ _id: new ObjectId(incidentId) }); 
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Incidente não encontrado' });
    }
    
    res.json({ message: 'Incidente excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir incidente:', error);
    res.status(500).json({ error: 'Erro ao excluir incidente' });
  }
}

// Buscar incidentes por departamento, com filtro opcional por ano
export async function getIncidentsByDepartment(req: Request, res: Response) {
  // Log removido na etapa anterior
  
  try {
    const collection = await getCollection<Incident>('incidents');
    const year = req.query.year ? parseInt(req.query.year as string, 10) : new Date().getFullYear();

    logger.info(`Buscando incidentes por departamento para o ano: ${year}`);

    if (isNaN(year)) {
      return res.status(400).json({ message: 'Ano inválido fornecido.' });
    }

    const startDate = new Date(year, 0, 1); // Primeiro dia do ano
    const endDate = new Date(year + 1, 0, 1); // Primeiro dia do ano seguinte

    // Modificar pipeline para filtrar por data
    const aggregationPipeline: any[] = [
      {
        $match: {
          date: {
            $gte: startDate,
            $lt: endDate
          }
        }
      },
      {
        $group: {
          _id: "$department",
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          department: "$_id",
          count: 1
        }
      }
    ];

    const incidents = await collection.aggregate(aggregationPipeline).toArray();
    
    logger.info(`Incidentes por departamento recuperados com sucesso para ${year}`, { count: incidents.length });
    res.json(incidents);
  } catch (error) {
    console.error('Erro ao buscar incidentes por departamento', { error });
    res.status(500).json({ message: 'Erro ao buscar incidentes por departamento' });
  }
}