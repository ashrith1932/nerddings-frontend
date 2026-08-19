import { apiFetch } from "@/services/api";

export async function getPost(postId: string) {
  const response = await apiFetch<{ data?: any }>(`/social/posts/${encodeURIComponent(postId)}`);
  if (!response?.data?.id) throw new Error("Post response is invalid.");
  return response.data;
}

export async function toggleLike(postId: string) {
  const response = await apiFetch<{ data?: { active?: boolean; count?: number } }>(`/posts/${encodeURIComponent(postId)}/like`, { method: "POST" });
  return { active: Boolean(response?.data?.active), count: Number(response?.data?.count ?? 0) };
}

export async function toggleSave(postId: string) {
  const response = await apiFetch<{ data?: { active?: boolean; count?: number } }>(`/posts/${encodeURIComponent(postId)}/save`, { method: "POST" });
  return { active: Boolean(response?.data?.active), count: Number(response?.data?.count ?? 0) };
}

export async function amplify(postId: string) {
  const response = await apiFetch<{ data?: { count?: number } }>(`/social/posts/${encodeURIComponent(postId)}/repost`, { method: "POST" });
  return { active: true, count: Number(response?.data?.count ?? 0) };
}

export async function addComment(postId: string, body: string, parentId: string | null = null) {
  return apiFetch(`/social/posts/${encodeURIComponent(postId)}/comments`, { method: "POST", body: JSON.stringify({ body: body.trim(), parentId }) });
}
