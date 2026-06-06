export type Role = "admin" | "uploader";

export interface User {
  id: string;
  username: string;
  role: Role;
  created_at: string;
  updated_at?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_by_username?: string;
  video_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  name: string;
  created_by: string | null;
  created_by_username?: string;
  video_count?: number;
  created_at: string;
}

export interface Video {
  id: string;
  title: string;
  project_id: string | null;
  project_name?: string;
  file_path: string;
  thumbnail_path: string | null;
  file_size: number;
  duration: number | null;
  format: string | null;
  uploaded_by: string;
  uploaded_by_username?: string;
  tags: Tag[];
  created_at: string;
  updated_at: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface Stats {
  total_videos: number;
  total_projects: number;
  total_users: number;
  total_tags: number;
  total_storage_bytes: number;
  total_storage_human: string;
}

export interface MyStats {
  total_videos: number;
  total_projects: number;
  total_tags: number;
  total_storage_bytes: number;
  total_storage_human: string;
}

export interface VideoFilters {
  page?: number;
  limit?: number;
  project_id?: string;
  search?: string;
  tag?: string;
  uploaded_by?: string;
  sort_by?: "created_at" | "title" | "file_size" | "duration";
  sort_order?: "asc" | "desc";
}
