"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose")); // Importa o mongoose e tipos auxiliares
// Definição do schema do Mongoose para Like
const LikeSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId, // Referência ao utilizador (User)
        ref: 'User', // Assume que existe um modelo User
        required: true
    },
    itemId: {
        type: mongoose_1.Schema.Types.ObjectId, // Referência ao item gostado
        required: true
    },
    itemType: {
        type: String,
        required: true,
        enum: ['qa', 'accident', 'sensibilizacao'] // Só permite estes tipos de item
    },
}, {
    timestamps: { createdAt: true, updatedAt: false } // Só guarda createdAt, não updatedAt
});
// Índice composto para garantir que um utilizador só possa gostar de um item uma vez
LikeSchema.index({ userId: 1, itemId: 1, itemType: 1 }, { unique: true });
// Índice para buscas rápidas por item
LikeSchema.index({ itemId: 1, itemType: 1 });
// Exporta o modelo Like, pronto a ser usado nos controladores e serviços
exports.default = mongoose_1.default.model('Like', LikeSchema);
// -----------------------------------------------------------------------------
// Este ficheiro define o modelo de dados (schema e interface) para likes (gostos) na base de dados MongoDB, usando o Mongoose.
// Permite guardar e consultar likes de forma tipada e validada.
// Garante unicidade (um utilizador só pode gostar de um item uma vez) e performance nas operações relacionadas a gostos na aplicação. 
