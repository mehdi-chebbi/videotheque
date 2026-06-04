import api from "./client";
import type {
  LoginResponse,
  User,
  Project,
  Video,
  Tag,
  Stats,
  MyStats,
  PaginatedResponse,
  VideoFilters,
} from "../types";

// ─── Auth ──────────────────────────────────────────────────────
export const authApi = {
  login: (username: string, password: string) =>
    api.post<{ success: boolean; data: LoginResponse }>("/auth/login", {
      username,
      password,
    }),
  me: () => api.get<{ success: boolean; data: User }>("/auth/me"),
};

// ─── Users ─────────────────────────────────────────────────────
export const usersApi = {
  list: () => api.get<{ success: boolean; data: User[] }>("/users"),
  create: (data: { username: string; password: string; role: string }) =>
    api.post<{ success: boolean; data: User }>("/users", data),
  update: (id: string, data: { username?: string; password?: string; role?: string }) =>
    api.put<{ success: boolean; data: User }>(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
};

// ─── Projects ──────────────────────────────────────────────────
export const projectsApi = {
  list: () => api.get<{ success: boolean; data: Project[] }>("/projects"),
  get: (id: string) => api.get<{ success: boolean; data: Project }>(`/projects/${id}`),
  create: (data: { name: string; description?: string }) =>
    api.post<{ success: boolean; data: Project }>("/projects", data),
  update: (id: string, data: { name?: string; description?: string }) =>
    api.put<{ success: boolean; data: Project }>(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
};

// ─── Videos ────────────────────────────────────────────────────
export const videosApi = {
  list: (filters?: VideoFilters) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          params.append(key, String(value));
        }
      });
    }
    return api.get<PaginatedResponse<Video>>(`/videos?${params.toString()}`);
  },
  get: (id: string) => api.get<{ success: boolean; data: Video }>(`/videos/${id}`),
  upload: (formData: FormData) =>
    api.post<{ success: boolean; data: Video }>("/videos", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  update: (id: string, data: { title?: string; description?: string; project_id?: string; tags?: string[] }) =>
    api.put<{ success: boolean; data: Video }>(`/videos/${id}`, data),
  delete: (id: string) => api.delete(`/videos/${id}`),
  batchDelete: (ids: string[]) => api.post<{ success: boolean; data: { message: string } }>("/videos/batch-delete", { ids }),
  streamUrl: (id: string) => `/api/videos/${id}/stream`,
  thumbnailUrl: (id: string) => `/api/videos/${id}/thumbnail`,
};

// ─── Tags ──────────────────────────────────────────────────────
export const tagsApi = {
  list: () => api.get<{ success: boolean; data: Tag[] }>("/tags"),
  create: (name: string) => api.post<{ success: boolean; data: Tag }>("/tags", { name }),
  delete: (id: string) => api.delete(`/tags/${id}`),
};

// ─── Stats ─────────────────────────────────────────────────────
export const statsApi = {
  get: () => api.get<{ success: boolean; data: Stats }>("/stats"),
  getMine: () => api.get<{ success: boolean; data: MyStats }>("/stats?mine=true"),
};
