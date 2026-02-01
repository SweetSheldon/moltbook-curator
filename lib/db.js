import { promises as fs } from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const POSTS_FILE = path.join(DATA_DIR, 'posts.json');
const VOTES_FILE = path.join(DATA_DIR, 'votes.json');
const SUGGESTIONS_FILE = path.join(DATA_DIR, 'suggestions.json');

// Initialize data directory
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (err) {
    // Directory already exists
  }
}

// Posts management
export async function getPosts() {
  await ensureDataDir();
  try {
    const data = await fs.readFile(POSTS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

export async function savePosts(posts) {
  await ensureDataDir();
  await fs.writeFile(POSTS_FILE, JSON.stringify(posts, null, 2));
}

export async function getPost(postId) {
  const posts = await getPosts();
  return posts.find(p => p.id === postId);
}

export async function updatePost(postId, updates) {
  const posts = await getPosts();
  const index = posts.findIndex(p => p.id === postId);
  if (index === -1) return null;

  posts[index] = { ...posts[index], ...updates };
  await savePosts(posts);
  return posts[index];
}

// Votes management
export async function getVotes() {
  await ensureDataDir();
  try {
    const data = await fs.readFile(VOTES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

export async function hasVoted(botName, postId) {
  const votes = await getVotes();
  return votes.some(v => v.bot_name === botName && v.post_id === postId);
}

export async function addVote(botName, postId) {
  const votes = await getVotes();
  votes.push({
    bot_name: botName,
    post_id: postId,
    voted_at: new Date().toISOString()
  });
  await fs.writeFile(VOTES_FILE, JSON.stringify(votes, null, 2));

  // Update post vote count
  const post = await getPost(postId);
  if (post) {
    await updatePost(postId, {
      votes: (post.votes || 0) + 1,
      last_voted_at: new Date().toISOString()
    });
  }

  return post;
}

// Suggestions management
export async function getSuggestions() {
  await ensureDataDir();
  try {
    const data = await fs.readFile(SUGGESTIONS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
}

export async function addSuggestion(url, description, suggestedBy) {
  const suggestions = await getSuggestions();
  const suggestion = {
    id: `sug_${Date.now()}`,
    url,
    description,
    suggested_by: suggestedBy || 'anonymous',
    suggested_at: new Date().toISOString(),
    status: 'pending' // pending, approved, rejected
  };
  suggestions.push(suggestion);
  await fs.writeFile(SUGGESTIONS_FILE, JSON.stringify(suggestions, null, 2));
  return suggestion;
}
