"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIncidents = getIncidents;
exports.getIncidentById = getIncidentById;
exports.createIncident = createIncident;
exports.updateIncident = updateIncident;
exports.deleteIncident = deleteIncident;
exports.getIncidentsByDepartment = getIncidentsByDepartment;
exports.getRecentIncidents = getRecentIncidents;
const logger_1 = __importDefault(require("../utils/logger"));
const Incident_1 = __importDefault(require("../models/Incident"));
const mongoose_1 = require("mongoose");
async function getIncidents(req, res) {
    try {
        const statusFilter = req.query.status;
        let query = {};
        if (statusFilter === 'not_archived') {
            query = { status: { $ne: 'Arquivado' } };
        }
        else if (statusFilter === 'archived') {
            query = { status: 'Arquivado' };
        }
        const incidents = await Incident_1.default.find(query).lean();
        const formatted = incidents.map((incident) => ({
            ...incident,
            likes: (incident.likes || []).length,
            comments: (incident.comments || []).length
        }));
        res.json(formatted);
    }
    catch (error) {
        logger_1.default.error('Erro ao buscar incidentes:', error);
        res.status(500).json({ message: 'Erro interno ao buscar incidentes' });
    }
}
async function getIncidentById(req, res) {
    try {
        const id = req.params.id;
        if (!(0, mongoose_1.isValidObjectId)(id)) {
            res.status(400).json({ message: 'ID inválido' });
            return;
        }
        const incident = await Incident_1.default.findById(id).lean();
        if (!incident) {
            res.status(404).json({ message: 'Incidente não encontrado' });
            return;
        }
        const response = {
            ...incident,
            likes: (incident.likes || []).length,
            comments: (incident.comments || []).length
        };
        res.json(response);
    }
    catch (error) {
        logger_1.default.error('Erro ao buscar incidente por ID:', error);
        res.status(500).json({ message: 'Erro interno ao buscar incidente' });
    }
}
async function createIncident(req, res) {
    try {
        const { title, description, department, date } = req.body;
        if (!title || !department || !date) {
            res.status(400).json({ message: 'Campos obrigatórios em falta.' });
            return;
        }
        const newIncident = new Incident_1.default({
            title,
            description,
            department,
            date: new Date(date),
            status: 'Novo',
            likes: [],
            comments: []
        });
        await newIncident.save();
        res.status(201).json({ message: 'Incidente criado com sucesso', incident: newIncident });
    }
    catch (error) {
        logger_1.default.error('Erro ao criar incidente:', error);
        res.status(500).json({ message: 'Erro interno ao criar incidente' });
    }
}
async function updateIncident(req, res) {
    try {
        const id = req.params.id;
        if (!(0, mongoose_1.isValidObjectId)(id)) {
            res.status(400).json({ message: 'ID inválido' });
            return;
        }
        const updated = await Incident_1.default.findByIdAndUpdate(id, req.body, { new: true });
        if (!updated) {
            res.status(404).json({ message: 'Incidente não encontrado' });
            return;
        }
        res.json({ message: 'Incidente atualizado com sucesso', incident: updated });
    }
    catch (error) {
        logger_1.default.error('Erro ao atualizar incidente:', error);
        res.status(500).json({ message: 'Erro interno ao atualizar incidente' });
    }
}
async function deleteIncident(req, res) {
    try {
        const id = req.params.id;
        if (!(0, mongoose_1.isValidObjectId)(id)) {
            res.status(400).json({ message: 'ID inválido' });
            return;
        }
        const deleted = await Incident_1.default.findByIdAndDelete(id);
        if (!deleted) {
            res.status(404).json({ message: 'Incidente não encontrado' });
            return;
        }
        res.json({ message: 'Incidente removido com sucesso' });
    }
    catch (error) {
        logger_1.default.error('Erro ao deletar incidente:', error);
        res.status(500).json({ message: 'Erro interno ao deletar incidente' });
    }
}
async function getIncidentsByDepartment(req, res) {
    try {
        const { department, year } = req.query;
        const match = {};
        if (department)
            match.department = department;
        if (year) {
            const start = new Date(`${year}-01-01`);
            const end = new Date(`${year}-12-31`);
            match.date = { $gte: start, $lte: end };
        }
        const incidents = await Incident_1.default.find(match).lean();
        res.json(incidents);
    }
    catch (error) {
        logger_1.default.error('Erro ao buscar incidentes por departamento:', error);
        res.status(500).json({ message: 'Erro ao buscar incidentes' });
    }
}
async function getRecentIncidents(_req, res) {
    try {
        const recent = await Incident_1.default.find({})
            .sort({ date: -1 })
            .limit(10)
            .lean();
        res.json(recent);
    }
    catch (error) {
        logger_1.default.error('Erro ao buscar incidentes recentes:', error);
        res.status(500).json({ message: 'Erro ao buscar incidentes recentes' });
    }
}
