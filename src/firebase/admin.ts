/**
 * Firebase Admin SDK — Server-Side Only
 *
 * firebase-admin is intentionally NOT in package.json as a client dep.
 * Install separately for Cloud Functions / server route use:
 *   npm install firebase-admin
 *
 * This file is excluded from the main tsconfig.json (see tsconfig.server.json).
 * Import it only from:
 *   - src/app/api/ route handlers
 *   - Next.js Server Actions marked 'use server'
 *   - Firebase Cloud Functions (functions/ directory)
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

let adminApp: unknown = null;

export async function getFirebaseAdmin(): Promise<unknown> {
  if (adminApp) return adminApp;

  // Dynamic require avoids bundling firebase-admin into the client
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { initializeApp, getApps, cert } = require('firebase-admin/app');
  const existing = getApps().find((a: { name: string }) => a.name === 'motoon-admin');

  adminApp = existing ?? initializeApp(
    {
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    },
    'motoon-admin'
  );

  return adminApp;
}

export async function getAdminAuth() {
  const app = await getFirebaseAdmin();
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getAuth } = require('firebase-admin/auth');
  return getAuth(app);
}

export async function getAdminFirestore() {
  const app = await getFirebaseAdmin();
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getFirestore } = require('firebase-admin/firestore');
  return getFirestore(app);
}
