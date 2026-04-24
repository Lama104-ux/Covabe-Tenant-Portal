import { Platform } from 'react-native';

const API_BASE_URL =
  Platform.OS === 'android' ? 'http://10.0.2.2:5057' : 'http://localhost:5057';

export type ApiError = {
  status: number;
  message: string;
};

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  token?: string | null,
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const data = await response.json();
      if (data?.message) message = data.message;
    } catch {
      // response had no JSON body
    }
    const error: ApiError = { status: response.status, message };
    throw error;
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export const api = {
  get: <T>(path: string, token?: string | null) => request<T>('GET', path, undefined, token),
  post: <T>(path: string, body?: unknown, token?: string | null) =>
    request<T>('POST', path, body, token),
  put: <T>(path: string, body?: unknown, token?: string | null) =>
    request<T>('PUT', path, body, token),
  delete: <T>(path: string, token?: string | null) =>
    request<T>('DELETE', path, undefined, token),
};

export { API_BASE_URL };
