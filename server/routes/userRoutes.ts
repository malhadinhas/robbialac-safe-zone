import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import bcrypt from 'bcrypt';

const router = express.Router();
let mongoClient: MongoClient;

export function setMongoClient(client: MongoClient) {
  mongoClient = client;
}

// Login do usuário
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await mongoClient
      .db()
      .collection('users')
      .findOne({ email });

    if (!user) {
      return res.status(401).json({ error: 'Usuário não encontrado' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Senha incorreta' });
    }

    // Remove o campo password antes de enviar
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

// Buscar usuário por email
router.get('/:email', async (req, res) => {
  try {
    const user = await mongoClient
      .db()
      .collection('users')
      .findOne({ email: req.params.email });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Remove o campo password antes de enviar
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ error: 'Erro ao buscar usuário' });
  }
});

// Criar novo usuário
router.post('/', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    // Verifica se já existe um usuário com este email
    const existingUser = await mongoClient
      .db()
      .collection('users')
      .findOne({ email });

    if (existingUser) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    // Criptografa a senha
    const hashedPassword = await bcrypt.hash(password, 10);

    // Cria o novo usuário
    const result = await mongoClient
      .db()
      .collection('users')
      .insertOne({
        email,
        password: hashedPassword,
        name,
        role,
        createdAt: new Date()
      });

    const newUser = {
      _id: result.insertedId,
      email,
      name,
      role,
      createdAt: new Date()
    };

    res.status(201).json(newUser);
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
});

// Atualizar usuário
router.put('/:id', async (req, res) => {
  try {
    const { name, role, password } = req.body;
    const updateData: any = { name, role };

    // Se uma nova senha foi fornecida, criptografa ela
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const result = await mongoClient
      .db()
      .collection('users')
      .updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: updateData }
      );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    res.status(500).json({ error: 'Erro ao atualizar usuário' });
  }
});

// Deletar usuário
router.delete('/:id', async (req, res) => {
  try {
    const result = await mongoClient
      .db()
      .collection('users')
      .deleteOne({ _id: new ObjectId(req.params.id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar usuário:', error);
    res.status(500).json({ error: 'Erro ao deletar usuário' });
  }
});

export { router as userRoutes }; 