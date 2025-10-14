import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDt4q7K-72f9RU-6Ebe4OnRzxWEDHy0VU",
  authDomain: "devicetracker-4454d.firebaseapp.com",
  projectId: "devicetracker-4454d",
  storageBucket: "devicetracker-4454d.appspot.com",
  messagingSenderId: "284869439501",
  appId: "1:284869439501:web:13bacabd689a85c7486544",
  measurementId: "G-2EY5M4LWWF"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);
export { app, analytics };
