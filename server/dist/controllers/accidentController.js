"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAccident = exports.updateAccident = exports.getAccidentById = exports.getAccidents = exports.createAccident = void 0;
const Accident_1 = __importDefault(require("../models/Accident"));
const logger_1 = __importDefault(require("../utils/logger"));
// Importa funções dos serviços de armazenamento (upload, delete, getSignedUrl)
const storage_1 = require("../services/storage");
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises")); // Módulo de sistema de arquivos (operações assíncronas)
const mongoose_1 = __importDefault(require("mongoose"));
/**
 * @function createAccident
 * @description Controladora para criar um novo registro de acidente.
 * Recebe dados do acidente (nome, país, data) e um arquivo PDF via `req.body` e `req.file`.
 * Faz upload do PDF para o armazenamento (R2 em produção, local em desenvolvimento).
 * Cria e salva um novo documento `Accident` no MongoDB.
 * @param {Request} req - Objeto da requisição Express (espera `req.body` com dados e `req.file` com o PDF).
 * @param {Response} res - Objeto da resposta Express.
 * @returns {Promise<void>} Responde com o acidente criado (status 201) ou um erro (status 400/500).
 */
const createAccident = async (req, res) => {
    try {
        // Log inicial da requisição
        logger_1.default.info('Recebida requisição para criar novo acidente:', { body: req.body, file: req.file?.originalname });
        // Validação: Verifica se o arquivo PDF foi enviado. Sem ele, não pode criar.
        if (!req.file) {
            logger_1.default.warn('Tentativa de criar acidente sem arquivo PDF.');
            // Responde com erro 400 Bad Request
            res.status(400).json({ error: 'Arquivo PDF é obrigatório' });
            return; // Importante retornar para parar a execução
        }
        // Define uma chave única para o arquivo no armazenamento (R2 ou local).
        // Formato: 'accidents/timestamp-nomeoriginal.ext' para evitar colisões.
        const key = `accidents/${Date.now()}-${req.file.originalname}`;
        logger_1.default.info(`Chave gerada para o arquivo: ${key}`);
        // Lógica condicional para armazenamento baseado no ambiente (NODE_ENV)
        if (process.env.NODE_ENV === 'development') {
            // Ambiente de Desenvolvimento: Salva o arquivo PDF localmente
            logger_1.default.info('Modo de desenvolvimento detectado - Salvando arquivo localmente.');
            // Define o diretório temporário local para os PDFs de acidentes
            const tempDir = path_1.default.join(process.cwd(), 'storage', 'temp', 'accidents');
            // Garante que o diretório exista, criando-o recursivamente se necessário
            await promises_1.default.mkdir(tempDir, { recursive: true });
            // Constrói o caminho completo para o arquivo local
            const localPath = path_1.default.join(tempDir, path_1.default.basename(key));
            // Escreve o buffer do arquivo (conteúdo) no caminho local
            await promises_1.default.writeFile(localPath, req.file.buffer);
            logger_1.default.info(`Arquivo salvo localmente em: ${localPath}`);
        }
        else {
            // Ambiente de Produção (ou qualquer outro não 'development'): Faz upload para Cloudflare R2
            logger_1.default.info('Modo de produção detectado - Fazendo upload para R2.');
            // Chama a função de serviço para fazer upload do buffer do arquivo para R2 com a chave e tipo MIME
            await (0, storage_1.uploadToR2)(req.file.buffer, key, req.file.mimetype);
            logger_1.default.info(`Upload para R2 concluído para a chave: ${key}`);
        }
        // Prepara o objeto com os dados do acidente para salvar no MongoDB.
        const accidentData = {
            name: req.body.name, // Nome do acidente do corpo da requisição
            country: req.body.country, // País do corpo da requisição
            date: new Date(req.body.date), // Converte a string de data para um objeto Date do JS
            pdfFile: {
                key: key, // A chave única usada no armazenamento (R2 ou local)
                originalName: req.file.originalname, // Nome original do arquivo enviado
                size: req.file.size, // Tamanho do arquivo em bytes
                mimeType: req.file.mimetype // Tipo MIME do arquivo (ex: 'application/pdf')
            }
            // Campos como 'createdBy' (ID do usuário) poderiam ser adicionados aqui: createdBy: req.user?.id
        };
        logger_1.default.info('Dados preparados para salvar o acidente:', accidentData);
        // Cria uma nova instância (documento) do modelo Mongoose 'Accident'.
        const accident = new Accident_1.default(accidentData);
        // Salva o documento no banco de dados MongoDB. Esta é uma operação assíncrona.
        const savedAccident = await accident.save();
        logger_1.default.info('Acidente salvo com sucesso no MongoDB:', { id: savedAccident._id });
        // Responde à requisição com o documento do acidente que foi salvo e status 201 (Created).
        res.status(201).json(savedAccident);
    }
    catch (error) {
        logger_1.default.error('Erro detalhado ao criar acidente:', {
            errorMessage: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            requestBody: req.body,
            fileName: req.file?.originalname
        });
        res.status(400).json({
            error: 'Erro ao criar registro de acidente',
            details: error instanceof Error ? error.message : String(error)
        });
    }
};
exports.createAccident = createAccident;
/**
 * @function getAccidents
 * @description Controladora para buscar múltiplos registros de acidentes.
 * Permite filtrar por país e intervalo de datas (`req.query`).
 * Utiliza o MongoDB Aggregation Framework para:
 *   - Filtrar e ordenar os acidentes.
 *   - Realizar `$lookup` nas coleções 'likes' e 'comments' para buscar dados relacionados.
 *   - Calcular `likeCount` e `commentCount`.
 *   - Verificar se o usuário logado (`req.user`) deu like (`userHasLiked`).
 *   - Gera URLs assinadas (presigned URLs) para acesso aos PDFs armazenados no R2 (ou retorna null se local/sem chave).
 * @param {Request} req - Objeto da requisição Express (pode conter `req.query` para filtros e `req.user`).
 * @param {Response} res - Objeto da resposta Express.
 * @returns {Promise<void>} Responde com um array de acidentes (incluindo contagens e URL do PDF) ou um erro (status 500).
 */
