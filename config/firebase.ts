import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBwLL99C2wpc7wzj6ANTt2UW6LUNr3Yhp4",
    authDomain: "saferides-73eb2.firebaseapp.com",
    projectId: "saferides-73eb2",
    storageBucket: "saferides-73eb2.firebasestorage.app",
    messagingSenderId: "470318165292",
    appId: "1:470318165292:web:31ac8df8b9b03cbb645089",
    measurementId: "G-MFVCLQWYP9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
export const db = getFirestore(app);
export default app; 