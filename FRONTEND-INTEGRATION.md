# GILEO frontend integration notes

## Local setup

1. Copy `.env.example` to `.env`.
2. Set `EXPO_PUBLIC_API_URL` to the complete backend API root, including `/api/v1`.
   - Android emulator: `http://10.0.2.2:3000/api/v1` (default fallback).
   - iOS simulator / web: `http://localhost:3000/api/v1` (default fallback).
   - Physical device: use your computer's LAN IP and ensure both devices are on the same network.
3. Set `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` to the Google OAuth web client ID for this app if Google sign-in is configured.
4. Install dependencies with `npm ci`, then run `npx expo start`.

## Authentication paths currently used by the frontend

- `POST /auth/register` — `{ displayName, email, password }`
- `POST /auth/login` — `{ email, password }`
- `POST /auth/google` — `{ idToken }`
- `POST /auth/verify-email` — `{ email, code }`
- `POST /auth/resend-verification` — `{ email }`
- `POST /auth/forgot-password` — `{ email }`
- `POST /auth/reset-password` — `{ email, code, newPassword }`

The API base URL is configurable instead of being hard-coded to the Android emulator. Existing locally stored sessions and onboarding-completion state from the earlier `@vitaltron/*` prototype keys are migrated/recognized to reduce disruption for testers.

## Integration caveats

- Confirm the endpoint paths, DTO field names, response shapes, and email-verification policy against the current NestJS backend before production release.
- The old `reset-password` deep-link screen was a UI placeholder and is separate from the working code-based reset flow in `forgot-password`; do not treat token-link resets as supported until the backend contract is confirmed and the screen is wired to it.
- Access and refresh tokens are currently persisted with AsyncStorage to match the existing app architecture. For a production security pass, move token storage to a platform-backed secure store and implement refresh/revocation behavior according to the backend's actual auth contract.
- Never commit `.env` or real credentials. `EXPO_PUBLIC_*` values are bundled into the client and must not contain secrets.
