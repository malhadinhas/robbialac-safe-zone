"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCategoryStats = exports.getZoneStatsById = exports.getZoneStats = void 0;
const ZoneStats_1 = __importDefault(require("../models/ZoneStats"));
const CategoryStats_1 = __importDefault(require("../models/CategoryStats"));
const logger_1 = __importDefault(require("../utils/logger"));
// Função para buscar estatísticas de todas as zonas
const getZoneStats = async (req, res) => {
    try {
        const stats = await ZoneStats_1.default.find().lean();
        const formattedStats = stats.map(zone => {
            if (!zone.stats.completionRate && zone.stats.totalVideos > 0) {
                zone.stats.completionRate = (zone.stats.videosWatched / zone.stats.totalVideos) * 100;
            }
            return zone;
        });
        logger_1.default.info('Estatísticas de zonas recuperadas com sucesso', { count: stats.length });
        res.json(formattedStats);
    }
    catch (error) {
        logger_1.default.error('Erro ao recuperar estatísticas de zonas', { error });
        res.status(500).json({ message: 'Erro ao recuperar estatísticas de zonas' });
    }
};
exports.getZoneStats = getZoneStats;
// Função para buscar estatísticas de uma zona específica
const getZoneStatsById = async (req, res) => {
    try {
        const { zoneId } = req.params;
        const zoneStats = await ZoneStats_1.default.findOne({ zoneId }).lean();
        if (!zoneStats) {
            logger_1.default.warn('Estatísticas da zona não encontradas', { zoneId });
            res.status(404).json({ message: 'Estatísticas da zona não encontradas' });
            return;
        }
        if (!zoneStats.stats.completionRate && zoneStats.stats.totalVideos > 0) {
            zoneStats.stats.completionRate = (zoneStats.stats.videosWatched / zoneStats.stats.totalVideos) * 100;
        }
        logger_1.default.info('Estatísticas da zona recuperadas com sucesso', { zoneId });
        res.json(zoneStats);
    }
    catch (error) {
        logger_1.default.error('Erro ao recuperar estatísticas da zona', { zoneId: req.params.zoneId, error });
        res.status(500).json({ message: 'Erro ao recuperar estatísticas da zona' });
    }
};
exports.getZoneStatsById = getZoneStatsById;
// Função para buscar estatísticas de todas as categorias
const getCategoryStats = async (req, res) => {
    try {
        const stats = await CategoryStats_1.default.find().lean();
        logger_1.default.info('Estatísticas de categorias recuperadas com sucesso', { count: stats.length });
        res.json(stats);
    }
    catch (error) {
        logger_1.default.error('Erro ao recuperar estatísticas de categorias', { error });
        res.status(500).json({ message: 'Erro ao recuperar estatísticas de categorias' });
    }
};
exports.getCategoryStats = getCategoryStats;
// -----------------------------------------------------------------------------
// Este ficheiro define o controlador de zonas e categorias para a API.
// Permite: obter estatísticas globais e detalhadas de zonas e categorias de vídeos.
// Cada função trata de um endpoint RESTful e faz logging e validação básica.
// O objetivo é centralizar toda a lógica de estatísticas de zonas e categorias neste módulo. 
