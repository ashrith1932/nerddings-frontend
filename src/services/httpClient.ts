const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");

export function requireApiBaseUrl() {
  if (!apiBaseUrl) throw new Error("API is not configured; set NEXT_PUBLIC_API_URL before using API services.");
  return apiBaseUrl;
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const base = requireApiBaseUrl();
  const token = typeof window === "undefined" ? null : window.localStorage.getItem("nerdding.token");
  const response = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    let message = `API request failed: ${response.status}`;
    try {
      const body = await response.json() as { error?: string };
      if (body.error) message = body.error;
    } catch {
      // Preserve the status-based error.
    }
    const error = new Error(message) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function upload(file: File) {
  if (!file.type.match(/^(image|video)\//)) throw new Error("Only images and videos can be uploaded.");
  if (file.size > 25 * 1024 * 1024) throw new Error("Images and videos must be under 25 MB.");

  const signed = await request<{ data: { signedUrl: string; path: string; publicUrl: string } }>(
    "/uploads/signed-url",
    {
      method: "POST",
      body: JSON.stringify({ fileName: file.name, contentType: file.type, size: file.size }),
    },
  );

  const uploaded = await fetch(signed.data.signedUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });

  if (!uploaded.ok) throw new Error("Media upload failed");
  return { path: signed.data.path, publicUrl: signed.data.publicUrl, mimeType: file.type };
}
