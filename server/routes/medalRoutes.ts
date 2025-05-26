import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';

const router = express.Router();
let mongoClient: MongoClient;

export function setMongoClient(client: MongoClient) {
  mongoClient = client;
}

// Listar todas as medalhas
router.get('/', async (req, res) => {
  try {
    const db = mongoClient.db();
    const medals = await db.collection('medals').find().toArray();
    res.json(medals);
  } catch (error) {
    console.error('Erro ao buscar medalhas:', error);
    res.status(500).json({ error: 'Erro ao buscar medalhas' });
  }
});

// Buscar medalhas de um usuário específico
router.get('/user/:userId', async (req, res) => {
  try {
    const db = mongoClient.db();
    const user = await db.collection('users').findOne({ 
      _id: new ObjectId(req.params.userId)
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const medals = await db.collection('medals')
      .find({
        _id: { $in: user.medals?.map(id => new ObjectId(id)) || [] }
      })
      .toArray();

    res.json(medals);
  } catch (error) {
    console.error('Erro ao buscar medalhas do usuário:', error);
    res.status(500).json({ error: 'Erro ao buscar medalhas do usuário' });
  }
});

// Atribuir medalha a um usuário
router.post('/award/:userId/:medalId', async (req, res) => {
  try {
    const db = mongoClient.db();
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(req.params.userId) },
      { 
        $addToSet: { 
          medals: new ObjectId(req.params.medalId),
          medalAcquisitions: {
            medalId: new ObjectId(req.params.medalId),
            acquiredDate: new Date()
          }
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({ message: 'Medalha atribuída com sucesso' });
  } catch (error) {
    console.error('Erro ao atribuir medalha:', error);
    res.status(500).json({ error: 'Erro ao atribuir medalha' });
  }
});

export const medalRoutes = router; 