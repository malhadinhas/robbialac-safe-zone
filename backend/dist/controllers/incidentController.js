"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIncidents = getIncidents;
exports.getIncidentById = getIncidentById;
exports.createIncident = createIncident;
exports.updateIncident = updateIncident;
exports.deleteIncident = deleteIncident;
exports.getIncidentsByDepartment = getIncidentsByDepartment;
exports.getRecentIncidents = getRecentIncidents;
const database_1 = require("../services/database"); // Função para obter coleções MongoDB
const logger_1 = __importDefault(require("../utils/logger")); // Utilitário de logging
const mongodb_1 = require("mongodb"); // Tipo ObjectId do MongoDB
const crypto_1 = __importDefault(require("crypto")); // Módulo crypto do Node.js para gerar UUID
const Like_1 = __importDefault(require("../models/Like"));
const Comment_1 = __importDefault(require("../models/Comment"));
/**
 * @function getIncidents
 * @description Controladora para buscar uma lista de incidentes.
 * Permite filtrar por status ('archived', 'not_archived') através de query param.
 * Ordena os resultados pela data mais recente.
 * @param {Request} req - Objeto da requisição Express (pode conter `req.query.status`).
 * @param {Response} res - Objeto da resposta Express.
 * @returns {Promise<void>} Responde com um array JSON de incidentes ou um erro (500).
 */
