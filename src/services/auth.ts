
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest } from './api';

const ACCESS_TOKEN_KEY = '@vitaltron/accessToken';
const REFRESH_TOKEN_KEY = '@vitaltron/refreshToken';
const USER_KEY = '@vitaltron/user';

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


export async function storeAuthSession(response: {
  accessToken: string;
  refreshToken: string;
  user?: AuthUser | null;
}): Promise<void> {
  const entries: [string, string][] = [
    [ACCESS_TOKEN_KEY, response.accessToken],
    [REFRESH_TOKEN_KEY, response.refreshToken],
  ];
  if (response.user) entries.push([USER_KEY, JSON.stringify(response.user)]);
  await AsyncStorage.multiSet(entries);
}

export async function signInWithGoogleIdToken(
  idToken: string,
): Promise<AuthResponse> {
  const response = await apiRequest<AuthResponse>('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ idToken }),
  });

  await AsyncStorage.multiSet([
    [ACCESS_TOKEN_KEY, response.accessToken],
    [REFRESH_TOKEN_KEY, response.refreshToken],
    [USER_KEY, JSON.stringify(response.user)],
  ]);

  return response;
}

export async function getStoredAccessToken(): Promise<string | null> {
  return AsyncStorage.getItem(ACCESS_TOKEN_KEY);
}

export async function getStoredUser(): Promise<AuthUser | null> {
  const value = await AsyncStorage.getItem(USER_KEY);
  return value ? (JSON.parse(value) as AuthUser) : null;
}

export async function clearAuthSession(): Promise<void> {
  await AsyncStorage.multiRemove([
    ACCESS_TOKEN_KEY,
    REFRESH_TOKEN_KEY,
    USER_KEY,
  ]);
}
