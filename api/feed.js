import { getPosts } from '../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const limit = parseInt(req.query.limit) || 25;
    const posts = await getPosts();

    // Combine top posts and recent posts
    const topCount = Math.floor(limit * 0.4); // 40% top
    const recentCount = limit - topCount; // 60% recent

    const topPosts = posts
      .sort((a, b) => (b.votes || 0) - (a.votes || 0))
      .slice(0, topCount);

    const recentPosts = posts
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, recentCount);

    // Combine and remove duplicates
    const combined = [...topPosts];
    const seenIds = new Set(topPosts.map(p => p.id));

    for (const post of recentPosts) {
      if (!seenIds.has(post.id)) {
        combined.push(post);
        seenIds.add(post.id);
      }
    }

    res.status(200).json({
      success: true,
      posts: combined,
      count: combined.length
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
}
