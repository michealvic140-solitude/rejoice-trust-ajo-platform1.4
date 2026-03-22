// Mock data store for demo
const mockStore = {
  user: null as any,
  groups: [
    { id: 1, name: "Morning Savers", contributionAmount: 50000, members: 12, description: "Daily savers group" },
    { id: 2, name: "Weekend Warriors", contributionAmount: 100000, members: 8, description: "Weekend savings" },
    { id: 3, name: "Premium Circle", contributionAmount: 250000, members: 5, description: "Elite members only" },
  ],
};

// Mock API endpoints
const mockEndpoints: Record<string, (body?: any) => Promise<any>> = {
  "/api/auth/login": async (body) => {
    mockStore.user = {
      id: 1,
      username: body.identifier,
      email: `${body.identifier}@rejoice.com`,
      fullName: "User Account",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=" + body.identifier,
      tier: "gold",
      balance: 250000,
    };
    return { user: mockStore.user, message: "Login successful" };
  },
  "/api/auth/register": async (body) => {
    mockStore.user = {
      id: Date.now(),
      username: body.username,
      email: body.email,
      fullName: body.fullName,
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=" + body.username,
      tier: "silver",
      balance: 0,
    };
    return { user: mockStore.user, message: "Registration successful" };
  },
  "/api/auth/me": async () => {
    return mockStore.user || { error: "Not authenticated" };
  },
  "/api/groups": async () => {
    return { groups: mockStore.groups };
  },
  "/api/users/leaderboard": async () => {
    return {
      leaderboard: [
        { id: 1, username: "chisom_ng", amount: 1500000, rank: 1 },
        { id: 2, username: "zainab_aje", amount: 1200000, rank: 2 },
        { id: 3, username: "david_ojo", amount: 950000, rank: 3 },
        { id: 4, username: "fatima_bk", amount: 850000, rank: 4 },
        { id: 5, username: "femi_lagos", amount: 750000, rank: 5 },
      ],
    };
  },
  "/api/maintenance": async () => {
    return { status: "operational", message: "All systems running smoothly" };
  },
  "/api/announcements": async () => {
    return {
      announcements: [
        { id: 1, title: "New Feature", message: "Group pooling is now live", date: new Date() },
        { id: 2, title: "Maintenance", message: "Scheduled maintenance tonight", date: new Date() },
      ],
    };
  },
  "/api/contact": async (body) => {
    return { message: "Message received", id: Date.now() };
  },
};

export async function apiFetch(path: string, options: RequestInit = {}) {
  // Check if this is a mock endpoint
  const mockFn = Object.entries(mockEndpoints).find(([key]) => path.includes(key))?.[1];
  
  if (mockFn) {
    try {
      const body = options.body ? JSON.parse(options.body as string) : undefined;
      const data = await mockFn(body);
      return data;
    } catch (err) {
      throw new Error("Mock API error");
    }
  }

  // Fallback to real API (for non-mock endpoints)
  try {
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
  } catch (err) {
    // Return mock error response
    throw new Error("Service temporarily unavailable");
  }
}

export const api = {
  get: (path: string) => apiFetch(path),
  post: (path: string, body: unknown) => apiFetch(path, { method: "POST", body: JSON.stringify(body) }),
  patch: (path: string, body: unknown) => apiFetch(path, { method: "PATCH", body: JSON.stringify(body) }),
  put: (path: string, body: unknown) => apiFetch(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: (path: string) => apiFetch(path, { method: "DELETE" }),
  postForm: async (path: string, formData: FormData) => {
    const mockFn = Object.entries(mockEndpoints).find(([key]) => path.includes(key))?.[1];
    if (mockFn) {
      return mockFn();
    }
    const res = await fetch(path, { method: "POST", credentials: "include", body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data;
  },
};
