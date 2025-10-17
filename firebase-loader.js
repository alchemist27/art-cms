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
        console.log('Firebase에서 product_metadata 컬렉션 조회 시작...');
        
        // product_metadata 컬렉션에서 데이터 가져오기
        const metadataSnapshot = await db.collection('product_metadata').get();
        const products = [];
        
        console.log(`product_metadata 컬렉션에서 ${metadataSnapshot.size}개의 문서 발견`);
        
        metadataSnapshot.forEach(doc => {
            const data = doc.data();
            console.log('문서 데이터:', doc.id, data);
            
            // 이미지가 있는 제품만 처리
            if (data.imageUrl) {
                const productItem = {
                    id: doc.id,
                    name: `상품 ${data.productNo}`,
                    src: data.imageUrl,
                    type: data.type || '비즈',
                    direction: data.direction || null,
                    colors: data.colors ? data.colors.split(',').map(c => c.trim()) : [],
                    size: { width_mm: 20, height_mm: 20 },
                    tags: [],
                    popularity: Math.floor(Math.random() * 100)
                };

                // 태그 생성 - type 필드를 파싱해서 적절한 태그 추가
                if (data.type) {
                    const typeValue = data.type.toLowerCase();
                    productItem.tags.push(typeValue);

                    // "타입-세부타입" 형태를 파싱
                    if (typeValue.includes('-')) {
                        const parts = typeValue.split('-');
                        const mainType = parts[0];
                        const subType = parts[1];

                        // 메인 타입 추가 (이미 전체 값이 추가되어 있으므로 중복이지만, 필터링을 위해 추가)
                        productItem.tags.push(mainType);

                        // 세부 타입 추가
                        if (subType) {
                            productItem.tags.push(subType);
                        }
                    }
                }

                if (data.direction) {
                    productItem.tags.push(data.direction.toLowerCase());
                }

                if (data.colors) {
                    const colorArray = data.colors.split(',').map(c => c.trim().toLowerCase());
                    productItem.tags.push(...colorArray);
                }

                if (data.keywords) {
                    const keywordArray = data.keywords.split(',').map(k => k.trim().toLowerCase());
                    productItem.tags.push(...keywordArray);
                }
                
                products.push(productItem);
                console.log('제품 추가:', productItem);
            }
        });
        
        console.log('Firebase에서 제품 로드 완료:', products.length, '개');
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
            // CMS에서 저장한 필드명에 맞게 수정
            const imageUrl = data.url || data.imageUrl;
            const displayName = data.displayName || data.name;
            const category = data.category || data.type;
            
            backgrounds.push({
                id: doc.id,
                name: displayName,
                src: imageUrl,
                category: category
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