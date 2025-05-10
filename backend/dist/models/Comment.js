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
const mongoose_1 = __importStar(require("mongoose"));
// Definição do schema do Mongoose para Comment
const CommentSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId, // Referência ao utilizador (User)
        ref: 'User',
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    itemId: {
        type: mongoose_1.Schema.Types.ObjectId, // Referência ao item comentado
        required: true
    },
    itemType: {
        type: String,
        required: true,
        enum: ['qa', 'accident', 'sensibilizacao'] // Só permite estes tipos
    },
    text: {
        type: String,
        required: true,
        trim: true, // Remove espaços em branco no início/fim
        maxlength: 500 // Limita o tamanho do comentário
    }
}, {
    timestamps: { createdAt: true, updatedAt: false } // Só guarda createdAt, não updatedAt
});
// Índice para buscar comentários de um item rapidamente (por itemId, itemType e data)
CommentSchema.index({ itemId: 1, itemType: 1, createdAt: -1 });
// Exporta o modelo Comment, pronto a ser usado nos controladores e serviços
exports.default = mongoose_1.default.model('Comment', CommentSchema);
// -----------------------------------------------------------------------------
// Este ficheiro define o modelo de dados (schema e interface) para comentários na base de dados MongoDB, usando o Mongoose.
// Permite guardar e consultar comentários de forma tipada e validada.
// Garante consistência e performance nas operações relacionadas a comentários na aplicação. 
