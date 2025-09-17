// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBecYQreosMseOCA9D3sYkO3bbunuV2CpU",
    authDomain: "artstudio-cms.firebaseapp.com",
    projectId: "artstudio-cms",
    storageBucket: "artstudio-cms.firebasestorage.app",
    messagingSenderId: "427483351068",
    appId: "1:427483351068:web:fd2a545ba03b906b0f37d9"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Firebase에서 제품 데이터 로드
async function loadProductsFromFirebase() {
    try {
        const productsSnapshot = await db.collection('products').get();
        const products = [];
        
        productsSnapshot.forEach(doc => {
            const data = doc.data();
            // CORS 설정 완료 - 원본 URL 사용
            const imageUrl = data.imageUrl;
            
            products.push({
                id: doc.id,
                name: data.name,
                src: imageUrl,
                type: data.type,
                direction: data.option || null,
                moruType: data.option || null,
                bunjaeType: data.option || null,
                colors: data.colors || [],
                size: data.size || { width_mm: 20, height_mm: 20 },
                tags: [
                    data.type.toLowerCase(),
                    ...(data.option ? [data.option.toLowerCase()] : []),
                    ...(data.colors || [])
                ],
                popularity: Math.floor(Math.random() * 100) // 임시 인기도
            });
        });
        
        console.log('Firebase에서 제품 로드:', products.length, '개');
        return products;
    } catch (error) {
        console.error('Firebase 제품 로드 실패:', error);
        return [];
    }
}

// Firebase에서 배경 데이터 로드
async function loadBackgroundsFromFirebase() {
    try {
        const backgroundsSnapshot = await db.collection('backgrounds').get();
        const backgrounds = [];
        
        backgroundsSnapshot.forEach(doc => {
            const data = doc.data();
            // CORS 설정 완료 - 원본 URL 사용
            const imageUrl = data.imageUrl;
            
            backgrounds.push({
                id: doc.id,
                name: data.name,
                src: imageUrl,
                category: data.type
            });
        });
        
        console.log('Firebase에서 배경 로드:', backgrounds.length, '개');
        return backgrounds;
    } catch (error) {
        console.error('Firebase 배경 로드 실패:', error);
        return [];
    }
}

// 전역 변수로 내보내기
window.loadProductsFromFirebase = loadProductsFromFirebase;
window.loadBackgroundsFromFirebase = loadBackgroundsFromFirebase;