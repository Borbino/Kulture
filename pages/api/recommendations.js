import { sanityClient } from '../../lib/sanityClient';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth/[...nextauth]';
import { getPersonalizedRecommendations, getSimilarPosts, getTrendingPosts } from '../../lib/aiRecommendation';
import { withErrorHandler } from '../../lib/apiErrorHandler';
import rateLimitMiddleware from '../../lib/rateLimiter';

/**
 * AI 추천 API
 * - GET: 개인화 추천, 유사 게시글, 트렌딩
 */

async function handler(req, res) {
  rateLimitMiddleware('api')(req, res, () => {});
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  const { type = 'personalized', postId, timeRange = '24h', limit = 10 } = req.query;

  try {
    let recommendations = [];

    switch (type) {
      case 'personalized':
        if (!session) {
          // 비로그인 사용자는 트렌딩 반환
          recommendations = await getTrendingPosts(timeRange, parseInt(limit));
        } else {
          // 로그인 사용자는 개인화 추천
          const userId = await sanityClient.fetch(
            `*[_type == "user" && email == $email][0]._id`,
            { email: session.user.email }
          );
          recommendations = await getPersonalizedRecommendations(userId, parseInt(limit));
        }
        break;

      case 'similar':
        if (!postId) {
          return res.status(400).json({ error: 'Post ID is required for similar posts' });
        }
        recommendations = await getSimilarPosts(postId, parseInt(limit));
        break;

      case 'trending':
        recommendations = await getTrendingPosts(timeRange, parseInt(limit));
        break;

      default:
        return res.status(400).json({ error: 'Invalid recommendation type' });
    }

    return res.status(200).json({
      type,
      recommendations,
      count: recommendations.length,
    });
  } catch (error) {
    console.error('Error getting recommendations:', error);
    return res.status(500).json({ error: 'Failed to get recommendations' });
  }
}

export default withErrorHandler(handler);
