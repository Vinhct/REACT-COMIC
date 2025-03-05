// src/Include/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth"; // Thêm Authentication SDK
import { getFirestore } from "firebase/firestore"; // Thêm Firestore


// Your web app's Firebase configuration
const firebaseConfig = { 
  apiKey : "AIzaSyCbpS103DnZ6NEbhrj_nhqqZN_v0Sd4l9g" , 
  authDomain : "comic-5b7ef.firebaseapp.com" , 
  projectId : "comic-5b7ef" , 
  storageBucket : "comic-5b7ef.firebasestorage.app" , 
  messagingSenderId : "677597163106" , 
  appId : "1:677597163106:web:6ae2dc1080927aa9f22b3b" , 
  measurementId : "G-LQ6ZBDNZPN" 
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Authentication
export const auth = getAuth(app);              // Export auth để sử dụng trong Login/Register
export const googleProvider = new GoogleAuthProvider(); // Export Google Provider
export const db = getFirestore(app);