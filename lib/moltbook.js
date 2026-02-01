const MOLTBOOK_API_BASE = 'https://www.moltbook.com/api/v1';
const MOLTBOOK_API_KEY = process.env.MOLTBOOK_API_KEY || '';

export async function fetchPosts(sort = 'hot', limit = 50) {
  const response = await fetch(
    `${MOLTBOOK_API_BASE}/posts?sort=${sort}&limit=${limit}`,
    {
      headers: {
        'Authorization': `Bearer ${MOLTBOOK_API_KEY}`
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Moltbook API error: ${response.status}`);
  }

  const data = await response.json();
  return data.posts || [];
}

export async function fetchPost(postId) {
  const response = await fetch(
    `${MOLTBOOK_API_BASE}/posts/${postId}`,
    {
      headers: {
        'Authorization': `Bearer ${MOLTBOOK_API_KEY}`
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Moltbook API error: ${response.status}`);
  }

  return await response.json();
}

export async function searchMoltbook(query, limit = 20) {
  const response = await fetch(
    `${MOLTBOOK_API_BASE}/search?q=${encodeURIComponent(query)}&limit=${limit}`,
    {
      headers: {
        'Authorization': `Bearer ${MOLTBOOK_API_KEY}`
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Moltbook API error: ${response.status}`);
  }

  const data = await response.json();
  return data.results || [];
}
