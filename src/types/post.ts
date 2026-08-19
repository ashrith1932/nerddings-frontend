import type { ProfileUser } from "@/types/profile";

export type PostMedia = { publicUrl: string | null; mimeType: string };

export type QuotePost = {
  id: string;
  text: string;
  createdAt: string;
  linkUrl?: string | null;
  author?: ProfileUser | null;
  media?: PostMedia[];
  likes?: number;
  comments?: number;
  reposts?: number;
  saves?: number;
  views?: number;
};

export type Post = {
  id: string;
  authorId?: string;
  text: string;
  createdAt: string;
  projectId?: string | null;
  projectName?: string | null;
  projectSlug?: string | null;
  quotePostId?: string | null;
  quotePost?: QuotePost | null;
  linkUrl?: string | null;
  media?: PostMedia[];
  likes?: number;
  comments?: number;
  reposts?: number;
  saves?: number;
  views?: number;
};
