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
// Definição do schema do Mongoose para Accident
const AccidentSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true // Campo obrigatório
    },
    country: {
        type: String,
        required: true // Campo obrigatório
    },
    date: {
        type: Date,
        required: true // Campo obrigatório
    },
    pdfFile: {
        key: { type: String },
        originalName: { type: String },
        size: { type: Number },
        mimeType: { type: String }
    }
}, {
    timestamps: true // Isto adiciona automaticamente os campos createdAt e updatedAt
});
// Índices para melhorar a performance das consultas
AccidentSchema.index({ date: -1 }); // Índice descendente na data (para ordenar por data mais recente)
AccidentSchema.index({ country: 1 }); // Índice ascendente no país (para filtrar por país)
// Exporta o modelo Accident, pronto a ser usado nos controladores e serviços
exports.default = mongoose_1.default.model('Accident', AccidentSchema);
// -----------------------------------------------------------------------------
// Este ficheiro define o modelo de dados (schema e interface) para acidentes na base de dados MongoDB, usando o Mongoose.
// Permite guardar e consultar acidentes de forma tipada e validada.
// Garante consistência e performance nas operações relacionadas a acidentes na aplicação. 
