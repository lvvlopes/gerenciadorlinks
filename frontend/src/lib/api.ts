import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
});

// Types
export interface Group {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  links_count: number;
  created_at: string;
}

export interface PDF {
  id: string;
  filename: string;
  file_path: string;
  file_size: number;
  description?: string;
  pages?: number;
  created_at: string;
}

export interface Link {
  id: string;
  url: string;
  title: string;
  custom_title?: string;
  display_title: string;
  summary?: string;
  custom_notes?: string;
  favicon?: string;
  thumbnail?: string;
  tags: string[];
  is_favorite: boolean;
  is_read: boolean;
  group_id?: string;
  llm_provider: string;
  created_at: string;
  updated_at?: string;
  pdfs?: PDF[];
}

export interface LinksResponse {
  items: Link[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface Stats {
  total_links: number;
  total_groups: number;
  total_pdfs: number;
  favorite_links: number;
  unread_links: number;
  links_by_provider: Record<string, number>;
}

// API functions
export const groupsApi = {
  list: () => api.get<Group[]>("/api/groups").then((r) => r.data),
  create: (data: Partial<Group>) =>
    api.post<Group>("/api/groups", data).then((r) => r.data),
  update: (id: string, data: Partial<Group>) =>
    api.patch<Group>(`/api/groups/${id}`, data).then((r) => r.data),
  delete: (id: string) => api.delete(`/api/groups/${id}`).then((r) => r.data),
};

export const linksApi = {
  list: (params?: {
    group_id?: string;
    search?: string;
    is_favorite?: boolean;
    page?: number;
    page_size?: number;
  }) => api.get<LinksResponse>("/api/links", { params }).then((r) => r.data),

  get: (id: string) => api.get<Link>(`/api/links/${id}`).then((r) => r.data),

  create: (data: {
    url: string;
    group_id?: string;
    llm_provider: string;
    custom_title?: string;
    custom_notes?: string;
  }) => api.post<Link>("/api/links", data).then((r) => r.data),

  update: (id: string, data: Partial<Link>) =>
    api.patch<Link>(`/api/links/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete(`/api/links/${id}`).then((r) => r.data),

  regenerateSummary: (id: string, provider: string) =>
    api
      .post<Link>(`/api/links/${id}/regenerate-summary`, null, {
        params: { provider },
      })
      .then((r) => r.data),
};

export const pdfsApi = {
  upload: (linkId: string, file: File, description?: string) => {
    const formData = new FormData();
    formData.append("file", file);
    if (description) formData.append("description", description);
    return api
      .post<PDF>(`/api/pdfs/upload/${linkId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },
  delete: (id: string) => api.delete(`/api/pdfs/${id}`).then((r) => r.data),
  viewUrl: (id: string) =>
    `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/pdfs/view/${id}`,
  downloadUrl: (id: string) =>
    `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/pdfs/download/${id}`,
};

export const statsApi = {
  get: () => api.get<Stats>("/api/stats").then((r) => r.data),
};

export const llmApi = {
  providers: () =>
    api.get<any[]>("/api/llm/providers").then((r) => r.data),
};
