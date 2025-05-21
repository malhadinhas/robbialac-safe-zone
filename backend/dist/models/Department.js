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
// Definição do schema do Mongoose para Department
const DepartmentSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: true, // Campo obrigatório
        unique: true // Nome do departamento deve ser único
    },
    description: {
        type: String // Campo opcional
    },
    active: {
        type: Boolean,
        default: true // Por padrão, o departamento é criado como ativo
    }
}, {
    timestamps: true // Isto adiciona automaticamente os campos createdAt e updatedAt
});
// Índices para melhorar a performance das consultas
DepartmentSchema.index({ name: 1 }); // Índice ascendente no nome (para buscas rápidas por nome)
DepartmentSchema.index({ active: 1 }); // Índice ascendente no estado ativo (para filtrar ativos/inativos)
// Exporta o modelo Department, pronto a ser usado nos controladores e serviços
exports.default = mongoose_1.default.model('Department', DepartmentSchema);
// -----------------------------------------------------------------------------
// Este ficheiro define o modelo de dados (schema e interface) para departamentos na base de dados MongoDB, usando o Mongoose.
// Permite guardar e consultar departamentos de forma tipada e validada.
// Garante unicidade do nome, datas automáticas e performance nas operações relacionadas a departamentos na aplicação. 
