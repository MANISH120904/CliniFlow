import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCJ3tZhFVsvdwRIfXrEwkt-fQ8vmUNxTC4",
  authDomain: "cliniflow-cfd0d.firebaseapp.com",
  projectId: "cliniflow-cfd0d",
  storageBucket: "cliniflow-cfd0d.firebasestorage.app",
  messagingSenderId: "805815757139",
  appId: "1:805815757139:web:252444e0a43903dfb259a6",
  measurementId: "G-857VRY9XWD"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();