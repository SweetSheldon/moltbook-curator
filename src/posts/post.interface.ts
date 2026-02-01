export interface Post {
  id: string;
  title: string;
  content: string;
  author: {
    name: string;
  };
  submolt: {
    name: string;
    display_name: string;
  };
  url: string;
  upvotes: number;
  downvotes: number;
  votes?: number; // curator votes
  created_at: string;
  last_voted_at?: string | null;
  synced_at: string;
}
