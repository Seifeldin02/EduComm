// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAfmDlj7ht8CulvDZMZyUTW5y1eIZqL4_M",
  authDomain: "educomm-84fd5.firebaseapp.com",
  projectId: "educomm-84fd5",
  storageBucket: "educomm-84fd5.firebasestorage.app",
  messagingSenderId: "190190697081",
  appId: "1:190190697081:web:2b3b9e21e777cc9d7cf2a8",
  measurementId: "G-K5WE3M8QBE",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export default app;
