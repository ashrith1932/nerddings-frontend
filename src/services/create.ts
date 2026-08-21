import { apiFetch, uploadMedia } from "@/lib/api";

export type CreateProjectOption = { slug: string; name: string };

export async function getCreateProjects(username: string): Promise<CreateProjectOption[]> {
  const response = await apiFetch<{ data?: { projects?: Array<{ slug?: string; name?: string }> } }>(
    `/social/users/${encodeURIComponent(username)}/profile-live`,
  );
  return (response.data?.projects ?? [])
    .filter((project: any) => typeof project.slug === "string" && typeof project.name === "string")
    .map((project: any) => ({ slug: project.slug!, name: project.name! }));
}

export async function publishPost(input: { body: string; files?: File[]; projectSlug?: string }) {
  const media = [];
  for (const file of input.files ?? []) media.push(await uploadMedia(file));
  return apiFetch("/posts", {
    method: "POST",
    body: JSON.stringify({
      body: input.body,
      media,
      projectSlug: input.projectSlug || undefined,
    }),
  });
}
