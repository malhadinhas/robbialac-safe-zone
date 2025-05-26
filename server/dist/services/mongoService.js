"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setMongoClient = setMongoClient;
exports.getMongoClient = getMongoClient;
exports.getDb = getDb;
let mongoClient;
function setMongoClient(client) {
    mongoClient = client;
}
function getMongoClient() {
    if (!mongoClient) {
        throw new Error('MongoDB client não inicializado');
    }
    return mongoClient;
}
function getDb() {
    const client = getMongoClient();
    return client.db();
}
