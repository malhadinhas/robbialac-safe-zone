import express from 'express';
import { ObjectId } from 'mongodb';
import User from '../models/User';
import Medal from '../models/Medal';

const router = express.Router();

router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'Utilizador não encontrado.' });
    }

    const userMedals = await Medal.find({
      _id: { $in: user.medals?.map((id: string) => new ObjectId(id)) || [] }
    });

    res.json(userMedals);
  } catch (error) {
    res.status(500).json({ message: 'Erro ao obter medalhas do utilizador.', error });
  }
});

router.post('/award/:userId/:medalId', async (req, res) => {
  try {
    const { userId, medalId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'Utilizador não encontrado.' });
    }

    const alreadyAwarded = user.medals?.some((id: string) => id === medalId);

    if (alreadyAwarded) {
      return res.status(400).json({ message: 'Utilizador já tem esta medalha.' });
    }

    user.medals = [...(user.medals || []), medalId];
    await user.save();

    res.status(200).json({ message: 'Medalha atribuída com sucesso.' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atribuir medalha.', error });
  }
});

export default router;
