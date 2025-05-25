"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var database_1 = require("../services/database");
var logger_1 = require("../utils/logger");
var UserActivity = require('../models/UserActivity');
function seedUserActivities() {
    return __awaiter(this, void 0, void 0, function () {
        var activitiesCollection, count, users, allActivities, _i, users_1, user, videoActivities, incidentActivities, trainingActivities, result, _loop_1, _a, users_2, user, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 5, , 6]);
                    logger_1.default.info('Iniciando população de atividades de usuários...');
                    // Conectar ao banco de dados
                    return [4 /*yield*/, (0, database_1.connectToDatabase)()];
                case 1:
                    // Conectar ao banco de dados
                    _b.sent();
                    return [4 /*yield*/, UserActivity.find()];
                case 2:
                    activitiesCollection = _b.sent();
                    return [4 /*yield*/, activitiesCollection.countDocuments()];
                case 3:
                    count = _b.sent();
                    if (count > 0) {
                        logger_1.default.info("J\u00E1 existem ".concat(count, " atividades. Pulando seed."));
                        return [2 /*return*/];
                    }
                    users = [
                        { id: "user123", name: "João" },
                        { id: "user456", name: "Maria" },
                        { id: "user789", name: "Pedro" }
                    ];
                    allActivities = [];
                    for (_i = 0, users_1 = users; _i < users_1.length; _i++) {
                        user = users_1[_i];
                        videoActivities = [
                            {
                                userId: user.id,
                                category: "video",
                                activityId: "video-".concat(Date.now(), "-1"),
                                points: 50,
                                timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 dias atrás
                            },
                            {
                                userId: user.id,
                                category: "video",
                                activityId: "video-".concat(Date.now(), "-2"),
                                points: 50,
                                timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) // 6 dias atrás
                            },
                            {
                                userId: user.id,
                                category: "video",
                                activityId: "video-".concat(Date.now(), "-3"),
                                points: 50,
                                timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 dias atrás
                            }
                        ];
                        incidentActivities = [
                            {
                                userId: user.id,
                                category: "incident",
                                activityId: "incident-".concat(Date.now(), "-1"),
                                points: 75,
                                timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 dias atrás
                            },
                            {
                                userId: user.id,
                                category: "incident",
                                activityId: "incident-".concat(Date.now(), "-2"),
                                points: 100,
                                timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 dias atrás
                            }
                        ];
                        trainingActivities = [
                            {
                                userId: user.id,
                                category: "training",
                                activityId: "training-".concat(Date.now(), "-1"),
                                points: 75,
                                timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) // 4 dias atrás
                            }
                        ];
                        // Combinar todas as atividades para este usuário
                        allActivities.push.apply(allActivities, __spreadArray(__spreadArray(__spreadArray([], videoActivities, false), incidentActivities, false), trainingActivities, false));
                    }
                    return [4 /*yield*/, UserActivity.insertMany(allActivities)];
                case 4:
                    result = _b.sent();
                    logger_1.default.info("".concat(result.insertedCount, " atividades inseridas com sucesso para ").concat(users.length, " usu\u00E1rios"));
                    // Mostrar um resumo dos pontos por usuário e categoria
                    logger_1.default.info('Resumo dos pontos inseridos:');
                    _loop_1 = function (user) {
                        var userActivities = allActivities.filter(function (a) { return a.userId === user.id; });
                        var totalPoints = userActivities.reduce(function (sum, activity) { return sum + activity.points; }, 0);
                        var videoPoints = userActivities
                            .filter(function (a) { return a.category === 'video'; })
                            .reduce(function (sum, a) { return sum + a.points; }, 0);
                        var incidentPoints = userActivities
                            .filter(function (a) { return a.category === 'incident'; })
                            .reduce(function (sum, a) { return sum + a.points; }, 0);
                        var trainingPoints = userActivities
                            .filter(function (a) { return a.category === 'training'; })
                            .reduce(function (sum, a) { return sum + a.points; }, 0);
                        logger_1.default.info("Usu\u00E1rio ".concat(user.name, " (").concat(user.id, "): ").concat(totalPoints, " pontos totais"), {
                            video: videoPoints,
                            incident: incidentPoints,
                            training: trainingPoints
                        });
                    };
                    for (_a = 0, users_2 = users; _a < users_2.length; _a++) {
                        user = users_2[_a];
                        _loop_1(user);
                    }
                    return [3 /*break*/, 6];
                case 5:
                    error_1 = _b.sent();
                    logger_1.default.error('Erro ao popular atividades:', {
                        error: error_1 instanceof Error ? error_1.message : 'Erro desconhecido'
                    });
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    });
}
// Executar o script
seedUserActivities().then(function () {
    logger_1.default.info('Script de population completado');
    process.exit(0);
}).catch(function (error) {
    logger_1.default.error('Erro durante a execução do script:', {
        error: error instanceof Error ? error.message : 'Erro desconhecido'
    });
    process.exit(1);
});
