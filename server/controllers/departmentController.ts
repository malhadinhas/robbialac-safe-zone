/**
 * @module server/controllers/departmentController
 * @description Este módulo contém as funções controladoras (handlers) para as rotas
 * relacionadas aos departamentos da empresa. Ele lida com requisições HTTP
 * para buscar informações sobre departamentos e atualizar dados específicos,
 * como a contagem de funcionários.
 */
import { Request, Response } from 'express';
import Department from '../models/Department';
import logger from '../utils/logger'; // Utilitário de logging
import { ObjectId } from 'mongodb'; // Tipo ObjectId do MongoDB

/**
 * @interface Department
 * @description Define a estrutura esperada para um documento de departamento no MongoDB.
 * NOTA: Contém `id` (string) e `_id` (ObjectId, opcional na interface mas presente no DB).
 *       A função `getDepartmentById` busca por `id`, enquanto `updateDepartmentEmployeeCount` usa `_id`.
 *       É importante garantir consistência ou ajustar a lógica de busca/atualização.
 */
interface Department {
  _id?: ObjectId;         // O ID único gerado pelo MongoDB (ObjectId).
  id: string;            // Um identificador string (potencialmente duplicado ou usado para referência externa).
  name: string;          // Nome do departamento.
  color: string;         // Cor associada ao departamento (provavelmente para UI).
  employeeCount: number; // Número de funcionários atualmente neste departamento.
}

/**
 * @function getDepartments
 * @description Controladora para buscar todos os departamentos registrados no banco de dados.
 * @param {Request} req - Objeto da requisição Express (não utilizado nesta função).
 * @param {Response} res - Objeto da resposta Express.
 * @returns {Promise<void>} Responde com um array JSON de todos os documentos de departamento ou um erro 500.
 */
export const getDepartments = async (req: Request, res: Response): Promise<void> => {
  try {
    // Busca todos os documentos na coleção 'departments'.
    // find() sem filtro retorna um cursor para todos os documentos.
    // toArray() converte o cursor em um array de objetos JavaScript.
    const departments = await Department.find();

    logger.info('Departamentos recuperados com sucesso.', { count: departments.length });
    // Responde com o array de departamentos em formato JSON. O status 200 OK é implícito.
    res.json(departments);

  } catch (error: unknown) {
    // Captura qualquer erro que ocorra durante a busca no banco de dados.
    logger.error('Erro ao recuperar departamentos:', { error: error instanceof Error ? error.message : String(error) });
    // Responde com um status 500 (Internal Server Error) e uma mensagem de erro genérica.
    res.status(500).json({ message: 'Erro ao recuperar departamentos' });
  }
};

/**
 * @function getDepartmentById
 * @description Controladora para buscar um departamento específico pelo seu campo `id` (string).
 * @param {Request} req - Objeto da requisição Express (espera que `req.params.id` contenha o ID string).
 * @param {Response} res - Objeto da resposta Express.
 * @returns {Promise<void>} Responde com o documento do departamento encontrado em JSON ou um erro (404, 500).
 */
export const getDepartmentById = async (req: Request, res: Response): Promise<void> => {
  try {
    // Extrai o parâmetro 'id' da URL da requisição (ex: /api/departments/marketing).
    const { id } = req.params;
    logger.info('Requisição para buscar departamento por ID (string).', { id });

    // Busca por um único documento onde o campo 'id' (definido como string na interface)
    // seja igual ao ID fornecido na URL.
    // ATENÇÃO: Esta busca pode não funcionar se o ID primário for o `_id` (ObjectId)
    // e não houver um campo 'id' (string) nos documentos, ou se ele não for único.
    const department = await Department.findOne({ id: id });

    // Verifica se o método findOne retornou um documento.
    if (!department) {
      // Se não encontrou, loga um aviso e retorna status 404 (Not Found).
      logger.warn('Departamento não encontrado pelo ID (string).', { id });
      res.status(404).json({ message: 'Departamento não encontrado' });
      return; // Importante retornar para parar a execução.
    }

    // Se encontrou, loga sucesso e retorna o documento do departamento em JSON.
    logger.info('Departamento recuperado com sucesso pelo ID (string).', { id });
    res.json(department);

  } catch (error: unknown) {
    // Captura e loga erros ocorridos durante a busca.
    logger.error('Erro ao recuperar departamento por ID (string):', { id: req.params.id, error: error instanceof Error ? error.message : String(error) });
    // Responde com erro 500.
    res.status(500).json({ message: 'Erro ao recuperar departamento' });
  }
};

/**
 * @function getDepartmentsWithEmployees
 * @description Controladora que, atualmente, busca todos os departamentos.
 * O nome sugere que deveria buscar departamentos *com* funcionários ou agregar dados de funcionários,
 * mas a implementação atual é idêntica a `getDepartments`.
 * TODO: Revisar a lógica para realmente buscar/agregar dados de funcionários ou renomear/remover a função.
 * @param {Request} req - Objeto da requisição Express (não utilizado).
 * @param {Response} res - Objeto da resposta Express.
 * @returns {Promise<void>} Responde com um array de todos os documentos de departamento ou um erro (500).
 */
