
export const API_BASE_URL = 'http://10.0.2.2:3000/api/v1';

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(
    `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`,
    {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    },
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data?.message ??
      data?.error ??
      'Something went wrong. Please try again.';

    throw new Error(
      Array.isArray(message) ? message.join(', ') : message,
    );
  }

  return data as T;
}
