/**
 * AI 콘텐츠 추천 시스템
 * - 개인화 추천 알고리즘
 * - 협업 필터링 (Collaborative Filtering)
 * - 콘텐츠 기반 필터링 (Content-Based Filtering)
 */

import { sanityClient } from './sanityClient';

/**
 * 사용자 행동 기반 관심사 추출
 */
export async function extractUserInterests(userId) {
  try {
    // 사용자가 좋아요한 게시글의 태그와 카테고리 수집
    const likedPosts = await sanityClient.fetch(
      `*[_type == "post" && $userId in likedBy[]._ref] {
        tags,
        categories[]->{slug, title}
      }`,
      { userId }
    );

    // 사용자가 작성한 게시글과 댓글의 태그/카테고리 수집
    const userPosts = await sanityClient.fetch(
      `*[_type == "post" && user._ref == $userId] {
        tags,
        categories[]->{slug, title}
      }`,
      { userId }
    );

    // 사용자가 자주 방문한 게시판
    const userComments = await sanityClient.fetch(
      `*[_type == "comment" && user._ref == $userId] {
        post->{board->{slug, name}}
      }`,
      { userId }
    );

    // 태그와 카테고리 빈도 계산
    const interests = {
      tags: {},
      categories: {},
      boards: {},
    };

    [...likedPosts, ...userPosts].forEach((post) => {
      post.tags?.forEach((tag) => {
        interests.tags[tag] = (interests.tags[tag] || 0) + 1;
      });
      post.categories?.forEach((cat) => {
        interests.categories[cat.slug.current] = (interests.categories[cat.slug.current] || 0) + 1;
      });
    });

    userComments.forEach((comment) => {
      const boardSlug = comment.post?.board?.slug?.current;
      if (boardSlug) {
        interests.boards[boardSlug] = (interests.boards[boardSlug] || 0) + 1;
      }
    });

    return interests;
  } catch (error) {
    console.error('Error extracting user interests:', error);
    return { tags: {}, categories: {}, boards: {} };
  }
}

/**
 * 개인화 추천 게시글 (협업 필터링 + 콘텐츠 기반)
 */
export async function getPersonalizedRecommendations(userId, limit = 10) {
  try {
    const interests = await extractUserInterests(userId);

    // 상위 관심 태그 추출
    const topTags = Object.entries(interests.tags)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag]) => tag);

    // 상위 관심 카테고리 추출
    const topCategories = Object.entries(interests.categories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat]) => cat);

    // 추천 게시글 쿼리
    let query = `*[_type == "post" && status == "approved" && isHidden != true`;

    // 이미 본 게시글 제외 (좋아요한 게시글)
    query += ` && !($userId in likedBy[]._ref)`;

    // 관심 태그 또는 카테고리와 일치하는 게시글
    if (topTags.length > 0) {
      query += ` && (`;
      topTags.forEach((tag, idx) => {
        if (idx > 0) query += ` || `;
        query += `$tag${idx} in tags[]`;
      });
      query += `)`;
    }

    query += `] | order(publishedAt desc, likes desc) [0...${limit}] {
      _id,
      title,
      slug,
      "excerpt": body[0...200],
      mainImage,
      tags,
      categories[]->{title, slug},
      board->{name, slug},
      author->{name},
      user->{name, level},
      publishedAt,
      views,
      likes,
      commentCount,
      "relevanceScore": select(
        count(tags[@ in [$topTags]]) * 3 +
        count(categories[]._ref in [$topCategories]) * 5 +
        likes * 0.1 +
        views * 0.01
      )
    } | order(relevanceScore desc)`;

    const params = { userId };
    topTags.forEach((tag, idx) => {
      params[`tag${idx}`] = tag;
    });
    params.topTags = topTags;
    params.topCategories = topCategories;

    const recommendations = await sanityClient.fetch(query, params);

    return recommendations;
  } catch (error) {
    console.error('Error getting personalized recommendations:', error);
    return [];
  }
}

/**
 * 유사 게시글 추천 (콘텐츠 기반 필터링)
 */
