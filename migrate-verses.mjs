import { readFileSync } from 'fs';
import { resolve } from 'path';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';

// Load .env.local manually since this is a plain Node script
const envLocalPath = resolve(process.cwd(), '.env.local');
const envContent = readFileSync(envLocalPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    let val = match[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.slice(1, -1);
    }
    envVars[key] = val;
  }
});

const firebaseConfig = {
  apiKey: envVars['NEXT_PUBLIC_FIREBASE_API_KEY'],
  authDomain: envVars['NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'],
  projectId: envVars['NEXT_PUBLIC_FIREBASE_PROJECT_ID'],
  storageBucket: envVars['NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'],
  messagingSenderId: envVars['NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'],
  appId: envVars['NEXT_PUBLIC_FIREBASE_APP_ID']
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function migrateVerses() {
  console.log('Starting verses migration...');
  const versesRef = collection(db, 'verses');
  const snapshot = await getDocs(versesRef);

  if (snapshot.empty) {
    console.log('No verses found to migrate.');
    process.exit(0);
  }

  console.log(`Found ${snapshot.size} verses to migrate.`);

  let migrated = 0;
  for (const verseDoc of snapshot.docs) {
    const data = verseDoc.data();
    if (!data.bookId) continue;

    // New path: books/{bookId}/verses/{verseId}
    const newRef = doc(db, 'books', data.bookId, 'verses', verseDoc.id);
    await setDoc(newRef, data);

    // Delete old
    await deleteDoc(verseDoc.ref);
    migrated++;
    console.log(`Migrated ${migrated}/${snapshot.size}: ${verseDoc.id}`);
  }

  console.log('Migration completed successfully!');
  process.exit(0);
}

migrateVerses().catch(e => {
  console.error(e);
  process.exit(1);
});