export const getDepartmentsWithEmployees = async (req: Request, res: Response): Promise<void> => {
  // Esta função atualmente tem a mesma implementação que getDepartments.
  try {
    // Busca todos os documentos.
    const departments = await Department.find();

    // Log pode ser enganoso devido ao nome da função.
    logger.info('Departamentos (com funcionários?) recuperados com sucesso.', { count: departments.length });
    // Responde com o array de departamentos.
    res.json(departments);

  } catch (error: unknown) {
    // Captura e loga erros.
    logger.error('Erro ao recuperar departamentos (com funcionários?):', { error: error instanceof Error ? error.message : String(error) });
    // Responde com erro 500.
    res.status(500).json({ message: 'Erro ao recuperar departamentos com funcionários' });
  }
};

/**
 * @function updateDepartmentEmployeeCount
 * @description Controladora para atualizar o campo `employeeCount` de um departamento específico,
 * identificado pelo seu `_id` (ObjectId), que é passado como parâmetro de rota (`departmentId`).
 * @param {Request} req - Objeto da requisição Express. Espera:
 *                      - `req.params.departmentId`: A string representando o ObjectId do departamento.
 *                      - `req.body.employeeCount`: O novo número de funcionários.
 * @param {Response} res - Objeto da resposta Express.
 * @returns {Promise<void>} Responde com mensagem de sucesso (200) ou erro (400, 404, 500).
 */
export const updateDepartmentEmployeeCount = async (req: Request, res: Response): Promise<void> => {
  try {
    // Obtém o ID do departamento da URL (parâmetro da rota). Espera-se que seja uma string ObjectId válida.
    const { departmentId } = req.params;
    // Obtém a nova contagem de funcionários do corpo da requisição.
    const { employeeCount } = req.body;
    logger.info('Requisição para atualizar contagem de funcionários recebida.', { departmentId, employeeCount });

    // --- Validações de Entrada ---
    // 1. Valida o 'employeeCount':
    //    - Verifica se foi fornecido (`undefined`).
    //    - Verifica se pode ser convertido para número (`isNaN(Number(...))`).
    //    - Verifica se o número não é negativo.
    if (employeeCount === undefined || isNaN(Number(employeeCount)) || Number(employeeCount) < 0) {
      logger.warn('Contagem de funcionários inválida fornecida para atualização.', { departmentId, employeeCount });
      // Retorna 400 Bad Request se a contagem for inválida.
      res.status(400).json({ message: 'Contagem de funcionários inválida.' });
      return; // Para a execução.
    }

    // 2. Valida o formato do 'departmentId':
    //    - Verifica se a string fornecida é um formato válido de ObjectId do MongoDB.
    if (!ObjectId.isValid(departmentId)) {
      logger.warn('ID de departamento inválido fornecido para atualização.', { departmentId });
      // Retorna 400 Bad Request se o ID for inválido.
      res.status(400).json({ message: 'ID de departamento inválido.' });
      return; // Para a execução.
    }
    // --- Fim das Validações ---

    // Executa a operação de atualização no MongoDB.
    const result = await Department.updateOne(
      // Critério de filtro: Encontra o documento onde o campo '_id' é igual ao ObjectId correspondente ao 'departmentId'.
      { _id: new ObjectId(departmentId) },
      // Operador de atualização $set: Define o valor do campo 'employeeCount' para o novo número fornecido.
      // Number() garante que o valor armazenado seja numérico.
      { $set: { employeeCount: Number(employeeCount) } }
    );

    // Analisa o resultado da operação updateOne:
    // result.matchedCount: Número de documentos que corresponderam ao critério de filtro.
    // result.modifiedCount: Número de documentos que foram efetivamente modificados.

    // Verifica se algum documento foi encontrado pelo ID.
    if (result.matchedCount === 0) {
      logger.warn('Departamento não encontrado para atualização de contagem.', { departmentId });
      // Retorna 404 Not Found se nenhum departamento com aquele _id foi encontrado.
      res.status(404).json({ message: 'Departamento não encontrado' });
      return; // Para a execução.
    }

    // Verifica se o documento foi modificado.
    // Se modifiedCount for 0, significa que o documento foi encontrado, mas o valor de employeeCount
    // já era igual ao valor que tentamos definir.
    if (result.modifiedCount === 0) {
      logger.info('Contagem de funcionários não modificada (provavelmente valor igual ao existente).', { departmentId });
      // Retorna 200 OK, mas com uma mensagem indicando que não houve alteração real.
      res.status(200).json({ message: 'Contagem de funcionários não modificada (valor igual ao existente)' });
      return; // Para a execução.
    }

    // Se matchedCount > 0 e modifiedCount > 0, a atualização foi bem-sucedida.
    logger.info('Contagem de funcionários atualizada com sucesso.', { departmentId, newCount: employeeCount });
    // Responde com mensagem de sucesso e status 200 OK.
    res.status(200).json({ message: 'Contagem de funcionários atualizada com sucesso' });

  } catch (error: unknown) {
    // Captura e loga erros gerais que possam ocorrer.
    logger.error('Erro ao atualizar contagem de funcionários:', { id: req.params.departmentId, error: error instanceof Error ? error.message : String(error) });
    // Responde com erro 500.
    res.status(500).json({ message: 'Erro ao atualizar contagem de funcionários' });
  }
}; 