const getAccidents = async (req, res) => {
    try {
        // Tenta obter o ID do usuário logado do objeto req.user (assumindo middleware de autenticação).
        // Converte para ObjectId se existir, caso contrário fica null.
        const userId = req.user?.userId ? new mongoose_1.default.Types.ObjectId(req.user.userId) : null;
        logger_1.default.info('Requisição para buscar acidentes recebida.', { userId: userId?.toString(), query: req.query });
        // Extrai possíveis parâmetros de filtro da query string da URL.
        const { country, startDate, endDate } = req.query;
        // Objeto que conterá os critérios para o estágio $match da agregação.
        const matchQuery = {};
        // Constrói o objeto matchQuery dinamicamente baseado nos filtros fornecidos.
        if (country) {
            matchQuery.country = country; // Filtra pelo campo 'country'.
            logger_1.default.info(`Aplicando filtro por país: ${country}`);
        }
        if (startDate && endDate) {
            // Se ambas as datas existem, cria um filtro de intervalo para o campo 'date'.
            matchQuery.date = {
                $gte: new Date(startDate), // Greater than or equal to startDate
                $lte: new Date(endDate) // Less than or equal to endDate
            };
            logger_1.default.info(`Aplicando filtro por data: ${startDate} a ${endDate}`);
        }
        // Define os estágios do pipeline de agregação do MongoDB.
        const aggregationPipeline = [
            // Estágio 1: Filtrar os documentos de acidentes que correspondem aos critérios definidos em matchQuery.
            { $match: matchQuery },
            // Estágio 2: Ordenar os resultados pela data ('date') em ordem descendente (-1), mostrando os mais recentes primeiro.
            { $sort: { date: -1 } },
            // Estágio 3: Realizar um "join" com a coleção 'likes'.
            {
                $lookup: {
                    from: 'likes', // Coleção de onde buscar os dados ('likes').
                    localField: '_id', // Campo no documento atual ('Accident') para fazer a correspondência.
                    foreignField: 'itemId', // Campo na coleção 'likes' para fazer a correspondência.
                    as: 'likesData' // Nome do novo array que será adicionado a cada documento 'Accident', contendo os likes correspondentes.
                }
            },
            // Estágio 4: Realizar um "join" com a coleção 'comments'.
            {
                $lookup: {
                    from: 'comments', // Coleção 'comments'.
                    localField: '_id', // Campo no 'Accident'.
                    foreignField: 'itemId', // Campo no 'comments'.
                    as: 'commentsData' // Nome do novo array com os comentários correspondentes.
                }
            },
            // Estágio 5: Adicionar novos campos calculados aos documentos resultantes.
            {
                $addFields: {
                    // likeCount: Calcula o tamanho (número de elementos) do array 'likesData'.
                    likeCount: { $size: '$likesData' },
                    // commentCount: Calcula o tamanho do array 'commentsData'.
                    commentCount: { $size: '$commentsData' },
                    // userHasLiked: Verifica se o ID do usuário logado (userId) existe dentro do array de 'likesData.userId'.
                    // Usa o operador $in. Retorna `false` se `userId` for `null` (usuário não logado).
                    userHasLiked: userId ? { $in: [userId, '$likesData.userId'] } : false
                }
            },
            // Estágio 6: Projetar (selecionar/remover) campos do resultado final.
            {
                $project: {
                    likesData: 0, // Exclui o campo 'likesData' (o array completo de likes).
                    commentsData: 0 // Exclui o campo 'commentsData' (o array completo de comentários).
                    // Todos os outros campos originais do 'Accident' e os campos adicionados em $addFields
                    // são mantidos por padrão quando se usa $project para excluir.
                }
            }
        ];
        logger_1.default.info('Executando pipeline de agregação para buscar acidentes...');
        // Executa a agregação no modelo Accident usando o pipeline definido.
        // O tipo é explicitamente definido para incluir os campos adicionados.
        const accidents = await Accident_1.default.aggregate(aggregationPipeline);
        logger_1.default.info(`Agregação concluída. ${accidents.length} acidentes encontrados.`);
        // Se a agregação não retornar nenhum acidente, responde com um array vazio.
        if (accidents.length === 0) {
            logger_1.default.info('Nenhum acidente encontrado com os filtros aplicados.');
            res.json([]);
            return;
        }
        // Mapeia os resultados da agregação para adicionar a URL assinada do PDF a cada acidente.
        // Usa Promise.all para executar as chamadas assíncronas de getSignedUrl em paralelo.
        const accidentsWithUrls = await Promise.all(accidents.map(async (accident) => {
            try {
                // Verifica se o documento de acidente possui a informação do arquivo PDF e a chave.
                // A verificação `?.` (Optional Chaining) previne erros se `pdfFile` for null ou undefined.
                if (!accident.pdfFile?.key) {
                    logger_1.default.warn('Acidente sem chave PDF, não é possível gerar URL.', { accidentId: accident._id });
                    // Retorna o objeto do acidente sem a propriedade pdfUrl (ou com ela como null).
                    return { ...accident, pdfUrl: null };
                }
                logger_1.default.debug('Gerando URL assinada para PDF.', { accidentId: accident._id, key: accident.pdfFile.key });
                // Chama a função de serviço para obter a URL assinada (presume-se que funcione apenas para R2).
                const signedUrl = await (0, storage_1.getSignedUrl)(accident.pdfFile.key);
                logger_1.default.debug('URL assinada gerada.', { accidentId: accident._id, hasUrl: !!signedUrl });
                // Retorna uma cópia do objeto do acidente com a propriedade pdfUrl adicionada.
                return { ...accident, pdfUrl: signedUrl };
            }
            catch (urlError) {
                logger_1.default.error('Erro ao gerar URL assinada para PDF específico.', { accidentId: accident._id, key: accident.pdfFile?.key, error: urlError instanceof Error ? urlError.message : String(urlError) });
                return { ...accident, pdfUrl: null };
            }
        }));
        logger_1.default.info(`Processamento de URLs concluído para ${accidentsWithUrls.length} acidentes.`);
        // Responde à requisição com o array final de acidentes, incluindo os dados agregados e as URLs.
        res.json(accidentsWithUrls);
    }
    catch (error) {
        logger_1.default.error('Erro geral no controlador getAccidents:', {
            errorMessage: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            query: req.query
        });
        res.status(500).json({
            error: 'Erro ao buscar documentos de acidentes',
            details: error instanceof Error ? error.message : String(error)
        });
    }
};
exports.getAccidents = getAccidents;
/**
 * @function getAccidentById
 * @description Controladora para buscar um único registro de acidente pelo seu ID.
 * Similar a `getAccidents`, usa agregação para incluir contagens de likes/comments e `userHasLiked`.
 * Gera a URL assinada para o PDF do acidente encontrado.
 * @param {Request} req - Objeto da requisição Express (espera `req.params.id` e pode ter `req.user`).
 * @param {Response} res - Objeto da resposta Express.
 * @returns {Promise<void>} Responde com o acidente encontrado (incluindo URL do PDF) ou um erro (400, 404, 500).
 */
