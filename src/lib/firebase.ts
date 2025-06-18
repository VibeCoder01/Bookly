
// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Optional
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const db = getFirestore(app);

export { app, db };

// Instructions:
// 1. Create a Firebase project in the Firebase console (console.firebase.google.com).
// 2. Enable Firestore database in your Firebase project.
// 3. Go to Project settings > General in your Firebase project.
// 4. Register a web app and copy the firebaseConfig object provided.
// 5. Create a .env.local file in the root of your project (if it doesn't exist).
// 6. Add your Firebase configuration values to .env.local, prefixing each with NEXT_PUBLIC_:
//    Example:
//    NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
//    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
//    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
//    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
//    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
//    NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
//    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id (if you have it)
// 7. Ensure your Firestore security rules are set up appropriately for your application's needs.
//    (Firebase Console -> Firestore Database -> Rules tab)
// 8. Update src/lib/actions.ts to use 'db' from this file for Firestore operations
//    instead of the mockBookings array.
