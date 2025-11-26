/**
 * Authentication and Authorization Helpers
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '../pages/api/auth/[...nextauth]';

/**
 * Verify user authentication
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Promise<Object>} User session
 */
export async function verifyAuth(req, res) {
  const session = await getServerSession(req, res, authOptions);
  
  if (!session || !session.user) {
    throw new Error('Unauthorized');
  }
  
  return session.user;
}

/**
 * Check if user is admin
 * @param {Object} user - User object
 * @returns {boolean}
 */
export function isAdmin(user) {
  // Check admin role or specific admin emails
  const adminEmails = process.env.ADMIN_EMAILS?.split(',') || [];
  return user.role === 'admin' || adminEmails.includes(user.email);
}

/**
 * Verify admin authorization
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @returns {Promise<Object>} User session
 */
export async function verifyAdmin(req, res) {
  const user = await verifyAuth(req, res);
  
  if (!isAdmin(user)) {
    throw new Error('Forbidden: Admin access required');
  }
  
  return user;
}

export default {
  verifyAuth,
  isAdmin,
  verifyAdmin,
};
