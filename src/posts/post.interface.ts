export interface Post {
  id: string;
  url: string;
  description: string;
  suggested_by: string;
  votes: number;
  created_at: string;
  last_voted_at?: string | null;
}
