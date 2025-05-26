"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const medalController_1 = require("../controllers/medalController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// Obter todas as medalhas
router.get('/', authMiddleware_1.isAuthenticated, medalController_1.getAllMedals);
// Atribuir medalha a um utilizador
router.post('/assign/:userId/:medalId', authMiddleware_1.isAuthenticated, async (req, res) => {
    const { userId, medalId } = req.params;
    try {
        await (0, medalController_1.assignMedalToUser)(userId, medalId);
        res.status(200).json({ message: 'Medalha atribuída com sucesso.' });
    }
    catch (error) {
        res.status(500).json({ error: 'Erro ao atribuir medalha.' });
    }
});
exports.default = router;
