import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
} from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";
import { AppError } from "./errors";
export function firebaseConfigured() {
  return !!process.env.FIREBASE_PROJECT_ID;
}
function app() {
  if (!firebaseConfigured())
    throw new AppError(
      503,
      "Firebase está pendiente de configuración.",
      "FIREBASE_NOT_CONFIGURED",
    );
  return (
    getApps()[0] ||
    initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      ...(process.env.FIRESTORE_EMULATOR_HOST
        ? {}
        : {
            credential: process.env.FIREBASE_PRIVATE_KEY
              ? cert({
                  projectId: process.env.FIREBASE_PROJECT_ID,
                  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                  privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(
                    /\\n/g,
                    "\n",
                  ),
                })
              : applicationDefault(),
          }),
    })
  );
}
export const db = () => getFirestore(app());
export const auth = () => getAuth(app());
export const storage = () => getStorage(app());
export const isDemo = () => process.env.CATALOG_MODE !== "production";
export const col = (name: string) =>
  db().collection((isDemo() ? "demo_" : "") + name);
