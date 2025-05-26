"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getZoneStatsById = exports.getZoneStats = void 0;
const ZoneStats_1 = __importDefault(require("../models/ZoneStats"));
const logger_1 = __importDefault(require("../utils/logger"));
// Função para buscar estatísticas de todas as zonas
const getZoneStats = async (req, res) => {
    try {
        const statsRaw = await ZoneStats_1.default.find().lean();
        const stats = statsRaw.map((zone) => ({
            zoneId: zone.zoneId,
            zoneName: zone.zoneName,
            stats: zone.stats
        }));
        const formattedStats = stats.map(zone => {
            if (zone.stats && !zone.stats.completionRate && zone.stats.totalVideos > 0) {
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
        const { id } = req.params;
        const zone = await ZoneStats_1.default.findOne({ zoneId: id }).lean();
        if (!zone) {
            return res.status(404).json({ message: 'Zona não encontrada' });
        }
        if (!zone.stats.completionRate && zone.stats.totalVideos > 0) {
            zone.stats.completionRate = (zone.stats.videosWatched / zone.stats.totalVideos) * 100;
        }
        res.json(zone);
    }
    catch (error) {
        logger_1.default.error('Erro ao recuperar estatísticas da zona', { error });
        res.status(500).json({ message: 'Erro ao recuperar estatísticas da zona' });
    }
};
exports.getZoneStatsById = getZoneStatsById;
