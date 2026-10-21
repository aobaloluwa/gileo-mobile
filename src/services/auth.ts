import { apiRequest } from './api';
import {
  AuthUser,
  clearAuthSession,
  getStoredAccessToken,
  getStoredRefreshToken,
  getStoredUser,
  storeAuthSession,
} from './tokenStorage';

export type { AuthUser };
export {
  clearAuthSession,
  getStoredAccessToken,
  getStoredRefreshToken,
  getStoredUser,
  storeAuthSession,
};

export type AuthResponse = {
  message: string;
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  refreshTokenExpiresIn: number;
  user: AuthUser;
};

export async function signInWithGoogleIdToken(idToken: string): Promise<AuthResponse> {
  const response = await apiRequest<AuthResponse>('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ idToken }),
  });
  await storeAuthSession(response);
  return response;
}
