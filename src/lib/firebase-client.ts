"use client";
import { getApp, getApps, initializeApp } from "firebase/app";
import {
  getAuth,
  connectAuthEmulator,
  browserSessionPersistence,
  setPersistence,
} from "firebase/auth";
let connected = false;
export function clientConfigured() {
  return (
    !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  );
}
export async function clientAuth() {
  if (!clientConfigured())
    throw new Error("Firebase Authentication está pendiente de configuración.");
  const app = getApps().length
    ? getApp()
    : initializeApp({
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      });
  const auth = getAuth(app);
  auth.languageCode = "es";
  if (process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL && !connected) {
    connectAuthEmulator(
      auth,
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL,
      { disableWarnings: true },
    );
    connected = true;
  }
  await setPersistence(auth, browserSessionPersistence);
  await auth.authStateReady();
  return auth;
}
