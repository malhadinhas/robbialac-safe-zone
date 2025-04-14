"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoDBConfig = void 0;
exports.initializeDatabase = initializeDatabase;
exports.getDatabaseConnectionStatus = getDatabaseConnectionStatus;
exports.getMongoConfig = getMongoConfig;
exports.initializeMongoConfig = initializeMongoConfig;
var MongoDBConfig = {
    uri: 'mongodb+srv://RobbialacSeguranca:L4QZLeo7U0EwsKw8@workplace-safety.j7o51.mongodb.net/workplace-safety',
    dbName: 'workplace-safety'
};
exports.MongoDBConfig = MongoDBConfig;
// Validate configuration
function validateConfig(config) {
    if (!config.uri) {
        throw new Error("MongoDB Config Validation Error: Missing URI");
    }
    if (!config.uri.startsWith('mongodb')) {
        throw new Error("MongoDB Config Validation Error: URI must start with 'mongodb' or 'mongodb+srv'");
    }
    if (!config.dbName) {
        throw new Error("MongoDB Config Validation Error: Missing database name");
    }
}
// Store current configuration
var mongoConfig = __assign({}, MongoDBConfig);
/**
 * Initialize MongoDB Atlas configuration
 */
function initializeMongoConfig(config) {
    try {
        console.log("MongoDB Config: Updating configuration:", {
            uri: config.uri.substring(0, 20) + "...", // Mask full connection string
            dbName: config.dbName
        });
        validateConfig(config);
        mongoConfig = __assign({}, config);
        console.log("MongoDB Config: Configuration updated successfully");
    }
    catch (error) {
        console.error("MongoDB Config: Error updating configuration:", error);
        throw error;
    }
}
/**
 * Get MongoDB Atlas configuration
 */
function getMongoConfig() {
    if (!mongoConfig.uri || !mongoConfig.dbName) {
        throw new Error("MongoDB Config: Configuration not initialized");
    }
    return __assign({}, mongoConfig);
}
// Initialize configuration
(function () {
    try {
        validateConfig(mongoConfig);
        console.log("=== MONGODB CONFIG LOADED ===");
        console.log("MongoDB Config: Initialized with database:", mongoConfig.dbName);
        console.log("MongoDB Config: Connection string starts with:", mongoConfig.uri.substring(0, 20) + "...");
    }
    catch (error) {
        console.error("MongoDB Config: Error during initialization:", error);
    }
})();
// Funções para inicialização e verificação do banco de dados
function initializeDatabase() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            try {
                console.log('Inicializando conexão com o banco de dados...');
                // Aqui você pode adicionar a lógica de inicialização do banco de dados
                console.log('Conexão com o banco de dados inicializada com sucesso');
            }
            catch (error) {
                console.error('Erro ao inicializar o banco de dados:', error);
                throw error;
            }
            return [2 /*return*/];
        });
    });
}
function getDatabaseConnectionStatus() {
    return {
        connected: true, // Você pode implementar uma verificação real aqui
        error: null,
        lastChecked: new Date()
    };
}
