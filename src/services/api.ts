import { Platform } from 'react-native';

/**
 * Set EXPO_PUBLIC_API_URL in your local .env file to the complete API root,
 * including the version prefix (for example http://192.168.1.20:3000/api/v1).
 * Android emulators use 10.0.2.2 to reach the host machine; iOS simulator and
 * web can use localhost. Physical devices should use the computer's LAN IP.
 */
const localHost = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
const configuredBaseUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
export const API_BASE_URL = (configuredBaseUrl || `http://${localHost}:3000/api/v1`).replace(/\/$/, '');

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${normalizedEndpoint}`, {
      ...options,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  } catch {
    throw new Error(
      `Unable to reach GILEO. Check your internet connection and API address (${API_BASE_URL}).`,
    );
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.message ?? data?.error;
    throw new Error(
      Array.isArray(message)
        ? message.join(', ')
        : typeof message === 'string' && message.trim()
          ? message
          : response.status === 429
            ? 'Too many attempts. Please wait a moment and try again.'
            : 'Something went wrong. Please try again.',
    );
  }

  return data as T;
}
