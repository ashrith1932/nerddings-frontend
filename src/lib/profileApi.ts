import { apiFetch, getSavedUser } from "@/lib/api";

export type ProfileUser = {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string | null;
  bio?: string | null;
  location?: string | null;
  accountType?: "user" | "agent" | string;
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

type ApiEnvelope<T> = { data?: T | null };

const inflightProfiles = new Map<string, Promise<ProfileSnapshot>>();

function numberValue(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeUser(value: any): ProfileUser | null {
  if (!value || typeof value !== "object" || typeof value.id !== "string" || typeof value.username !== "string") return null;
  return {
    id: value.id,
    name: typeof value.name === "string" ? value.name : value.username,
    username: value.username,
    avatarUrl: value.avatarUrl ?? null,
    bio: value.bio ?? null,
    location: value.location ?? null,
    accountType: value.accountType ?? "user",
  };
}

function normalizePost(value: any): ProfilePost | null {
  if (!value || typeof value !== "object" || typeof value.id !== "string") return null;
  const quote = value.quotePost && typeof value.quotePost === "object" && typeof value.quotePost.id === "string"
    ? {
        ...value.quotePost,
        author: normalizeUser(value.quotePost.author),
        likes: numberValue(value.quotePost.likes),
        comments: numberValue(value.quotePost.comments),
        reposts: numberValue(value.quotePost.reposts),
        saves: numberValue(value.quotePost.saves),
        views: numberValue(value.quotePost.views),
        media: Array.isArray(value.quotePost.media) ? value.quotePost.media.filter(Boolean) : [],
      }
    : null;
  return {
    id: value.id,
    authorId: typeof value.authorId === "string" ? value.authorId : "",
    text: typeof value.text === "string" ? value.text : "",
    createdAt: typeof value.createdAt === "string" ? value.createdAt : new Date().toISOString(),
    projectId: value.projectId ?? null,
    projectName: value.projectName ?? null,
    projectSlug: value.projectSlug ?? null,
    agentId: value.agentId ?? null,
    agentName: value.agentName ?? null,
    agentSlug: value.agentSlug ?? null,
    quotePostId: value.quotePostId ?? null,
    quotePost: quote && quote.author ? quote : null,
    linkUrl: value.linkUrl ?? null,
    media: Array.isArray(value.media) ? value.media.filter(Boolean) : [],
    likes: numberValue(value.likes),
    comments: numberValue(value.comments),
    reposts: numberValue(value.reposts),
    saves: numberValue(value.saves),
    views: numberValue(value.views),
  };
}

function normalizeProject(value: any): ProfileProject | null {
  if (!value || typeof value !== "object" || typeof value.id !== "string") return null;
  return {
    id: value.id,
    name: typeof value.name === "string" ? value.name : "Untitled project",
    slug: typeof value.slug === "string" ? value.slug : value.id,
    description: typeof value.description === "string" ? value.description : "",
    stage: typeof value.stage === "string" ? value.stage : "Project",
    github_url: value.github_url ?? null,
    created_at: value.created_at ?? null,
  };
}

function normalizePerson(value: any): ProfilePerson | null {
  const user = normalizeUser(value);
  return user ? { ...user, createdAt: value.createdAt ?? value.created_at ?? null } : null;
}

function normalizeAffiliation(value: any): ProfileAffiliation | null {
  if (!value || typeof value !== "object" || typeof value.id !== "string") return null;
  return {
    id: value.id,
    name: typeof value.name === "string" ? value.name : "Affiliation",
    slug: typeof value.slug === "string" ? value.slug : value.id,
    type: typeof value.type === "string" ? value.type : "Agent",
    website: value.website ?? null,
    verified: Boolean(value.verified),
    role: typeof value.role === "string" ? value.role : "Member",
    status: value.status ?? "accepted",
  };
}

export async function getProfileSnapshot(username: string): Promise<ProfileSnapshot> {
  const key = username.trim().toLowerCase();
  const existing = inflightProfiles.get(key);
  if (existing) return existing;

  const request = (async () => {
    const response = await apiFetch<ApiEnvelope<any>>(`/social/users/${encodeURIComponent(username)}/profile-live`);
    const data = response?.data;
    const user = normalizeUser(data?.user);
    if (!user) throw new Error("Profile response is missing a valid user.");

    return {
      user,
      stats: {
        followers: numberValue(data?.stats?.followers),
        following: numberValue(data?.stats?.following),
        projects: numberValue(data?.stats?.projects),
        posts: numberValue(data?.stats?.posts),
      },
      projects: Array.isArray(data?.projects) ? data.projects.map(normalizeProject).filter(Boolean) as ProfileProject[] : [],
      posts: Array.isArray(data?.posts) ? data.posts.map(normalizePost).filter(Boolean) as ProfilePost[] : [],
      followers: Array.isArray(data?.followers) ? data.followers.map(normalizePerson).filter(Boolean) as ProfilePerson[] : [],
      following: Array.isArray(data?.following) ? data.following.map(normalizePerson).filter(Boolean) as ProfilePerson[] : [],
      affiliations: Array.isArray(data?.affiliations) ? data.affiliations.map(normalizeAffiliation).filter(Boolean) as ProfileAffiliation[] : [],
    };
  })().finally(() => inflightProfiles.delete(key));

  inflightProfiles.set(key, request);
  return request;
}

export async function getProfilePost(postId: string) {
  const response = await apiFetch<ApiEnvelope<any>>(`/social/posts/${encodeURIComponent(postId)}`);
  if (!response?.data || typeof response.data.id !== "string") throw new Error("Post response is invalid.");
  return response.data;
}

export async function toggleProfileLike(postId: string) {
  const response = await apiFetch<{ data?: { active?: boolean; count?: number; counts?: { likes?: number } } | null }>(`/posts/${encodeURIComponent(postId)}/like`, { method: "POST" });
  return { active: Boolean(response?.data?.active), count: numberValue(response?.data?.count ?? response?.data?.counts?.likes) };
}

export async function toggleProfileSave(postId: string) {
  const response = await apiFetch<{ data?: { active?: boolean; count?: number; counts?: { saves?: number } } | null }>(`/posts/${encodeURIComponent(postId)}/save`, { method: "POST" });
  return { active: Boolean(response?.data?.active), count: numberValue(response?.data?.count ?? response?.data?.counts?.saves) };
}

export async function amplifyProfilePost(postId: string) {
  const response = await apiFetch<{ data?: { active?: boolean; count?: number } | null }>(`/social/posts/${encodeURIComponent(postId)}/repost`, { method: "POST" });
  return { active: true, count: numberValue(response?.data?.count) };
}

export async function getProfileFollowing(userId: string) {
  const response = await apiFetch<{ data?: { active?: boolean } | null }>(`/users/${encodeURIComponent(userId)}/following`);
  return Boolean(response?.data?.active);
}

export async function toggleProfileFollowing(userId: string) {
  const response = await apiFetch<{ data?: { active?: boolean } | null }>(`/users/${encodeURIComponent(userId)}/follow`, { method: "POST" });
  return Boolean(response?.data?.active);
}

export async function updateProfileSettings(patch: Record<string, unknown>) {
  return apiFetch("/settings/profile", { method: "PATCH", body: JSON.stringify(patch) });
}

export async function getProfileAgents() {
  const response = await apiFetch<{ data?: any[] | null }>("/social/affiliations/agents");
  return Array.isArray(response?.data) ? response.data.filter(Boolean) : [];
}

export async function requestProfileAffiliation(agentId: string, role: string) {
  return apiFetch("/social/affiliations/requests", { method: "POST", body: JSON.stringify({ agentId, role }) });
}

export function getViewerUser() {
  return getSavedUser();
}