const getAccidentById = async (req, res) => {
    try {
        const { id } = req.params; // Obtém o ID do parâmetro da rota.
        // Valida se o ID fornecido é um formato válido de ObjectId do MongoDB.
        if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
            logger_1.default.warn('ID inválido fornecido para getAccidentById', { id });
            // Responde com 400 Bad Request se o ID for inválido.
            res.status(400).json({ error: 'ID do acidente inválido' });
            return; // Para a execução.
        }
        // Converte o ID string para um objeto ObjectId do Mongoose.
        const docId = new mongoose_1.default.Types.ObjectId(id);
        // Obtém o ID do usuário logado, se disponível.
        const userId = req.user?.userId ? new mongoose_1.default.Types.ObjectId(req.user.userId) : null;
        logger_1.default.info('Requisição para buscar acidente por ID recebida.', { docId: docId.toString(), userId: userId?.toString() });
        // Pipeline de agregação similar ao getAccidents, mas com $match pelo _id específico.
        const aggregationPipeline = [
            { $match: { _id: docId } }, // Filtra pelo ID do documento.
            { $lookup: { from: 'likes', localField: '_id', foreignField: 'itemId', as: 'likesData' } }, // Junta likes.
            { $lookup: { from: 'comments', localField: '_id', foreignField: 'itemId', as: 'commentsData' } }, // Junta comentários.
            {
                $addFields: {
                    likeCount: { $size: '$likesData' },
                    commentCount: { $size: '$commentsData' },
                    userHasLiked: userId ? { $in: [userId, '$likesData.userId'] } : false
                }
            },
            { $project: { likesData: 0, commentsData: 0 } } // Remove os arrays brutos.
        ];
        logger_1.default.info('Executando pipeline de agregação para buscar acidente por ID...');
        // Executa a agregação. Espera-se no máximo 1 resultado.
        const results = await Accident_1.default.aggregate(aggregationPipeline);
        // Verifica se a agregação retornou algum resultado.
        if (!results || results.length === 0) {
            logger_1.default.warn('Acidente não encontrado após agregação por ID.', { docId: docId.toString() });
            res.status(404).json({ error: 'Documento de acidente não encontrado' });
            return;
        }
        // Pega o primeiro (e único) documento do array de resultados.
        const accident = results[0];
        logger_1.default.info('Acidente encontrado com agregação.', { docId: docId.toString(), likeCount: accident.likeCount, commentCount: accident.commentCount });
        // Tenta gerar a URL assinada para o PDF do acidente encontrado.
        try {
            // Verifica se o acidente possui informações de arquivo e a chave PDF.
            if (!accident.pdfFile?.key) {
                logger_1.default.warn('Acidente encontrado não possui chave PDF.', { accidentId: accident._id });
                // Responde com os dados do acidente, mas indica que não há URL.
                res.json({ ...accident, pdfUrl: null });
            }
            else {
                logger_1.default.debug('Gerando URL assinada para PDF do acidente encontrado por ID.', { accidentId: accident._id, key: accident.pdfFile.key });
                // Gera a URL assinada.
                const signedUrl = await (0, storage_1.getSignedUrl)(accident.pdfFile.key);
                logger_1.default.debug('URL assinada gerada com sucesso.', { accidentId: accident._id });
                // Responde com os dados do acidente e a URL gerada.
                res.json({ ...accident, pdfUrl: signedUrl });
            }
        }
        catch (urlError) {
            // Captura erros específicos da geração da URL.
            logger_1.default.error('Erro ao gerar URL assinada para PDF (get by ID).', { accidentId: accident._id, key: accident.pdfFile?.key, error: urlError instanceof Error ? urlError.message : String(urlError) });
            // Responde com os dados do acidente, mas indica que a URL não pôde ser gerada.
            res.json({ ...accident, pdfUrl: null });
        }
    }
    catch (error) {
        // Captura erros gerais no processo.
        logger_1.default.error('Erro geral no controlador getAccidentById:', {
            errorMessage: error instanceof Error ? error.message : String(error),
            id: req.params.id, // Loga o ID que causou o erro
            stack: error instanceof Error ? error.stack : undefined
        });
        // Responde com erro 500 Internal Server Error.
        res.status(500).json({
            error: 'Erro ao buscar documento de acidente',
            details: error instanceof Error ? error.message : String(error)
        });
    }
};
exports.getAccidentById = getAccidentById;
/**
 * @function updateAccident
 * @description Controladora para atualizar um registro de acidente existente.
 * Permite atualizar nome, país, data e opcionalmente substituir o arquivo PDF.
 * Se um novo PDF for enviado, o antigo é deletado do armazenamento (R2 ou local)
 * e o novo é carregado.
 * @param {Request} req - Objeto da requisição Express (espera `req.params.id`, `req.body` com dados e opcionalmente `req.file`).
 * @param {Response} res - Objeto da resposta Express.
 * @returns {Promise<void>} Responde com o acidente atualizado (incluindo URL do PDF) ou um erro (400, 404, 500).
 */
