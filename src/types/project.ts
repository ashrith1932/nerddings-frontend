export type ProjectStage = string;

export type Project = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  stage?: ProjectStage;
  githubUrl?: string | null;
  github_url?: string | null;
  createdAt?: string | null;
  created_at?: string | null;
};
