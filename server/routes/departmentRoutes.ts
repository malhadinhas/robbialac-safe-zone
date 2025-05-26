import express from 'express';
import { MongoClient } from 'mongodb';

const router = express.Router();
let mongoClient: MongoClient;

export function setMongoClient(client: MongoClient) {
  mongoClient = client;
}

// Listar todos os departamentos
router.get('/', async (req, res) => {
  try {
    const db = mongoClient.db();
    const departments = await db.collection('departments').find().toArray();
    res.json(departments);
  } catch (error) {
    console.error('Erro ao buscar departamentos:', error);
    res.status(500).json({ error: 'Erro ao buscar departamentos' });
  }
});

export const departmentRoutes = router; 