
import { NativeModules, Platform, TurboModuleRegistry } from 'react-native';

type GoogleSigninType =
  typeof import('@react-native-google-signin/google-signin').GoogleSignin;

let cachedGoogleSignin: GoogleSigninType | null = null;

function getGoogleSignin(): GoogleSigninType | null {
  if (cachedGoogleSignin) {
    return cachedGoogleSignin;
  }

  try {
    // Dynamically require to prevent top-level native module execution errors in Expo Go / Web
    const googleModule = require('@react-native-google-signin/google-signin');
    cachedGoogleSignin = googleModule?.GoogleSignin || null;
    return cachedGoogleSignin;
  } catch (error) {
    console.warn('[GoogleSignIn] Native module could not be loaded:', error);
    return null;
  }
}

export function isGoogleSignInSupported(): boolean {
  if (Platform.OS === 'web') {
    return false;
  }

  const hasNativeModule = Boolean(
    NativeModules.RNGoogleSignin ||
      (typeof TurboModuleRegistry?.get === 'function' &&
        TurboModuleRegistry.get('RNGoogleSignin')),
  );

  if (!hasNativeModule) {
    return false;
  }

  return getGoogleSignin() !== null;
}

export function configureGoogleSignIn(): void {
  if (!isGoogleSignInSupported()) {
    console.warn(
      '[GoogleSignIn] Native module RNGoogleSignin is not available in this environment.',
    );
    return;
  }

  const GoogleSignin = getGoogleSignin();
  if (!GoogleSignin) return;

  try {
    GoogleSignin.configure({
      webClientId:
        '1087379121572-krau5b2fe25sssgkg8r9c2k42a38jk3m.apps.googleusercontent.com',
      offlineAccess: false,
    });
  } catch (error) {
    console.error('[GoogleSignIn] Failed to configure Google Sign-In:', error);
  }
}

export async function signInWithGoogle(): Promise<string | null> {
  const GoogleSignin = getGoogleSignin();

  if (!isGoogleSignInSupported() || !GoogleSignin) {
    throw new Error(
      'Google Sign-In is not supported in Expo Go or Web. Please build and run a native development build (npx expo run:android or npx expo run:ios) to use Google Sign-In, or sign in with email.',
    );
  }

  await GoogleSignin.hasPlayServices({
    showPlayServicesUpdateDialog: true,
  });

  const response = await GoogleSignin.signIn();

  if (response.type !== 'success') {
    return null;
  }

  const idToken = response.data?.idToken;

  if (!idToken) {
    throw new Error(
      'Google did not return an ID token. Check the Web OAuth client ID configuration.',
    );
  }

  return idToken;
}


