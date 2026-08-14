/**
 * LemAI Server-Side Firebase Admin Auto-Configuration
 * 
 * Safely discovers credentials on the server side without exposing them to the frontend client.
 */

export interface FirebaseAdminConfig {
  projectId: string;
  clientEmail?: string;
  privateKey?: string;
  databaseURL?: string;
}

export function getFirebaseAdminConfig(): FirebaseAdminConfig {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GCLOUD_PROJECT || 'wers-app-d921c';
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const databaseURL = process.env.FIREBASE_DATABASE_URL || 'https://wers-app-d921c-default-rtdb.asia-southeast1.firebasedatabase.app';

  return {
    projectId,
    clientEmail,
    privateKey,
    databaseURL,
  };
}
