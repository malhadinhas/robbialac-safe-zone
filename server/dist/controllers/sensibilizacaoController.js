"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSensibilizacoes = exports.createSensibilizacao = void 0;
const Sensibilizacao_1 = __importDefault(require("../models/Sensibilizacao"));
const logger_1 = __importDefault(require("../utils/logger"));
const storage_1 = require("../services/storage");
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
const createSensibilizacao = async (req, res) => {
    try {
        logger_1.default.info('Criando novo documento de sensibilização:', req.body);
        if (!req.file) {
            res.status(400).json({ error: 'Arquivo PDF é obrigatório' });
            return;
        }
        const key = `sensibilizacao/${Date.now()}-${req.file.originalname}`;
        if (process.env.NODE_ENV === 'development') {
            logger_1.default.info('Modo de desenvolvimento - Salvando arquivo localmente');
            const tempDir = path_1.default.join(process.cwd(), 'storage', 'temp', 'sensibilizacao');
            await promises_1.default.mkdir(tempDir, { recursive: true });
            await promises_1.default.writeFile(path_1.default.join(tempDir, path_1.default.basename(key)), req.file.buffer);
        }
        else {
            await (0, storage_1.uploadToR2)(req.file.buffer, key, req.file.mimetype);
        }
        const sensibilizacaoData = {
            name: req.body.name,
            country: req.body.country,
            date: new Date(req.body.date),
            pdfFile: {
                key,
                originalName: req.file.originalname,
                size: req.file.size,
                mimeType: req.file.mimetype
            }
        };
        const sensibilizacao = new Sensibilizacao_1.default(sensibilizacaoData);
        await sensibilizacao.save();
        res.status(201).json(sensibilizacao);
    }
    catch (error) {
        logger_1.default.error('Erro ao criar sensibilização:', { error });
        res.status(500).json({ message: 'Erro interno ao criar documento' });
    }
};
exports.createSensibilizacao = createSensibilizacao;
const getSensibilizacoes = async (req, res) => {
    try {
        const aggregationPipeline = [];
        if (req.query.country) {
            aggregationPipeline.push({
                $match: { country: req.query.country }
            });
        }
        if (req.query.startDate && req.query.endDate) {
            aggregationPipeline.push({
                $match: {
                    date: {
                        $gte: new Date(req.query.startDate),
                        $lte: new Date(req.query.endDate)
                    }
                }
            });
        }
        aggregationPipeline.push({ $sort: { date: -1 } });
        const sensibilizacoes = await Sensibilizacao_1.default.aggregate(aggregationPipeline);
        res.json(sensibilizacoes);
    }
    catch (error) {
        logger_1.default.error('Erro ao buscar sensibilizações:', { error });
        res.status(500).json({ message: 'Erro ao buscar documentos' });
    }
};
exports.getSensibilizacoes = getSensibilizacoes;
