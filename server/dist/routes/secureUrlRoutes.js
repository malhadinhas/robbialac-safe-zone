"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const secureUrlController_1 = require("../controllers/secureUrlController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// URL segura para download
router.get('/download', authMiddleware_1.isAuthenticated, secureUrlController_1.generateSecureDownloadUrl);
// URL segura para upload
router.post('/upload', authMiddleware_1.isAuthenticated, secureUrlController_1.generateSecureUploadUrl);
exports.default = router;
