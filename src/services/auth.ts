import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest } from './api';

const ACCESS_TOKEN_KEY = '@gileo/accessToken';
const REFRESH_TOKEN_KEY = '@gileo/refreshToken';
const USER_KEY = '@gileo/user';
// Migrate sessions created by the earlier Vitaltron prototype without logging
// existing testers out during the GILEO rebrand.
const LEGACY_KEYS = {
  accessToken: '@vitaltron/accessToken',
  refreshToken: '@vitaltron/refreshToken',
  user: '@vitaltron/user',
} as const;

export type AuthUser = {
  id: string;
  email: string | null;
  displayName: string | null;
};

type AuthResponse = {
  message: string;
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  refreshTokenExpiresIn: number;
  user: AuthUser;
};

async function migrateLegacySession(): Promise<void> {
  const [access, refresh, user] = await AsyncStorage.multiGet([
    ACCESS_TOKEN_KEY,
    REFRESH_TOKEN_KEY,
    USER_KEY,
  ]);
  if (access[1] || refresh[1] || user[1]) return;

  const legacy = await AsyncStorage.multiGet([
    LEGACY_KEYS.accessToken,
    LEGACY_KEYS.refreshToken,
    LEGACY_KEYS.user,
  ]);
  const migration: [string, string][] = [];
  if (legacy[0][1]) migration.push([ACCESS_TOKEN_KEY, legacy[0][1]!]);
  if (legacy[1][1]) migration.push([REFRESH_TOKEN_KEY, legacy[1][1]!]);
  if (legacy[2][1]) migration.push([USER_KEY, legacy[2][1]!]);
  if (migration.length) await AsyncStorage.multiSet(migration);
}

export async function storeAuthSession(response: {
  accessToken: string;
  refreshToken: string;
  user?: AuthUser | null;
}): Promise<void> {
  if (!response.accessToken || !response.refreshToken) {
    throw new Error('The server returned an incomplete sign-in session.');
  }
  const entries: [string, string][] = [
    [ACCESS_TOKEN_KEY, response.accessToken],
    [REFRESH_TOKEN_KEY, response.refreshToken],
  ];
  if (response.user) entries.push([USER_KEY, JSON.stringify(response.user)]);
  await AsyncStorage.multiSet(entries);
  await AsyncStorage.multiRemove(Object.values(LEGACY_KEYS));
}

export async function signInWithGoogleIdToken(idToken: string): Promise<AuthResponse> {
  const response = await apiRequest<AuthResponse>('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ idToken }),
  });
  await storeAuthSession(response);
  return response;
}

export async function getStoredAccessToken(): Promise<string | null> {
  await migrateLegacySession();
  return AsyncStorage.getItem(ACCESS_TOKEN_KEY);
}

export async function getStoredUser(): Promise<AuthUser | null> {
  await migrateLegacySession();
  const value = await AsyncStorage.getItem(USER_KEY);
  if (!value) return null;
  try {
    return JSON.parse(value) as AuthUser;
  } catch {
    await AsyncStorage.removeItem(USER_KEY);
    return null;
  }
}

export async function getStoredRefreshToken(): Promise<string | null> {
  await migrateLegacySession();
  return AsyncStorage.getItem(REFRESH_TOKEN_KEY);
}

export async function clearAuthSession(): Promise<void> {
  await AsyncStorage.multiRemove([
    ACCESS_TOKEN_KEY,
    REFRESH_TOKEN_KEY,
    USER_KEY,
    ...Object.values(LEGACY_KEYS),
  ]);
}
