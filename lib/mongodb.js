/**
 * MongoDB Connection Utility
 * Handles database connections for translation management
 */

import { MongoClient } from 'mongodb';
import { logger } from './logger.js';

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URL;
const MONGODB_DB = process.env.MONGODB_DB || 'kulture';

if (!MONGODB_URI) {
  logger.warn('[MongoDB]', 'MongoDB URI not configured. Translation storage will not be available.');
}

let cachedClient = null;
let cachedDb = null;

export async function connectToDatabase() {
  if (!MONGODB_URI) {
    throw new Error('MongoDB URI is not configured');
  }

  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = await MongoClient.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const db = client.db(MONGODB_DB);

  cachedClient = client;
  cachedDb = db;

  // Create indexes
  await createIndexes(db);

  return { client, db };
}

async function createIndexes(db) {
  try {
    // Translations collection indexes
    await db.collection('translations').createIndex({ targetLanguage: 1, key: 1 });
    await db.collection('translations').createIndex({ status: 1 });
    await db.collection('translations').createIndex({ contributorId: 1 });
    await db.collection('translations').createIndex({ createdAt: -1 });
    await db.collection('translations').createIndex({ qualityScore: -1 });

    logger.info('[MongoDB]', 'Database indexes created successfully');
  } catch (error) {
    logger.error('[MongoDB]', `Failed to create indexes: ${error.message}`);
  }
}

export async function closeDatabase() {
  if (cachedClient) {
    await cachedClient.close();
    cachedClient = null;
    cachedDb = null;
  }
}
