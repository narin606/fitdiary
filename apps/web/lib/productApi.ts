import { api, apiBaseUrl } from "./api";

export type Food = {
  id: string;
  name: string;
  brand?: string | null;
  servingLabel: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  verified?: boolean;
  source?: string;
};

export type PhotoAnalysis = {
  description: string;
  confidence: "low" | "medium" | "high";
  calorieRange: { min: number; max: number };
  items: Array<{
    name: string;
    portion: string;
    calories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  }>;
};

export const foodsApi = {
  list: () => api<{ foods: Food[] }>("/foods"),
  search: (q: string) => api<{ foods: Food[] }>(`/foods/search?q=${encodeURIComponent(q)}`),
  create: (body: unknown) => api<{ food: Food }>("/foods", { method: "POST", body: JSON.stringify(body) }),
  remove: (id: string) => api<void>(`/foods/${encodeURIComponent(id)}`, { method: "DELETE" }),
};

export const profileApi = {
  get: () => api<{ profile: any }>("/profile"),
  save: (body: unknown) => api<{ profile: any }>("/profile", { method: "PUT", body: JSON.stringify(body) }),
};

export const uploadPhoto = (id: string, file: File) => {
  const body = new FormData();
  body.append("photo", file);
  return api<{ photoPath: string; analysis: { enabled: false } }>(`/diary/${encodeURIComponent(id)}/photo`, { method: "PUT", body });
};
export const privatePhotoUrl = (id: string) => `${apiBaseUrl}/diary/${encodeURIComponent(id)}/photo`;
export const deletePhoto = (id: string) => api<void>(`/diary/${encodeURIComponent(id)}/photo`, { method: "DELETE" });
export const analyzePhoto = (id: string) => api<{ analysis: PhotoAnalysis; requiresConfirmation: true }>(`/analysis/${encodeURIComponent(id)}`, { method: "POST" });
