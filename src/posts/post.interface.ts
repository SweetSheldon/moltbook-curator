export interface Project {
  id: string;
  url: string;
  description: string;
  submitted_by: string;
  votes: number;
  created_at: string;
  last_voted_at?: string | null;
}

// Alias for backward compatibility
export type Post = Project;