const updateAccident = async (req, res) => {
    try {
        const { id } = req.params; // ID do acidente a ser atualizado.
        const { name, country, date } = req.body; // Dados a serem atualizados.
        logger_1.default.info('Requisição para atualizar acidente recebida.', { id, body: req.body, file: req.file?.originalname });
        // Objeto para armazenar os dados que serão efetivamente enviados para atualização no MongoDB.
        const updateData = { name, country, date: new Date(date) };
        // Verifica se um novo arquivo foi enviado na requisição para substituir o existente.
        if (req.file) {
            logger_1.default.info('Novo arquivo PDF recebido para atualização.');
            // Busca o documento atual no banco para obter a chave do PDF antigo.
            const accident = await Accident_1.default.findById(id);
            // Se não encontrar o acidente para atualizar, retorna 404.
            if (!accident) {
                logger_1.default.warn('Acidente não encontrado para atualização.', { id });
                res.status(404).json({ error: 'Documento de acidente não encontrado' });
                return; // Para a execução.
            }
            // **Verificação adicionada para resolver erro do linter e evitar erro em runtime**
            // Verifica se o acidente *tinha* um arquivo PDF e uma chave associada antes de tentar deletar.
            if (accident.pdfFile?.key) {
                // Se sim, deleta o arquivo PDF antigo do armazenamento (R2 ou local).
                logger_1.default.info('Deletando arquivo PDF antigo do armazenamento.', { id, key: accident.pdfFile.key });
                // Chama a função de serviço para deletar do R2 (presume-se que lide com ambiente dev/prod).
                await (0, storage_1.deleteFromR2)(accident.pdfFile.key);
                logger_1.default.info('Arquivo PDF antigo deletado com sucesso.', { id, key: accident.pdfFile.key });
            }
            else {
                // Loga se não havia arquivo anterior para deletar.
                logger_1.default.warn('Acidente sendo atualizado não possuía chave PDF anterior.', { id });
            }
            // Gera uma nova chave única para o novo arquivo PDF.
            const newKey = `accidents/${Date.now()}-${req.file.originalname}`;
            logger_1.default.info(`Nova chave gerada para o arquivo atualizado: ${newKey}`);
            // Faz upload do novo arquivo PDF (R2 ou local, dependendo do ambiente).
            if (process.env.NODE_ENV === 'development') {
                logger_1.default.info('Modo de desenvolvimento - Salvando novo arquivo localmente.');
                const tempDir = path_1.default.join(process.cwd(), 'storage', 'temp', 'accidents');
                await promises_1.default.mkdir(tempDir, { recursive: true });
                const localPath = path_1.default.join(tempDir, path_1.default.basename(newKey));
                await promises_1.default.writeFile(localPath, req.file.buffer);
                logger_1.default.info(`Novo arquivo salvo localmente em: ${localPath}`);
            }
            else {
                logger_1.default.info('Modo de produção - Fazendo upload do novo arquivo para R2.');
                await (0, storage_1.uploadToR2)(req.file.buffer, newKey, req.file.mimetype);
                logger_1.default.info(`Upload do novo arquivo para R2 concluído: ${newKey}`);
            }
            // Adiciona/atualiza os metadados do novo arquivo no objeto `updateData`.
            updateData.pdfFile = {
                key: newKey,
                originalName: req.file.originalname,
                size: req.file.size,
                mimeType: req.file.mimetype
            };
        }
        logger_1.default.info('Atualizando documento do acidente no MongoDB...', { id, hasNewFile: !!req.file });
        // Realiza a atualização no MongoDB usando findByIdAndUpdate.
        // - `id`: O ID do documento a ser atualizado.
        // - `updateData`: O objeto com os campos a serem atualizados.
        // - `{ new: true }`: Opção para retornar o documento *após* a atualização.
        // - `{ runValidators: true }`: Opção para garantir que as validações definidas no Schema Mongoose sejam aplicadas aos dados de `updateData`.
        const updatedAccident = await Accident_1.default.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
        // Verifica se a atualização foi bem-sucedida (se o documento foi encontrado).
        if (!updatedAccident) {
            logger_1.default.warn('Acidente não encontrado para atualização final (findByIdAndUpdate retornou null).', { id });
            res.status(404).json({ error: 'Documento de acidente não encontrado' });
            return; // Para a execução.
        }
        logger_1.default.info('Acidente atualizado com sucesso no MongoDB.', { id });
        // Tenta gerar a URL assinada para o PDF (pode ser o novo ou o antigo, se não foi substituído).
        let signedUrl = null;
        // **Verificação adicionada para resolver erro do linter e evitar erro em runtime**
        if (updatedAccident.pdfFile?.key) { // Verifica se há uma chave de PDF no documento atualizado.
            try {
                logger_1.default.debug('Gerando URL assinada para PDF do acidente atualizado.', { id, key: updatedAccident.pdfFile.key });
                signedUrl = await (0, storage_1.getSignedUrl)(updatedAccident.pdfFile.key);
                logger_1.default.debug('URL assinada gerada.', { id });
            }
            catch (urlError) {
                // Loga o erro mas não impede a resposta, apenas a URL ficará null.
                logger_1.default.error('Erro ao gerar URL assinada para PDF após atualização.', { id, key: updatedAccident.pdfFile.key, error: urlError instanceof Error ? urlError.message : String(urlError) });
            }
        }
        else {
            logger_1.default.warn('Acidente atualizado não possui chave PDF para gerar URL.', { id });
        }
        // Prepara a resposta final, convertendo o documento Mongoose para um objeto JS simples
        // e adicionando a URL assinada (ou null).
        const accidentWithUrl = {
            ...updatedAccident.toObject(),
            pdfUrl: signedUrl
        };
        // Responde com o documento atualizado.
        res.json(accidentWithUrl);
    }
    catch (error) {
        logger_1.default.error('Erro geral no controlador updateAccident:', {
            errorMessage: error instanceof Error ? error.message : String(error),
            id: req.params.id,
            requestBody: req.body,
            fileName: req.file?.originalname,
            stack: error instanceof Error ? error.stack : undefined
        });
        res.status(400).json({
            error: 'Erro ao atualizar registro de acidente',
            details: error instanceof Error ? error.message : String(error)
        });
    }
};
exports.updateAccident = updateAccident;
/**
 * @function deleteAccident
 * @description Controladora para deletar um registro de acidente pelo seu ID.
 * Busca o acidente, deleta o arquivo PDF associado do armazenamento (R2 ou local)
 * e então remove o documento do MongoDB.
 * @param {Request} req - Objeto da requisição Express (espera `req.params.id`).
 * @param {Response} res - Objeto da resposta Express.
 * @returns {Promise<void>} Responde com status 204 (No Content) em sucesso ou um erro (404, 500).
 */
