// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

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

// Enable offline persistence
enableIndexedDbPersistence( db ).catch( ( err ) => {
     if ( err.code === 'failed-precondition' ) {
          // Multiple tabs open, persistence can only be enabled in one tab at a time.
          console.warn( 'Firestore persistence failed: Multiple tabs open' );
     } else if ( err.code === 'unimplemented' ) {
          // The current browser does not support all of the features required to enable persistence
          console.warn( 'Firestore persistence not supported in this browser' );
     }
} );
