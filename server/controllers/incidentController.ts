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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const incidentData = req.body as Partial<Incident>; // Tipar como Partial<Incident>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const authenticatedUser = (req as any).user; // Obter o usuário do middleware

    // 1. Validação básica de campos obrigatórios
    const requiredFields: (keyof Incident)[] = ['title', 'description', 'location', 'date', 'department', 'suggestionToFix'];
    const missingFields = requiredFields.filter(field => !incidentData[field]);

    if (missingFields.length > 0) {
      logger.warn(`Tentativa de criar incidente com campos em falta: ${missingFields.join(', ')}`, { data: incidentData });
      return res.status(400).json({ 
        error: 'Campos obrigatórios em falta',
        details: `Os seguintes campos são necessários: ${missingFields.join(', ')}`
      });
    }

    // 2. Validação da data
    let incidentDate: Date;
    try {
      incidentDate = new Date(incidentData.date!); // Usar a data do frontend
      if (isNaN(incidentDate.getTime())) {
        throw new Error('Data inválida');
      }
    } catch (dateError) {
      logger.warn('Data inválida recebida ao criar incidente:', { date: incidentData.date });
      return res.status(400).json({ error: 'Formato de data inválido' });
    }
    
    // 3. Obter reportedBy do usuário autenticado
    const reportedBy = authenticatedUser?.email; 
    if (!reportedBy) {
        logger.error('Não foi possível obter o email do usuário autenticado para reportedBy');
        return res.status(401).json({ error: 'Usuário não autenticado ou sem email' });
    }


    // --- Verificação e Criação de Departamento (mantém-se a lógica) --- 
    if (incidentData.department && typeof incidentData.department === 'string') {
      const departmentName = incidentData.department.trim();
      if (departmentName) {
        const departmentsCollection = await getCollection<Department>('departments');
        const existingDepartment = await departmentsCollection.findOne({ 
          $or: [ 
            { label: departmentName }, 
            { value: departmentName.toLowerCase().replace(/\\s+/g, '_') } 
          ]
        });

        if (!existingDepartment) {
          logger.info(`Departamento \"${departmentName}\" não encontrado. Criando novo departamento.`);
          const newDepartment: Omit<Department, '_id'> = {
            label: departmentName,
            value: departmentName.toLowerCase().replace(/\\s+/g, '_'), 
            employeeCount: 0 
          };
          try {
            await departmentsCollection.insertOne(newDepartment as Department);
            logger.info(`Departamento \"${departmentName}\" criado com sucesso.`);
          } catch (deptError) {
            logger.error(`Falha ao criar automaticamente o departamento \"${departmentName}\":`, deptError);
            // Continuar mesmo se a criação do departamento falhar
          }
        }
      }
    }
    // --- Fim da Verificação --- 

    const incidentsCollection = await getCollection<Incident>('incidents');
    
    // Construir o novo incidente com dados validados e corrigidos
    const newIncident: Omit<Incident, '_id'> = {
      // Campos obrigatórios validados
      title: incidentData.title!,
      description: incidentData.description!,
      location: incidentData.location!,
      date: incidentDate, // Usar a data validada
      department: incidentData.department!,
      suggestionToFix: incidentData.suggestionToFix!,
      // Campos opcionais do body (se existirem)
      factoryArea: incidentData.factoryArea,
      images: incidentData.images || [], // Default para array vazio
      // Campos definidos pelo sistema/backend
      id: crypto.randomUUID(), // Gerar UUID
      status: 'Reportado', // Definir status inicial
      reportedBy: reportedBy, // Usar email do usuário autenticado
      reporterName: incidentData.reporterName, // Manter o nome do reporter do frontend
      // Campos relacionados com admin/QA (a serem preenchidos depois)
      severity: "Não Definido", // Default inicial
      frequency: undefined, // Default inicial
      implementedAction: undefined,
      responsible: undefined,
      adminNotes: undefined,
      resolutionDeadline: undefined,
      completionDate: undefined,
      pointsAwarded: 0,
      gravityValue: undefined,
      frequencyValue: undefined,
      risk: undefined,
      qaQuality: undefined,
      resolutionDays: undefined
    };
    
    const result = await incidentsCollection.insertOne(newIncident as Incident);
    const createdIncident = await incidentsCollection.findOne({ _id: result.insertedId });
    
    logger.info(`Novo incidente criado com _id: ${result.insertedId} por ${reportedBy}`);
    res.status(201).json(createdIncident);

  } catch (error) {
    logger.error('Erro detalhado ao criar incidente:', error); // Log mais detalhado
    res.status(500).json({ 
        error: 'Erro interno ao criar incidente',
        details: error instanceof Error ? error.message : 'Erro desconhecido' 
    });
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