async function getIncidents(req, res) {
    try {
        // Obtém a coleção 'incidents' do banco de dados.
        const collection = await (0, database_1.getCollection)('incidents');
        // Obtém o filtro de status da query string (ex: ?status=archived).
        const statusFilter = req.query.status;
        // Objeto para construir a query de filtro do MongoDB.
        let query = {};
        // Define a query baseada no filtro de status fornecido.
        if (statusFilter === 'not_archived') {
            query = { status: { $ne: 'Arquivado' } };
            logger_1.default.info('Buscando incidentes não arquivados...');
        }
        else if (statusFilter === 'archived') {
            query = { status: 'Arquivado' };
            logger_1.default.info('Buscando incidentes arquivados...');
        }
        else {
            logger_1.default.info('Buscando todos os incidentes (sem filtro de status)...');
        }
        // Executa a busca na coleção:
        const incidents = await collection.find(query).sort({ date: -1 }).toArray();
        const incidentIds = incidents.map(inc => inc._id);
        // Buscar contadores de likes e comentários para todos os incidentes
        const likeCounts = await Like_1.default.aggregate([
            { $match: { itemId: { $in: incidentIds }, itemType: 'qa' } },
            { $group: { _id: '$itemId', count: { $sum: 1 } } }
        ]);
        const commentCounts = await Comment_1.default.aggregate([
            { $match: { itemId: { $in: incidentIds }, itemType: 'qa' } },
            { $group: { _id: '$itemId', count: { $sum: 1 } } }
        ]);
        const likesMap = new Map(likeCounts.map(item => [item._id.toString(), item.count]));
        const commentsMap = new Map(commentCounts.map(item => [item._id.toString(), item.count]));
        // Formata as datas e inclui os contadores
        const formattedIncidents = incidents.map(incident => ({
            ...incident,
            date: incident.date,
            completionDate: incident.completionDate,
            resolutionDeadline: incident.resolutionDeadline,
            likeCount: likesMap.get(incident._id.toString()) || 0,
            commentCount: commentsMap.get(incident._id.toString()) || 0
        }));
        logger_1.default.info(`Encontrados ${incidents.length} incidentes com filtro '${statusFilter || 'nenhum'}'`);
        res.json(formattedIncidents);
    }
    catch (error) {
        logger_1.default.error('Erro detalhado ao buscar incidentes:', error);
        res.status(500).json({
            error: 'Erro ao buscar incidentes',
            details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
}
/**
 * @function getIncidentById
 * @description Controladora para buscar um único incidente pelo seu _id (ObjectId).
 * @param {Request} req - Objeto da requisição Express (espera `req.params.incidentId`).
 * @param {Response} res - Objeto da resposta Express.
 * @returns {Promise<void>} Responde com o documento do incidente encontrado ou um erro (400, 404, 500).
 */
async function getIncidentById(req, res) {
    try {
        const { incidentId } = req.params;
        const collection = await (0, database_1.getCollection)('incidents');
        let incident = null;
        if (mongodb_1.ObjectId.isValid(incidentId)) {
            // Buscar por _id (ObjectId)
            incident = await collection.findOne({ _id: new mongodb_1.ObjectId(incidentId) });
        }
        else {
            // Buscar por id (UUID string)
            incident = await collection.findOne({ id: incidentId });
        }
        if (!incident) {
            logger_1.default.warn('Incidente não encontrado pelo ID.', { incidentId });
            res.status(404).json({ error: 'Incidente não encontrado' });
            return;
        }
        logger_1.default.info('Incidente recuperado com sucesso pelo ID.', { incidentId });
        res.json({
            ...incident,
            date: new Date(incident.date),
            completionDate: incident.completionDate ? new Date(incident.completionDate) : undefined,
            resolutionDeadline: incident.resolutionDeadline ? new Date(incident.resolutionDeadline) : undefined
        });
    }
    catch (error) {
        logger_1.default.error('Erro ao buscar incidente por ID:', { incidentId: req.params.incidentId, error });
        res.status(500).json({ error: 'Erro ao buscar incidente' });
    }
}
/**
 * @function createIncident
 * @description Controladora para criar um novo registro de incidente.
 * Recebe os dados do incidente via `req.body`.
 * Valida campos obrigatórios e a data.
 * Obtém o email do usuário autenticado (`req.user`) para o campo `reportedBy`.
 * Verifica se o departamento fornecido existe na coleção 'departments'; se não existir, cria-o automaticamente.
 * Gera um UUID para o campo `id`.
 * Define valores padrão para campos como `status` e `severity`.
 * Insere o novo incidente na coleção 'incidents'.
 * @param {Request & { user?: { email: string } }} req - Objeto da requisição Express, estendido para potencialmente incluir `req.user`.
 * @param {Response} res - Objeto da resposta Express.
 * @returns {Promise<void>} Responde com o incidente criado (status 201) ou um erro (400, 401, 500).
 */
async function createIncident(req, res) {
    try {
        // Tipa o corpo da requisição como um objeto parcial de Incidente.
        const incidentData = req.body;
        // Obtém o objeto 'user' que foi adicionado à requisição pelo middleware de autenticação.
        // Usa `any` como type assertion, mas o ideal seria ter um tipo Request estendido.
        const authenticatedUser = req.user;
        // 1. Validação de campos obrigatórios:
        // Lista dos campos que devem estar presentes no corpo da requisição.
        const requiredFields = ['title', 'description', 'location', 'date', 'department', 'suggestionToFix'];
        // Filtra a lista para encontrar quais campos estão faltando em incidentData.
        const missingFields = requiredFields.filter(field => !incidentData[field]);
        // Se houver campos faltando, retorna erro 400 Bad Request.
        if (missingFields.length > 0) {
            logger_1.default.warn(`Tentativa de criar incidente com campos em falta: ${missingFields.join(', ')}`, { data: incidentData });
            res.status(400).json({
                error: 'Campos obrigatórios em falta',
                details: `Os seguintes campos são necessários: ${missingFields.join(', ')}`
            });
            return; // Para a execução.
        }
        // 2. Validação e conversão da data:
        let incidentDate;
        try {
            // Tenta criar um objeto Date a partir do valor fornecido.
            // Usa o operador '!' (non-null assertion) assumindo que 'date' existe devido à validação anterior.
            incidentDate = new Date(incidentData.date);
            // Verifica se a data resultante é válida (não NaN).
            if (isNaN(incidentDate.getTime())) {
                throw new Error('Data inválida'); // Lança erro se a data for inválida.
            }
        }
        catch (dateError) {
            logger_1.default.warn('Data inválida recebida ao criar incidente:', { date: incidentData.date });
            res.status(400).json({ error: 'Formato de data inválido' });
            return;
        }
        // 3. Obter o identificador do usuário (reportado por):
        // Assume que o middleware de autenticação adiciona o email do usuário a `req.user.email`.
        const reportedBy = authenticatedUser?.email;
        // Se não for possível obter o email, retorna erro 401 Unauthorized.
        if (!reportedBy) {
            logger_1.default.error('Não foi possível obter o email do usuário autenticado para reportedBy em createIncident.');
            res.status(401).json({ error: 'Usuário não autenticado ou sem email' });
            return;
        }
        // 4. Verificação e Criação Automática de Departamento:
        // Verifica se foi fornecido um nome de departamento e se é uma string não vazia.
        if (incidentData.department && typeof incidentData.department === 'string') {
            const departmentName = incidentData.department.trim();
            if (departmentName) {
                // Obtém a coleção 'departments'.
                const departmentsCollection = await (0, database_1.getCollection)('departments');
                // Procura por um departamento existente com base no nome (label) ou no valor (slug).
                // Isso tenta evitar duplicatas caso o frontend envie o label ou o value.
                const existingDepartment = await departmentsCollection.findOne({
                    $or: [
                        { label: departmentName }, // Busca pelo nome exato
                        { value: departmentName.toLowerCase().replace(/\s+/g, '_') } // Busca pelo nome formatado como 'value'
                    ]
                });
                // Se o departamento não existe...
                if (!existingDepartment) {
                    logger_1.default.info(`Departamento "${departmentName}" não encontrado. Tentando criar novo departamento.`);
                    // Prepara os dados para o novo departamento.
                    const newDepartment = {
                        label: departmentName, // Nome como recebido.
                        // Gera um 'value' (slug) a partir do nome (lowercase, espaços por _).
                        value: departmentName.toLowerCase().replace(/\s+/g, '_'),
                        employeeCount: 0, // Contagem inicial de funcionários.
                        // 'id' (string) e 'color' precisariam ser definidos aqui se forem obrigatórios no DB.
                        id: departmentName.toLowerCase().replace(/\s+/g, '_'), // Exemplo: usar value como id
                        color: '#CCCCCC' // Exemplo: cor padrão
                    };
                    try {
                        // Tenta inserir o novo departamento na coleção.
                        // Usa 'as Department' para satisfazer o tipo esperado pela coleção, mesmo faltando _id.
                        await departmentsCollection.insertOne(newDepartment);
                        logger_1.default.info(`Departamento "${departmentName}" criado automaticamente com sucesso.`);
                    }
                    catch (deptError) {
                        // Loga o erro se a criação automática falhar, mas continua o processo de criação do incidente.
                        logger_1.default.error(`Falha ao criar automaticamente o departamento "${departmentName}" durante criação de incidente:`, deptError);
                    }
                }
            }
        }
        // --- Fim da Verificação de Departamento ---
        // Obtém a coleção 'incidents'.
        const incidentsCollection = await (0, database_1.getCollection)('incidents');
        // Constrói o objeto final do novo incidente, combinando dados validados e valores padrão.
        const newIncident = {
            // Campos obrigatórios (validados acima, usa '!' pois sabemos que existem).
            title: incidentData.title,
            description: incidentData.description,
            location: incidentData.location,
            date: incidentDate, // Usa o objeto Date validado.
            department: incidentData.department,
            suggestionToFix: incidentData.suggestionToFix,
            // Campos opcionais (usa valor do body ou um padrão).
            factoryArea: incidentData.factoryArea, // Pode ser undefined se não fornecido.
            images: incidentData.images || [], // Usa array vazio como padrão se não fornecido.
            // Campos definidos pelo sistema/backend.
            id: crypto_1.default.randomUUID(), // Gera um UUID v4 para o campo 'id' (string).
            status: 'Reportado', // Define o status inicial padrão.
            reportedBy: reportedBy, // Email do usuário autenticado.
            reporterName: incidentData.reporterName, // Nome do repórter (pode ser diferente do usuário logado).
            // Campos relacionados à análise/resolução (definidos com valores iniciais/padrão).
            // LINTER ERROR: "Não Definido" não é um valor válido para 'severity'.
            //                Corrigir para um valor do Enum, ex: "Baixo", ou ajustar o tipo/enum.
            severity: "Não Definido", // Usar um valor válido como "Baixo" ou "Médio"?
            frequency: undefined,
            implementedAction: undefined,
            responsible: undefined,
            adminNotes: undefined,
            resolutionDeadline: undefined,
            completionDate: undefined,
            pointsAwarded: 0, // Pontos iniciais por reportar (pode ser ajustado depois).
            // Valores calculados (a serem definidos posteriormente).
            gravityValue: undefined,
            frequencyValue: undefined,
            risk: undefined,
            qaQuality: undefined,
            resolutionDays: undefined
        };
        // Insere o documento do novo incidente na coleção.
        // Usa 'as Incident' para adequar ao tipo esperado pela coleção.
        const result = await incidentsCollection.insertOne(newIncident);
        // Busca o incidente recém-criado pelo seu _id para retornar o documento completo.
        const createdIncident = await incidentsCollection.findOne({ _id: result.insertedId });
        logger_1.default.info(`Novo incidente criado com sucesso. _id: ${result.insertedId}`, { reportedBy });
        // Responde com status 201 Created e o documento do incidente criado.
        res.status(201).json(createdIncident);
    }
    catch (error) {
        // Captura e loga erros gerais.
        logger_1.default.error('Erro detalhado ao criar incidente:', error);
        // Responde com erro 500.
        res.status(500).json({
            error: 'Erro interno ao criar incidente',
            details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
}
/**
 * @function updateIncident
 * @description Controladora para atualizar um incidente existente pelo seu _id (ObjectId).
 * Recebe os campos a serem atualizados no `req.body`.
 * Atualiza apenas os campos fornecidos usando o operador `$set`.
 * @param {Request} req - Objeto da requisição Express (espera `req.params.incidentId` e `req.body` com os dados a atualizar).
 * @param {Response} res - Objeto da resposta Express.
 * @returns {Promise<void>} Responde com o incidente atualizado ou um erro (400, 404, 500).
 */
async function updateIncident(req, res) {
    try {
        const { incidentId } = req.params; // ID do incidente a atualizar.
        // `updateData` contém apenas os campos que o cliente enviou para serem atualizados.
        const updateData = req.body;
        logger_1.default.info(`Requisição para atualizar incidente ${incidentId}`, { changes: updateData });
        // Validação 1: Verifica se o ID é válido.
        if (!mongodb_1.ObjectId.isValid(incidentId)) {
            logger_1.default.warn('ID inválido fornecido para atualização de incidente.', { incidentId });
            res.status(400).json({ error: 'ID de incidente inválido' });
            return; // Para a execução.
        }
        // Validação 2: Exemplo de validação específica de campo (status).
        // Se o campo 'status' estiver presente nos dados de atualização...
        if (updateData.status) {
            // Define os valores permitidos para o status.
            const allowedStatus = ['Reportado', 'Em Análise', 'Resolvido', 'Arquivado'];
            // Se o status fornecido não estiver na lista de permitidos...
            if (!allowedStatus.includes(updateData.status)) {
                logger_1.default.warn(`Status inválido recebido na atualização do incidente ${incidentId}: ${updateData.status}`);
                // Retorna erro 400 Bad Request.
                res.status(400).json({
                    error: 'Status inválido',
                    details: `O status deve ser um dos seguintes: ${allowedStatus.join(', ')}`
                });
                return; // Para a execução.
            }
        }
        // Adicionar mais validações específicas para outros campos se necessário (datas, números, etc.).
        // --- Lógica de Atualização ---
        // Obtém a coleção 'incidents'.
        const collection = await (0, database_1.getCollection)('incidents');
        // Prepara o objeto `$set` para a operação `updateOne`.
        // Inclui apenas os campos que foram enviados no `req.body`.
        const fieldsToUpdate = {};
        for (const key in updateData) {
            // Verifica se a propriedade pertence ao objeto (e não ao protótipo).
            if (Object.prototype.hasOwnProperty.call(updateData, key)) {
                // Exemplo de tratamento especial para campos de data: converte para objeto Date.
                if ((key === 'date' || key === 'completionDate' || key === 'resolutionDeadline') && updateData[key]) {
                    try {
                        fieldsToUpdate[key] = new Date(updateData[key]);
                        if (isNaN(fieldsToUpdate[key].getTime()))
                            throw new Error('Data inválida');
                    }
                    catch (dateError) {
                        logger_1.default.warn(`Data inválida no campo ${key} durante atualização do incidente ${incidentId}: ${updateData[key]}`);
                        res.status(400).json({ error: `Formato de data inválido para o campo ${key}` });
                        return;
                    }
                }
                else {
                    // Para outros campos, apenas copia o valor.
                    fieldsToUpdate[key] = updateData[key];
                }
            }
        }
        // Verifica se há pelo menos um campo para atualizar.
        if (Object.keys(fieldsToUpdate).length === 0) {
            logger_1.default.info(`Nenhum campo válido fornecido para atualizar o incidente ${incidentId}.`);
            res.status(400).json({ error: 'Nenhum campo fornecido para atualização' });
            return;
        }
        // Executa a operação `updateOne` no MongoDB.
        const result = await collection.updateOne({ _id: new mongodb_1.ObjectId(incidentId) }, // Critério de filtro: encontra pelo _id.
        { $set: fieldsToUpdate } // Operador $set: atualiza apenas os campos especificados em fieldsToUpdate.
        );
        // Verifica se algum documento foi encontrado (`matchedCount`).
        if (result.matchedCount === 0) {
            logger_1.default.warn(`Incidente ${incidentId} não encontrado para atualização.`);
            res.status(404).json({ error: 'Incidente não encontrado' });
            return;
        }
        // Se a atualização foi bem-sucedida (matchedCount > 0), busca o documento atualizado.
        const updatedIncident = await collection.findOne({ _id: new mongodb_1.ObjectId(incidentId) });
        logger_1.default.info(`Incidente ${incidentId} atualizado com sucesso.`, { changes: fieldsToUpdate });
        // Responde com o documento atualizado.
        res.json(updatedIncident);
    }
    catch (error) {
        // Captura e loga erros gerais.
        logger_1.default.error(`Erro ao atualizar incidente ${req.params.incidentId}:`, { error, body: req.body });
        // Responde com erro 500.
        res.status(500).json({
            error: 'Erro interno ao atualizar incidente',
            details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
}
/**
 * @function deleteIncident
 * @description Controladora para deletar um incidente pelo seu _id (ObjectId).
 * @param {Request} req - Objeto da requisição Express (espera `req.params.incidentId`).
 * @param {Response} res - Objeto da resposta Express.
 * @returns {Promise<void>} Responde com status 204 (No Content) em sucesso ou um erro (400, 404, 500).
 */
async function deleteIncident(req, res) {
    try {
        const { incidentId } = req.params; // ID do incidente a deletar.
        // Validação do ID.
        if (!mongodb_1.ObjectId.isValid(incidentId)) {
            logger_1.default.warn('ID inválido fornecido para deleção de incidente.', { incidentId });
            res.status(400).json({ error: 'ID de incidente inválido' });
            return; // Para a execução.
        }
        // Obtém a coleção 'incidents'.
        const collection = await (0, database_1.getCollection)('incidents');
        // Executa a operação `deleteOne` para remover o documento com o _id correspondente.
        const result = await collection.deleteOne({ _id: new mongodb_1.ObjectId(incidentId) });
        // Verifica se algum documento foi deletado (`deletedCount`).
        if (result.deletedCount === 0) {
            logger_1.default.warn(`Incidente ${incidentId} não encontrado para exclusão.`);
            res.status(404).json({ error: 'Incidente não encontrado para exclusão' });
            return;
        }
        // Se a deleção foi bem-sucedida.
        logger_1.default.info(`Incidente ${incidentId} excluído com sucesso.`);
        // Responde com status 204 No Content (padrão para DELETE bem-sucedido).
        res.status(204).send();
    }
    catch (error) {
        // Captura e loga erros.
        logger_1.default.error(`Erro ao excluir incidente ${req.params.incidentId}:`, error);
        // Responde com erro 500.
        res.status(500).json({ error: 'Erro ao excluir incidente' });
    }
}
/**
 * @function getIncidentsByDepartment
 * @description Controladora para obter estatísticas de contagem de incidentes agrupados por departamento.
 * Permite filtrar opcionalmente por ano.
 * @param {Request} req - Objeto da requisição Express (pode conter `req.query.year`).
 * @param {Response} res - Objeto da resposta Express.
 * @returns {Promise<void>} Responde com um array de objetos { department: string, count: number } ou um erro (500).
 */
async function getIncidentsByDepartment(req, res) {
    // Obtém o ano da query string e converte para número, ou fica undefined.
    const year = req.query.year ? parseInt(req.query.year) : undefined;
    logger_1.default.info('Requisição para buscar incidentes por departamento.', { year });
    try {
        // Obtém as coleções 'incidents' e 'departments'.
        const incidentsCollection = await (0, database_1.getCollection)('incidents');
        const departmentsCollection = await (0, database_1.getCollection)('departments');
        // Constrói a condição de filtro por data se um ano foi especificado.
        let dateCondition = {};
        if (year && !isNaN(year)) {
            const startDate = new Date(year, 0, 1); // 1º de Janeiro do ano especificado.
            const endDate = new Date(year + 1, 0, 1); // 1º de Janeiro do ano seguinte.
            // Filtra incidentes cuja data está entre o início do ano (inclusivo) e o início do próximo ano (exclusivo).
            dateCondition = { date: { $gte: startDate, $lt: endDate } };
            logger_1.default.info(`Aplicando filtro por ano: ${year}`);
        }
        // 1. Busca todos os documentos de departamento primeiro.
        const departments = await departmentsCollection.find({}).toArray();
        logger_1.default.info(`Encontrados ${departments.length} departamentos para processar.`);
        // 2. Itera sobre cada departamento e conta os incidentes correspondentes.
        // Usa Promise.all para executar as contagens em paralelo para cada departamento.
        const departmentStats = await Promise.all(departments.map(async (dept) => {
            // Define a query para contar incidentes:
            // - 'department' deve ser igual ao 'label' do departamento atual.
            // - Inclui a condição de data (se houver).
            const query = {
                department: dept.label, // Assumindo que o incidente armazena o 'label' do departamento.
                ...dateCondition // Adiciona o filtro de data, se existir.
            };
            // Conta quantos documentos na coleção 'incidents' correspondem à query.
            const count = await incidentsCollection.countDocuments(query);
            logger_1.default.debug(`Contagem para departamento '${dept.label}' (Ano: ${year || 'todos'}): ${count}`);
            // Retorna o objeto com o nome do departamento e a contagem.
            return {
                department: dept.label, // Usa o 'label' para exibição.
                count: count
            };
        }));
        // 3. Ordena as estatísticas pela contagem em ordem decrescente.
        departmentStats.sort((a, b) => b.count - a.count);
        logger_1.default.info(`Estatísticas de incidentes por departamento calculadas com sucesso. Ano: ${year || 'todos'}`);
        // Responde com o array de estatísticas.
        res.json(departmentStats);
    }
    catch (error) {
        // Captura e loga erros gerais.
        logger_1.default.error('Erro ao buscar estatísticas de incidentes por departamento:', { error, year });
        // Responde com erro 500.
        res.status(500).json({
            error: 'Erro ao buscar estatísticas de incidentes por departamento',
            details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
}
/**
 * @function getRecentIncidents
 * @description Controladora para buscar os N incidentes mais recentes (ordenados pela data do incidente).
 * Útil para exibir uma lista rápida de novidades ou atividades recentes.
 * @param {Request} req - Objeto da requisição Express (pode conter `req.query.limit`).
 * @param {Response} res - Objeto da resposta Express.
 * @returns {Promise<void>} Responde com um array dos incidentes recentes formatados ou um erro (400, 500).
 */
async function getRecentIncidents(req, res) {
    try {
        // Obtém o limite da query string, com padrão 5.
        const limit = parseInt(req.query.limit) || 5;
        // Validação do limite.
        if (limit <= 0) {
            logger_1.default.warn('Limite inválido solicitado para incidentes recentes.', { limit });
            res.status(400).json({ error: 'O limite deve ser um número positivo.' });
            return; // Para a execução.
        }
        logger_1.default.info(`Buscando ${limit} incidentes recentes.`);
        // Obtém a coleção 'incidents'.
        const collection = await (0, database_1.getCollection)('incidents');
        // Define a query. Poderia filtrar por status não arquivado aqui se necessário.
        // Ex: const query = { status: { $ne: 'Arquivado' } };
        const query = {}; // Atualmente busca todos os status.
        // Busca os incidentes:
        const recentIncidents = await collection.find(query)
            .sort({ date: -1 }) // Ordena pela data do incidente, mais recente primeiro.
            .limit(limit) // Limita o número de resultados.
            .toArray(); // Converte para array.
        // Formata a resposta para incluir apenas os campos necessários pelo frontend (boa prática).
        const formattedIncidents = recentIncidents.map(inc => ({
            _id: inc._id, // ID do incidente
            title: inc.title, // Título do incidente
            date: inc.date instanceof Date ? inc.date.toISOString() : inc.date, // Data como string ISO
        }));
        logger_1.default.info(`Retornando ${formattedIncidents.length} incidentes recentes formatados.`);
        // Responde com o array formatado.
        res.json(formattedIncidents);
    }
    catch (error) {
        // Captura e loga erros.
        logger_1.default.error('Erro ao buscar incidentes recentes:', { error, limit: req.query.limit });
        // Responde com erro 500.
        res.status(500).json({
            error: 'Erro ao buscar incidentes recentes',
            details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
    }
}
