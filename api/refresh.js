import { fetchPosts } from '../lib/moltbook.js';
import { getPosts, savePosts } from '../lib/db.js';

export default async function handler(req, res) {
  // Verify cron secret to prevent abuse
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('Starting Moltbook refresh...');

    // Fetch posts from Moltbook
    const moltbookPosts = await fetchPosts('hot', 100);

    // Get existing posts
    const existingPosts = await getPosts();
    const existingIds = new Set(existingPosts.map(p => p.id));

    // Merge posts: keep vote counts for existing posts
    const mergedPosts = moltbookPosts.map(mbPost => {
      const existing = existingPosts.find(p => p.id === mbPost.id);
      return {
        id: mbPost.id,
        title: mbPost.title,
        content: mbPost.content,
        author: mbPost.author,
        submolt: mbPost.submolt,
        url: mbPost.url || `https://moltbook.com/posts/${mbPost.id}`,
        upvotes: mbPost.upvotes || 0,
        downvotes: mbPost.downvotes || 0,
        created_at: mbPost.created_at,
        // Preserve curator votes
        votes: existing?.votes || 0,
        last_voted_at: existing?.last_voted_at || null,
        synced_at: new Date().toISOString()
      };
    });

    // Save merged posts
    await savePosts(mergedPosts);

    console.log(`Refreshed ${mergedPosts.length} posts from Moltbook`);

    res.status(200).json({
      success: true,
      message: 'Posts refreshed successfully',
      stats: {
        total: mergedPosts.length,
        new: moltbookPosts.filter(p => !existingIds.has(p.id)).length,
        with_votes: mergedPosts.filter(p => p.votes > 0).length
      }
    });
  } catch (err) {
    console.error('Refresh error:', err);
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
}
