import { addSuggestion } from '../lib/db.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url, description, suggested_by } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'url is required'
      });
    }

    const suggestion = await addSuggestion(url, description, suggested_by);

    res.status(201).json({
      success: true,
      message: 'Suggestion added! 🦞',
      suggestion
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
}
