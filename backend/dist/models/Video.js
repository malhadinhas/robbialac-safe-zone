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
// Definição do schema do Mongoose para Video
const VideoSchema = new mongoose_1.Schema({
    videoId: {
        type: String,
        required: true,
        unique: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    r2VideoKey: {
        type: String,
        required: true
    },
    r2ThumbnailKey: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: ['Segurança', 'Qualidade', 'Procedimentos e Regras', 'Treinamento', 'Equipamentos', 'Outros', 'Procedimentos']
    },
    zone: {
        type: String,
        required: false
    },
    duration: {
        type: Number,
        required: false
    },
    views: {
        type: Number,
        default: 0
    },
    uploadDate: {
        type: Date,
        default: Date.now
    },
    r2Qualities: {
        high: String,
        medium: String,
        low: String
    },
    status: {
        type: String,
        enum: ['processing', 'ready', 'error'],
        default: 'processing'
    },
    processingError: {
        type: String
    }
}, {
    timestamps: true // Adiciona automaticamente createdAt e updatedAt
});
// Índices para melhorar a performance das consultas
VideoSchema.index({ category: 1 }); // Para buscas por categoria
VideoSchema.index({ views: -1 }); // Para ordenar por visualizações
VideoSchema.index({ uploadDate: -1 }); // Para ordenar por data de upload
VideoSchema.index({ videoId: 1 }, { unique: true }); // Garante unicidade do videoId
// Middleware para garantir que o documento nunca tenha id null
VideoSchema.pre('save', function (next) {
    // Atualiza updatedAt
    if (this.isModified()) {
        this.updatedAt = new Date();
    }
    // Garante que o id não seja nulo
    if (this.id === null || this.id === undefined) {
        this.id = this._id;
    }
    next();
});
// Método estático para buscar vídeos por categoria
VideoSchema.statics.findByCategory = function (category) {
    return this.find({ category });
};
// Método estático para buscar vídeos por zona
VideoSchema.statics.findByZone = function (zone) {
    return this.find({ zone });
};
// Método de instância para incrementar visualizações
VideoSchema.methods.incrementViews = function () {
    this.views += 1;
    return this.save();
};
// Criar e exportar o modelo
const Video = mongoose_1.default.model('Video', VideoSchema);
exports.default = Video;
// -----------------------------------------------------------------------------
// Este ficheiro define o modelo de dados (schema e interface) para vídeos na base de dados MongoDB, usando o Mongoose.
// Permite guardar e consultar vídeos de forma tipada e validada.
// Garante consistência, performance e funcionalidades extra (como métodos utilitários) nas operações relacionadas a vídeos na aplicação. 
