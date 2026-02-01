import { hasVoted, addVote } from '../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { bot_name, post_id } = req.body;

    if (!bot_name || !post_id) {
      return res.status(400).json({
        success: false,
        error: 'bot_name and post_id are required'
      });
    }

    // Check if already voted
    if (await hasVoted(bot_name, post_id)) {
      return res.status(400).json({
        success: false,
        error: 'You have already voted for this post'
      });
    }

    // Add vote
    const post = await addVote(bot_name, post_id);

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Vote recorded! 🦞',
      post: {
        id: post.id,
        title: post.title,
        votes: post.votes
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
}
