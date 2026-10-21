import { Platform } from 'react-native';
import {
  clearAuthSession,
  getStoredAccessToken,
  getStoredRefreshToken,
  storeAuthSession,
} from './tokenStorage';

const localHost = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
const configuredBaseUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
export const API_BASE_URL = (configuredBaseUrl || `http://${localHost}:3000/api/v1`).replace(/\/$/, '');

let isRefreshingToken = false;

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  isRetry = false,
): Promise<T> {
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  let response: Response;

  const authHeader: Record<string, string> = {};
  if (!options.headers || !('Authorization' in (options.headers as Record<string, string>))) {
    try {
      const token = await getStoredAccessToken();
      if (token) {
        authHeader['Authorization'] = `Bearer ${token}`;
      }
    } catch {}
  }

  try {
    response = await fetch(`${API_BASE_URL}${normalizedEndpoint}`, {
      ...options,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...authHeader,
        ...options.headers,
      },
    });
  } catch {
    throw new Error(
      `Unable to reach GILEO API (${API_BASE_URL}). Ensure your backend server is running.`,
    );
  }

  // Handle 401 Unauthorized by attempting automatic refresh
  if (response.status === 401 && !isRetry && !endpoint.includes('/auth/')) {
    if (!isRefreshingToken) {
      isRefreshingToken = true;
      try {
        const storedRefresh = await getStoredRefreshToken();
        if (storedRefresh) {
          const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refreshToken: storedRefresh }),
          });

          const refreshData = await refreshRes.json().catch(() => null);
          if (refreshRes.ok && refreshData?.accessToken && refreshData?.refreshToken) {
            await storeAuthSession({
              accessToken: refreshData.accessToken,
              refreshToken: refreshData.refreshToken,
              user: refreshData.user || null,
            });
            isRefreshingToken = false;
            // Retry original request with new token
            return apiRequest<T>(endpoint, options, true);
          }
        }
      } catch {
        // Fall through to clear session
      } finally {
        isRefreshingToken = false;
      }
    }

    // Token refresh failed or no refresh token exists -> clear stale session
    await clearAuthSession();
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.message ?? data?.error;
    throw new Error(
      Array.isArray(message)
        ? message.join(', ')
        : typeof message === 'string' && message.trim()
          ? message
          : response.status === 401
            ? 'Your session has expired. Please log in again.'
            : 'Something went wrong. Please try again.',
    );
  }

  return data as T;
}
