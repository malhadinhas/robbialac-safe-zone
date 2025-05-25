"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const secureUrlController_1 = require("../controllers/secureUrlController");
const authMiddleware_1 = require("../middleware/authMiddleware"); // Proteger o endpoint
const router = (0, express_1.Router)();
// GET /api/secure-url?key=<objectKey>
// Retorna uma URL assinada para a chave R2 fornecida
router.get('/', authMiddleware_1.isAuthenticated, secureUrlController_1.generateSecureUrl);
exports.default = router;
