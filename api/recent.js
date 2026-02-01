import { getPosts } from '../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const limit = parseInt(req.query.limit) || 20;
    const posts = await getPosts();

    // Sort by created_at descending
    const recentPosts = posts
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, limit);

    res.status(200).json({
      success: true,
      posts: recentPosts,
      count: recentPosts.length
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
}
