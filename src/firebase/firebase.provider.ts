// src/modules/storage/firebase.provider.ts
import { readFileSync } from 'fs';
import { join } from 'path';
import { App, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

export const FIREBASE_APP = 'FIREBASE_APP';
export const FIREBASE_STORAGE = 'FIREBASE_STORAGE';

export const firebaseProviders = [
  {
    provide: FIREBASE_APP,
    useFactory: (): App => {
      const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
      let serviceAccount: Record<string, unknown>;

      if (serviceAccountJson) {
        serviceAccount = JSON.parse(serviceAccountJson);
      } else {
        const serviceAccountPath =
          process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
          './firebase-service-account.json';

        const fullPath = join(process.cwd(), serviceAccountPath);
        serviceAccount = JSON.parse(readFileSync(fullPath, 'utf-8'));
      }

      if (getApps().length > 0) {
        return getApps()[0]!;
      }

      return initializeApp({
        credential: cert(serviceAccount),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      });
    },
  },
  {
    provide: FIREBASE_STORAGE,
    inject: [FIREBASE_APP],
    useFactory: (app: App) => getStorage(app),
  },
];
