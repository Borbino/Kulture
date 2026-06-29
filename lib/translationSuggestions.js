/**
 * Translation Suggestion Operations
 * TODO: Migrate to Supabase — MongoDB dependency removed
 */

import { logger } from './logger.js';

export async function createTranslationSuggestion(data) {
  logger.info('[TranslationSuggestions]', 'createTranslationSuggestion called (stub)');
  return { ...data, _id: null, status: 'pending', createdAt: new Date(), updatedAt: new Date() };
}

export async function getTranslationSuggestions(_filter = {}, _options = {}) {
  logger.info('[TranslationSuggestions]', 'getTranslationSuggestions called (stub)');
  return { suggestions: [], total: 0 };
}

export async function getTranslationSuggestion(_id) {
  logger.info('[TranslationSuggestions]', 'getTranslationSuggestion called (stub)');
  return null;
}

export async function updateTranslationSuggestionStatus(_id, _status, _reviewData = {}) {
  logger.info('[TranslationSuggestions]', 'updateTranslationSuggestionStatus called (stub)');
  return null;
}

export async function getTranslationSuggestionStats() {
  logger.info('[TranslationSuggestions]', 'getTranslationSuggestionStats called (stub)');
  return { total: 0, pending: 0, approved: 0, rejected: 0, byLanguage: [] };
}

export async function createTranslationSuggestionIndexes() {
  logger.info('[TranslationSuggestions]', 'createTranslationSuggestionIndexes called (stub)');
}

export async function closeMongoConnection() {
  // no-op: MongoDB removed
}
