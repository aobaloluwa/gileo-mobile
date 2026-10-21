# GILEO Mobile

React Native + Expo app for the GILEO connected healthcare ecosystem.

## Quick start

```bash
cp .env.example .env
npm ci
npx expo start
```

Configure `EXPO_PUBLIC_API_URL` in `.env` to point to the NestJS API root including `/api/v1`. For a physical phone, use the development computer's LAN IP rather than `localhost`.

See [FRONTEND-INTEGRATION.md](./FRONTEND-INTEGRATION.md) for the authentication endpoints currently called by the app and remaining integration checks.

Do not commit `.env`, access tokens, private keys, or other credentials. Expo `EXPO_PUBLIC_*` variables are client-visible configuration, not secrets.
