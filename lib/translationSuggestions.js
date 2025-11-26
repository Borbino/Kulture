/**
 * Translation Suggestion MongoDB Schema and Operations
 */

import { MongoClient, ObjectId } from 'mongodb';
import { logger } from './logger.js';

let client = null;
let db = null;

/**
 * MongoDB 연결
 */
async function getMongoClient() {
  if (client && client.topology && client.topology.isConnected()) {
    return client;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  try {
    client = new MongoClient(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
    });

    await client.connect();
    db = client.db(process.env.MONGODB_DB_NAME || 'kulture');
    logger.info('MongoDB connected successfully');
    return client;
  } catch (error) {
    logger.error('MongoDB connection failed:', error.message);
    throw error;
  }
}

/**
 * 컬렉션 가져오기
 */
async function getCollection(collectionName) {
  await getMongoClient();
  return db.collection(collectionName);
}

/**
 * Translation Suggestion 스키마
 * {
 *   _id: ObjectId,
 *   originalText: string,
 *   suggestedTranslation: string,
 *   targetLang: string,
 *   sourceLang: string,
 *   context: string?,
 *   reason: string?,
 *   submitterEmail: string?,
 *   submitterIp: string,
 *   status: 'pending' | 'approved' | 'rejected',
 *   qualityScore: number?,
 *   reviewNote: string?,
 *   reviewedBy: string?,
 *   reviewedAt: Date?,
 *   createdAt: Date,
 *   updatedAt: Date
 * }
 */

/**
 * 새 번역 제안 생성
 */
export async function createTranslationSuggestion(data) {
  const collection = await getCollection('translation_suggestions');
  
  const suggestion = {
    originalText: data.originalText,
    suggestedTranslation: data.suggestedTranslation,
    targetLang: data.targetLang,
    sourceLang: data.sourceLang || 'auto',
    context: data.context || null,
    reason: data.reason || null,
    submitterEmail: data.submitterEmail || null,
    submitterIp: data.submitterIp,
    status: 'pending',
    qualityScore: data.qualityScore || null,
    reviewNote: null,
    reviewedBy: null,
    reviewedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await collection.insertOne(suggestion);
  logger.info('Translation suggestion created', { id: result.insertedId });
  
  return {
    ...suggestion,
    _id: result.insertedId,
  };
}

/**
 * 번역 제안 목록 조회
 */
export async function getTranslationSuggestions(filter = {}, options = {}) {
  const collection = await getCollection('translation_suggestions');
  
  const {
    status,
    targetLang,
    limit = 50,
    skip = 0,
    sort = { createdAt: -1 },
  } = options;

  const query = {};
  if (status) query.status = status;
  if (targetLang) query.targetLang = targetLang;
  if (filter) Object.assign(query, filter);

  const suggestions = await collection
    .find(query)
    .sort(sort)
    .limit(limit)
    .skip(skip)
    .toArray();

  const total = await collection.countDocuments(query);

  return { suggestions, total };
}

/**
 * 번역 제안 단건 조회
 */
export async function getTranslationSuggestion(id) {
  const collection = await getCollection('translation_suggestions');
  return await collection.findOne({ _id: new ObjectId(id) });
}

/**
 * 번역 제안 상태 업데이트
 */
export async function updateTranslationSuggestionStatus(id, status, reviewData = {}) {
  const collection = await getCollection('translation_suggestions');
  
  const update = {
    $set: {
      status,
      updatedAt: new Date(),
      ...(reviewData.reviewNote && { reviewNote: reviewData.reviewNote }),
      ...(reviewData.reviewedBy && { reviewedBy: reviewData.reviewedBy }),
      ...(status !== 'pending' && { reviewedAt: new Date() }),
    },
  };

  const result = await collection.updateOne({ _id: new ObjectId(id) }, update);
  
  if (result.modifiedCount === 0) {
    throw new Error('Translation suggestion not found or not modified');
  }

  logger.info('Translation suggestion status updated', { id, status });
  return await getTranslationSuggestion(id);
}

/**
 * 번역 제안 통계
 */
export async function getTranslationSuggestionStats() {
  const collection = await getCollection('translation_suggestions');
  
  const [totalCount, pendingCount, approvedCount, rejectedCount, byLanguage] = await Promise.all([
    collection.countDocuments(),
    collection.countDocuments({ status: 'pending' }),
    collection.countDocuments({ status: 'approved' }),
    collection.countDocuments({ status: 'rejected' }),
    collection.aggregate([
      { $group: { _id: '$targetLang', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]).toArray(),
  ]);

  return {
    total: totalCount,
    pending: pendingCount,
    approved: approvedCount,
    rejected: rejectedCount,
    byLanguage: byLanguage.map((item) => ({
      language: item._id,
      count: item.count,
    })),
  };
}

/**
 * 인덱스 생성 (초기 설정용)
 */
export async function createTranslationSuggestionIndexes() {
  const collection = await getCollection('translation_suggestions');
  
  await collection.createIndexes([
    { key: { status: 1, createdAt: -1 } },
    { key: { targetLang: 1 } },
    { key: { submitterEmail: 1 } },
    { key: { createdAt: -1 } },
  ]);

  logger.info('Translation suggestion indexes created');
}

/**
 * 연결 종료
 */
export async function closeMongoConnection() {
  if (client) {
    await client.close();
    logger.info('MongoDB connection closed');
  }
}
