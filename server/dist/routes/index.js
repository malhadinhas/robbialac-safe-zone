"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authRoutes_1 = __importDefault(require("./authRoutes"));
const users_1 = __importDefault(require("./users"));
const videos_1 = __importDefault(require("./videos"));
const zones_1 = __importDefault(require("./zones"));
const activityRoutes_1 = __importDefault(require("./activityRoutes"));
const incidents_1 = __importDefault(require("./incidents"));
const system_1 = __importDefault(require("./system"));
const uploads_1 = __importDefault(require("./uploads"));
const secureUrlRoutes_1 = __importDefault(require("./secureUrlRoutes"));
const sensibilizacaoRoutes_1 = __importDefault(require("./sensibilizacaoRoutes"));
const statsRoutes_1 = __importDefault(require("./statsRoutes"));
const departments_1 = __importDefault(require("./departments"));
const interactionRoutes_1 = __importDefault(require("./interactionRoutes"));
const medals_1 = __importDefault(require("./medals"));
const analyticsRoutes_1 = __importDefault(require("./analyticsRoutes"));
const accidentRoutes_1 = __importDefault(require("./accidentRoutes"));
const router = (0, express_1.Router)();
router.use('/auth', authRoutes_1.default);
router.use('/users', users_1.default);
router.use('/videos', videos_1.default);
router.use('/zones', zones_1.default);
router.use('/activities', activityRoutes_1.default);
router.use('/incidents', incidents_1.default);
router.use('/system', system_1.default);
router.use('/uploads', uploads_1.default);
router.use('/secure-url', secureUrlRoutes_1.default);
router.use('/sensibilizacao', sensibilizacaoRoutes_1.default);
router.use('/stats', statsRoutes_1.default);
router.use('/departments', departments_1.default);
router.use('/interactions', interactionRoutes_1.default);
router.use('/medals', medals_1.default);
router.use('/analytics', analyticsRoutes_1.default);
router.use('/accidents', accidentRoutes_1.default);
exports.default = router;
