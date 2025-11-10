import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Cafe24 토큰 전용 Firebase 앱 설정
// SECURITY: NEVER commit actual API keys! Always use environment variables.
const firebaseCafe24Config = {
    apiKey: import.meta.env.VITE_CAFE24_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_CAFE24_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_CAFE24_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_CAFE24_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_CAFE24_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_CAFE24_FIREBASE_APP_ID
};

// Validate configuration
if (!firebaseCafe24Config.apiKey) {
    console.error('Cafe24 Firebase configuration missing! Please set environment variables.');
}

// Cafe24 전용 Firebase 앱 초기화 (기존 CMS 앱과 분리)
const cafe24App = initializeApp(firebaseCafe24Config, 'cafe24-app');

// Cafe24 전용 Firestore와 Auth
export const cafe24Db = getFirestore(cafe24App);
export const cafe24Auth = getAuth(cafe24App);

export default cafe24App;