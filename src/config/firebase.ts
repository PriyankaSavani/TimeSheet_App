// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
     apiKey: "AIzaSyDxvQ5naQBqUNO8lRGb6fcvSwyxiFMR2EY",
     authDomain: "timesheet-app-eb3cc.firebaseapp.com",
     projectId: "timesheet-app-eb3cc",
     storageBucket: "timesheet-app-eb3cc.firebasestorage.app",
     messagingSenderId: "225250934417",
     appId: "1:225250934417:web:4e2bcc31d0021dc25d4930",
     measurementId: "G-T4BTWF4ZBN"
};

// Initialize Firebase
const app = initializeApp( firebaseConfig );

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth( app );

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore( app );
