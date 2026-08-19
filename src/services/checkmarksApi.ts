import { apiFetch } from "@/services/api";

export type CheckmarkType = "gold" | "blue" | "green" | "purple" | "silver" | string;
export type CheckmarkRecord = { username: string; checkmarkType: CheckmarkType | null };

export async function getPublicCheckmarks(): Promise<CheckmarkRecord[]> {
  const response = await apiFetch<{ data?: CheckmarkRecord[] }>("/social/checkmarks");
  return Array.isArray(response?.data) ? response.data : [];
}
