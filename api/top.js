import { getPosts } from '../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const limit = parseInt(req.query.limit) || 10;
    const posts = await getPosts();

    // Sort by votes descending
    const topPosts = posts
      .sort((a, b) => (b.votes || 0) - (a.votes || 0))
      .slice(0, limit);

    res.status(200).json({
      success: true,
      posts: topPosts,
      count: topPosts.length
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
}
