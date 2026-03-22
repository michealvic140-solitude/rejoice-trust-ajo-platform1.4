export async function apiFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(path, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...((options.headers as Record<string, string>) || {}) },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.message || data.error || "Request failed") as Error & { code?: string };
    err.code = data.error;
    throw err;
  }
  return data;
}

export const api = {
  get: (path: string) => apiFetch(path),
  post: (path: string, body: unknown) => apiFetch(path, { method: "POST", body: JSON.stringify(body) }),
  patch: (path: string, body: unknown) => apiFetch(path, { method: "PATCH", body: JSON.stringify(body) }),
  put: (path: string, body: unknown) => apiFetch(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: (path: string) => apiFetch(path, { method: "DELETE" }),
  postForm: async (path: string, formData: FormData) => {
    const res = await fetch(path, { method: "POST", credentials: "include", body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data;
  },
};