const deleteAccident = async (req, res) => {
    try {
        const { id } = req.params; // ID do acidente a deletar.
        logger_1.default.info('Requisição para deletar acidente recebida.', { id });
        // Busca o documento no MongoDB para verificar se existe e obter a chave do PDF.
        const accident = await Accident_1.default.findById(id);
        // Se o acidente não for encontrado, retorna 404 Not Found.
        if (!accident) {
            logger_1.default.warn('Acidente não encontrado para deleção.', { id });
            res.status(404).json({ error: 'Documento de acidente não encontrado' });
            return; // Para a execução.
        }
        // **Verificação adicionada para resolver erro do linter e evitar erro em runtime**
        // Verifica se o acidente possui informações de arquivo PDF e uma chave antes de tentar deletar.
        if (accident.pdfFile?.key) {
            // Deleta o arquivo PDF associado do armazenamento (R2 ou local).
            logger_1.default.info('Deletando arquivo PDF associado do armazenamento.', { id, key: accident.pdfFile.key });
            // Chama a função de serviço para deletar do R2 (presume-se que lide com dev/prod).
            await (0, storage_1.deleteFromR2)(accident.pdfFile.key);
            logger_1.default.info('Arquivo PDF deletado com sucesso do armazenamento.', { id, key: accident.pdfFile.key });
        }
        else {
            // Loga se não havia arquivo para deletar.
            logger_1.default.warn('Acidente a ser deletado não possuía chave PDF.', { id });
        }
        // Após (tentar) deletar o arquivo associado, deleta o documento do MongoDB.
        logger_1.default.info('Deletando documento do acidente do MongoDB...', { id });
        // Usa o método deleteOne() na instância do documento encontrada.
        await accident.deleteOne();
        logger_1.default.info('Documento do acidente deletado com sucesso do MongoDB.', { id });
        // Responde com status 204 No Content, indicando que a operação foi bem-sucedida
        // e não há corpo na resposta. É o padrão para operações DELETE bem-sucedidas.
        res.status(204).send();
    }
    catch (error) {
        // Captura erros gerais que possam ocorrer durante a busca ou deleção.
        logger_1.default.error('Erro geral no controlador deleteAccident:', {
            errorMessage: error instanceof Error ? error.message : String(error),
            id: req.params.id, // Loga o ID que estava sendo deletado
            stack: error instanceof Error ? error.stack : undefined
        });
        // Responde com erro 500 Internal Server Error.
        res.status(500).json({
            error: 'Erro ao deletar registro de acidente',
            details: error instanceof Error ? error.message : String(error)
        });
    }
};
exports.deleteAccident = deleteAccident;
