import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Cafe24 토큰 전용 Firebase 앱 설정
const firebaseCafe24Config = {
    apiKey: "AIzaSyDrH6VBNRx6H-nESOKSqWH7cdXwSQ4jTos",
    authDomain: "art-token-9bcd9.firebaseapp.com",
    projectId: "art-token-9bcd9",
    storageBucket: "art-token-9bcd9.firebasestorage.app",
    messagingSenderId: "546735038745",
    appId: "1:546735038745:web:909bcc3955a25cc1cda588"
};

// Cafe24 전용 Firebase 앱 초기화 (기존 CMS 앱과 분리)
const cafe24App = initializeApp(firebaseCafe24Config, 'cafe24-app');

// Cafe24 전용 Firestore와 Auth
export const cafe24Db = getFirestore(cafe24App);
export const cafe24Auth = getAuth(cafe24App);

export default cafe24App;