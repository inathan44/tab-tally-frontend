import * as admin from 'firebase-admin';
import { serverConfig } from './firebaseConfig';

// Initialize the Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serverConfig.serviceAccount),
  });
}

export default admin;
