import { MongoClient } from 'mongodb';

let mongoClient: MongoClient;

export function setMongoClient(client: MongoClient) {
  mongoClient = client;
}

export function getMongoClient() {
  if (!mongoClient) {
    throw new Error('MongoDB client não inicializado');
  }
  return mongoClient;
}

export function getDb() {
  const client = getMongoClient();
  return client.db();
} 