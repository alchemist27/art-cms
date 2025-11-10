import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase 설정 - 환경 변수에서 가져오기 (없으면 기본값 사용)
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBecYQreosMseOCA9D3sYkO3bbunuV2CpU",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "artstudio-cms.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "artstudio-cms",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "artstudio-cms.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "427483351068",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:427483351068:web:fd2a545ba03b906b0f37d9"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);

// Firebase 서비스 내보내기
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;