export async function getSimilarPosts(postId, limit = 5) {
  try {
    // 현재 게시글 정보 가져오기
    const currentPost = await sanityClient.fetch(
      `*[_type == "post" && _id == $postId][0] {
        tags,
        categories[]._ref,
        board._ref
      }`,
      { postId }
    );

    if (!currentPost) return [];

    // 유사 게시글 쿼리 (같은 태그, 같은 카테고리, 같은 게시판)
    const query = `*[_type == "post" && _id != $postId && status == "approved" && isHidden != true && (
      count(tags[@ in $tags]) > 0 ||
      count(categories[]._ref in $categories) > 0 ||
      board._ref == $boardRef
    )] | order(publishedAt desc) [0...${limit}] {
      _id,
      title,
      slug,
      mainImage,
      tags,
      categories[]->{title, slug},
      board->{name, slug},
      publishedAt,
      views,
      likes,
      commentCount,
      "similarityScore": (
        count(tags[@ in $tags]) * 3 +
        count(categories[]._ref in $categories) * 5 +
        select(board._ref == $boardRef => 2, 0)
      )
    } | order(similarityScore desc, publishedAt desc)`;

    const similarPosts = await sanityClient.fetch(query, {
      postId,
      tags: currentPost.tags || [],
      categories: currentPost.categories || [],
      boardRef: currentPost.board,
    });

    return similarPosts;
  } catch (error) {
    console.error('Error getting similar posts:', error);
    return [];
  }
}

/**
 * 트렌딩 게시글 (실시간 인기)
 */
export async function getTrendingPosts(timeRange = '24h', limit = 10) {
  try {
    const now = new Date();
    let timeFilter;

    switch (timeRange) {
      case '1h':
        timeFilter = new Date(now - 60 * 60 * 1000).toISOString();
        break;
      case '24h':
        timeFilter = new Date(now - 24 * 60 * 60 * 1000).toISOString();
        break;
      case '7d':
        timeFilter = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
        break;
      default:
        timeFilter = new Date(now - 24 * 60 * 60 * 1000).toISOString();
    }

    const query = `*[_type == "post" && status == "approved" && isHidden != true && publishedAt >= $timeFilter] | order(
      (likes * 10 + views * 1 + commentCount * 5) desc
    ) [0...${limit}] {
      _id,
      title,
      slug,
      mainImage,
      tags,
      categories[]->{title, slug},
      board->{name, slug},
      author->{name},
      user->{name, level},
      publishedAt,
      views,
      likes,
      commentCount,
      "trendScore": (likes * 10 + views * 1 + commentCount * 5)
    }`;

    const trendingPosts = await sanityClient.fetch(query, { timeFilter });

    return trendingPosts;
  } catch (error) {
    console.error('Error getting trending posts:', error);
    return [];
  }
}

/**
 * AI 기반 태그 추천 (간이 버전 - 실제로는 OpenAI API 사용 권장)
 */
export function suggestTags(title, content) {
  // 간단한 키워드 추출 (실제로는 OpenAI GPT API 사용 권장)
  const text = `${title} ${content}`.toLowerCase();
  const keywords = [];

  // K-Culture 관련 키워드
  const kCultureKeywords = {
    'k-pop': ['kpop', 'k-pop', '케이팝', '아이돌', 'idol'],
    'k-drama': ['kdrama', 'k-drama', '드라마', 'drama'],
    'k-movie': ['영화', 'movie', 'film'],
    'k-food': ['음식', '한식', 'food', 'korean food'],
    'k-beauty': ['뷰티', 'beauty', '화장품', 'cosmetics'],
    'k-fashion': ['패션', 'fashion', '스타일', 'style'],
  };

  Object.entries(kCultureKeywords).forEach(([tag, patterns]) => {
    if (patterns.some((pattern) => text.includes(pattern))) {
      keywords.push(tag);
    }
  });

  // 일반 키워드 (빈도 높은 단어 추출)
  const words = text.match(/\b\w{3,}\b/g) || [];
  const wordFreq = {};
  words.forEach((word) => {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  });

  const topWords = Object.entries(wordFreq)
    .filter(([word]) => !['the', 'and', 'for', 'with', 'that'].includes(word))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);

  return [...new Set([...keywords, ...topWords])].slice(0, 8);
}

/**
 * AI 기반 카테고리 추천
 */
export async function suggestCategories(title, content, tags = []) {
  try {
    // 모든 카테고리 가져오기
    const categories = await sanityClient.fetch(
      `*[_type == "category"] { _id, title, slug, description }`
    );

    // 간단한 텍스트 매칭 (실제로는 임베딩 벡터 유사도 사용 권장)
    const text = `${title} ${content} ${tags.join(' ')}`.toLowerCase();

    const scored = categories.map((cat) => {
      const catText = `${cat.title} ${cat.description || ''}`.toLowerCase();
      const words = catText.split(/\s+/);
      let score = 0;

      words.forEach((word) => {
        if (text.includes(word)) {
          score += 1;
        }
      });

      // 태그와 카테고리 제목 일치도
      tags.forEach((tag) => {
        if (cat.title.toLowerCase().includes(tag.toLowerCase())) {
          score += 5;
        }
      });

      return { ...cat, score };
    });

    return scored
      .filter((cat) => cat.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(({ _id, title, slug }) => ({ _id, title, slug }));
  } catch (error) {
    console.error('Error suggesting categories:', error);
    return [];
  }
}
