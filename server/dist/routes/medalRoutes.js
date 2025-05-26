"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongodb_1 = require("mongodb");
const User_1 = __importDefault(require("../models/User"));
const Medal_1 = __importDefault(require("../models/Medal"));
const router = express_1.default.Router();
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Utilizador não encontrado.' });
        }
        const userMedals = await Medal_1.default.find({
            _id: { $in: user.medals?.map((id) => new mongodb_1.ObjectId(id)) || [] }
        });
        res.json(userMedals);
    }
    catch (error) {
        res.status(500).json({ message: 'Erro ao obter medalhas do utilizador.', error });
    }
});
router.post('/award/:userId/:medalId', async (req, res) => {
    try {
        const { userId, medalId } = req.params;
        const user = await User_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'Utilizador não encontrado.' });
        }
        const alreadyAwarded = user.medals?.some((id) => id === medalId);
        if (alreadyAwarded) {
            return res.status(400).json({ message: 'Utilizador já tem esta medalha.' });
        }
        user.medals = [...(user.medals || []), medalId];
        await user.save();
        res.status(200).json({ message: 'Medalha atribuída com sucesso.' });
    }
    catch (error) {
        res.status(500).json({ message: 'Erro ao atribuir medalha.', error });
    }
});
exports.default = router;
