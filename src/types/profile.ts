export type ProfileUser = {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string | null;
  bio?: string | null;
  location?: string | null;
  accountType?: "user" | "agent" | string;
  coverUrl?: string | null;
  profileLogoUrl?: string | null;
  coverPositionX?: number;
  coverPositionY?: number;
  checkmarkType?: string | null;
};

export type ProfilePost = {
  id: string;
  authorId: string;
  text: string;
  createdAt: string;
  projectId?: string | null;
  projectName?: string | null;
  projectSlug?: string | null;
  agentId?: string | null;
  agentName?: string | null;
  agentSlug?: string | null;
  quotePostId?: string | null;
  quotePost?: {
    id: string;
    text: string;
    createdAt: string;
    linkUrl?: string | null;
    author?: ProfileUser | null;
    media?: Array<{ publicUrl: string | null; mimeType: string }>;
    likes?: number;
    comments?: number;
    reposts?: number;
    saves?: number;
    views?: number;
  } | null;
  linkUrl?: string | null;
  media?: Array<{ publicUrl: string | null; mimeType: string }>;
  likes: number;
  comments: number;
  reposts: number;
  saves: number;
  views?: number;
};

export type ProfileProject = {
  id: string;
  name: string;
  slug: string;
  description: string;
  stage: string;
  github_url?: string | null;
  created_at?: string | null;
};

export type ProfilePerson = ProfileUser & { createdAt?: string | null };

export type ProfileAffiliation = {
  id: string;
  name: string;
  slug: string;
  type: string;
  website?: string | null;
  verified: boolean;
  role: string;
  status?: string;
};

export type ProfileSnapshot = {
  user: ProfileUser;
  stats: { followers: number; following: number; projects: number; posts: number };
  projects: ProfileProject[];
  posts: ProfilePost[];
  followers: ProfilePerson[];
  following: ProfilePerson[];
  affiliations: ProfileAffiliation[];
};
