export type ApiErrorBody = { error?: string; message?: string };
export class ApiError extends Error { constructor(message: string, readonly status: number) { super(message); } }
const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, { ...options, credentials: "include", headers: { "Content-Type": "application/json", ...options.headers } });
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as ApiErrorBody;
    throw new ApiError(body.error ?? body.message ?? "Something went wrong. Please try again.", response.status);
  }
  return response.status === 204 ? undefined as T : response.json() as Promise<T>;
}
export type User = { id: string; username: string; email: string; displayName: string | null };
export const authApi = {
  me: () => api<{ user: User }>("/auth/me"),
  login: (username: string, password: string) => api<{ user: User }>("/auth/login", { method: "POST", body: JSON.stringify({ username, password }) }),
  register: (username: string, email: string, password: string) => api<{ message: string }>("/auth/register", { method: "POST", body: JSON.stringify({ username, email, password }) }),
  verifyEmail: (token: string) => api<{ message: string }>("/auth/verify-email", { method: "POST", body: JSON.stringify({ token }) }),
  logout: () => api<void>("/auth/logout", { method: "POST" }),
};
export const unavailablePasswordMessage = "Password recovery is not available yet. Contact support if you need help accessing your account.";
