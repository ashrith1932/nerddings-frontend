import { apiFetch, uploadMedia } from "@/services/api";

export function requireApiBaseUrl() {
  const base = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (!base) throw new Error("API is not configured; set NEXT_PUBLIC_API_URL before using API services.");
  return base;
}

export const request = apiFetch;
export const upload = uploadMedia;
