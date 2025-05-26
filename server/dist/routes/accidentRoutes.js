"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const accidentController_1 = require("../controllers/accidentController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const uploadMiddleware_1 = require("../middleware/uploadMiddleware");
const router = express_1.default.Router();
router.post('/', authMiddleware_1.isAuthenticated, (0, authMiddleware_1.hasRole)(['admin_qa', 'admin_app']), uploadMiddleware_1.upload.single('document'), accidentController_1.createAccident);
router.put('/:id', authMiddleware_1.isAuthenticated, (0, authMiddleware_1.hasRole)(['admin_qa', 'admin_app']), uploadMiddleware_1.upload.single('document'), accidentController_1.updateAccident);
exports.default = router;
