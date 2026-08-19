import { apiFetch } from "@/services/api";

export async function getProject(slug: string) {
  const response = await apiFetch<{ data?: any }>(`/projects/${encodeURIComponent(slug)}`);
  if (!response?.data) throw new Error("Project response is invalid.");
  return response.data;
}

export async function createProject(payload: Record<string, unknown>) {
  return apiFetch("/projects", { method: "POST", body: JSON.stringify(payload) });
}
