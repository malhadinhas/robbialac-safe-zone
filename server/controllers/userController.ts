import { Request, Response } from 'express'; // Importa os tipos do Express para tipar as funções de request e response
import { getCollection } from '../services/database'; // Função para obter uma coleção da base de dados
import { User } from '../types'; // Tipo User definido na aplicação
import { hashPassword } from '../services/auth'; // Função para fazer hash da password
import logger from '../utils/logger'; // Logger para registar informações e erros

// Função para obter todos os utilizadores
export async function getUsers(req: Request, res: Response) {
  try {
    const collection = await getCollection<User>('users'); // Obtém a coleção 'users'
    const users = await collection.find({}).toArray(); // Busca todos os utilizadores
    res.json(users); // Retorna a lista de utilizadores
  } catch (error) {
    console.error('Erro ao buscar usuários:', error); // Log de erro
    res.status(500).json({ error: 'Erro ao buscar usuários' }); // Retorna erro 500
  }
}

// Função para obter um utilizador pelo ID
export async function getUserById(req: Request, res: Response) {
  try {
    const { id } = req.params; // Extrai o id dos parâmetros da rota
    const collection = await getCollection<User>('users'); // Obtém a coleção 'users'
    const user = await collection.findOne({ id }); // Procura o utilizador pelo id
    
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' }); // Se não encontrar, retorna 404
    }
    
    res.json(user); // Retorna o utilizador encontrado
  } catch (error) {
    console.error('Erro ao buscar usuário:', error); // Log de erro
    res.status(500).json({ error: 'Erro ao buscar usuário' }); // Retorna erro 500
  }
}

// Função para obter um utilizador pelo email
export async function getUserByEmail(req: Request, res: Response) {
  try {
    const { email } = req.params; // Extrai o email dos parâmetros da rota
    const collection = await getCollection<User>('users'); // Obtém a coleção 'users'
    const user = await collection.findOne({ email }); // Procura o utilizador pelo email
    
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' }); // Se não encontrar, retorna 404
    }
    
    res.json(user); // Retorna o utilizador encontrado
  } catch (error) {
    console.error('Erro ao buscar usuário por email:', error); // Log de erro
    res.status(500).json({ error: 'Erro ao buscar usuário' }); // Retorna erro 500
  }
}

// Função para criar um novo utilizador
export async function createUser(req: Request, res: Response) {
  try {
    const { email, password, ...restData } = req.body; // Extrai email, password e outros dados do corpo do pedido

    // Validação básica dos campos obrigatórios
    if (!email || !password) {
      logger.warn('Tentativa de criar utilizador sem email ou password');
      return res.status(400).json({ error: 'Email e password são obrigatórios' }); // Retorna erro 400 se faltar algum campo
    }

    const collection = await getCollection<User>('users'); // Obtém a coleção 'users'
    
    // Verifica se já existe um utilizador com o mesmo email
    const existingUser = await collection.findOne({ email });
    if (existingUser) {
      logger.warn('Tentativa de criar utilizador com email já existente', { email });
      return res.status(400).json({ error: 'Email já cadastrado' }); // Retorna erro 400 se o email já existir
    }

    // Faz hash da password antes de guardar
    const hashedPassword = await hashPassword(password);
    
    // Cria o novo utilizador com valores padrão
    const newUser: User = {
      email,
      password: hashedPassword,
      ...restData,
      id: crypto.randomUUID(), // Gera um ID único
      points: 100, // Pontos iniciais
      level: 1, // Nível inicial
      medals: [],
      viewedVideos: [],
      reportedIncidents: []
    };
    
    await collection.insertOne(newUser); // Insere o novo utilizador na base de dados
    logger.info('Novo utilizador criado com sucesso', { email });
    
    // Remove a password do objeto antes de devolver ao frontend
    const { password: _, ...userToReturn } = newUser;
    res.status(201).json(userToReturn); // Retorna o utilizador criado (sem password)

  } catch (error: any) {
    logger.error('Erro ao criar utilizador', { error: error.message, stack: error.stack }); // Log de erro
    res.status(500).json({ error: 'Erro ao criar utilizador' }); // Retorna erro 500
  }
}

// Função para atualizar um utilizador existente
export async function updateUser(req: Request, res: Response) {
  try {
    const { id } = req.params; // Extrai o id dos parâmetros da rota
    const updateData = req.body; // Dados a atualizar
    const collection = await getCollection<User>('users'); // Obtém a coleção 'users'
    
    // Atualiza o utilizador com os novos dados
    const result = await collection.updateOne(
      { id },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' }); // Se não encontrar, retorna 404
    }
    
    res.json({ message: 'Usuário atualizado com sucesso' }); // Retorna mensagem de sucesso
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error); // Log de erro
    res.status(500).json({ error: 'Erro ao atualizar usuário' }); // Retorna erro 500
  }
}

// Função para eliminar um utilizador
export async function deleteUser(req: Request, res: Response) {
  try {
    const { id } = req.params; // Extrai o id dos parâmetros da rota
    const collection = await getCollection<User>('users'); // Obtém a coleção 'users'
    
    // Elimina o utilizador pelo id
    const result = await collection.deleteOne({ id });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' }); // Se não encontrar, retorna 404
    }
    
    res.json({ message: 'Usuário excluído com sucesso' }); // Retorna mensagem de sucesso
  } catch (error) {
    console.error('Erro ao excluir usuário:', error); // Log de erro
    res.status(500).json({ error: 'Erro ao excluir usuário' }); // Retorna erro 500
  }
}

// -----------------------------------------------------------------------------
// Este ficheiro define o controlador de utilizadores para a API.
// Permite: listar, obter, criar, atualizar e eliminar utilizadores na base de dados.
// Cada função trata de um endpoint RESTful e faz validação básica e logging.
// O objetivo é centralizar toda a lógica de manipulação de utilizadores neste módulo. 