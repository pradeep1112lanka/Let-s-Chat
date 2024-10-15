import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAXtAjgdwa-KiaceRerT54AGv2prQ0ObCg",
  authDomain: "my-chat-application-28b64.firebaseapp.com",
  projectId: "my-chat-application-28b64",
  storageBucket: "my-chat-application-28b64.appspot.com",
  messagingSenderId: "971512003508",
  appId: "1:971512003508:web:f55257e089ca81443990e1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services and pass the app instance
export const auth = getAuth();
export const db = getFirestore();
export const storage = getStorage();