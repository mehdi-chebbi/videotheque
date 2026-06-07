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
  login: (email: string, password: string) =>
    api.post<{ success: boolean; data: LoginResponse }>("/auth/login", {
      email,
      password,
    }),
  me: () => api.get<{ success: boolean; data: User }>("/auth/me"),
  changePassword: (current_password: string, new_password: string) =>
    api.post<{ success: boolean; data: { message: string } }>("/auth/change-password", {
      current_password,
      new_password,
    }),
};

// ─── Users ─────────────────────────────────────────────────────
export const usersApi = {
  list: () => api.get<{ success: boolean; data: User[] }>("/users"),
  create: (data: { email: string; password: string; role: string }) =>
    api.post<{ success: boolean; data: User }>("/users", data),
  update: (id: string, data: { email?: string; password?: string; role?: string }) =>
    api.put<{ success: boolean; data: User }>(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
};

// ─── Projects ──────────────────────────────────────────────────
export const projectsApi = {
  list: () => api.get<{ success: boolean; data: Project[] }>("/projects"),
  get: (id: string) => api.get<{ success: boolean; data: Project }>(`/projects/${id}`),
  create: (data: { name: string }) =>
    api.post<{ success: boolean; data: Project }>("/projects", data),
  update: (id: string, data: { name?: string }) =>
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
  update: (id: string, data: { title?: string; project_id?: string; tags?: string[] }) =>
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
