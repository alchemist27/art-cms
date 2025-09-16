# Firebase와 Cafe24 연동 설정 가이드

## 1. Firebase Functions 설정

### Firebase CLI 설치
```bash
npm install -g firebase-tools
```

### Firebase 로그인
```bash
firebase login
```

### Firebase Functions 환경 변수 설정
```bash
firebase functions:config:set cafe24.client_id="YOUR_CAFE24_CLIENT_ID"
firebase functions:config:set cafe24.client_secret="YOUR_CAFE24_CLIENT_SECRET"
firebase functions:config:set cafe24.shop_id="YOUR_SHOP_ID"
firebase functions:config:set cafe24.redirect_uri="https://your-domain.vercel.app/products"
```

### Functions 의존성 설치
```bash
cd functions
npm install
```

### Functions 배포
```bash
firebase deploy --only functions
```

## 2. Vercel 환경 변수 설정

Vercel 대시보드에서 다음 환경 변수를 설정:

```
VITE_CAFE24_CLIENT_ID=your_cafe24_client_id
VITE_CAFE24_CLIENT_SECRET=your_cafe24_client_secret
VITE_CAFE24_SHOP_ID=your_shop_id
VITE_CAFE24_REDIRECT_URI=https://your-domain.vercel.app/products
```

## 3. Cafe24 앱 설정

Cafe24 개발자 센터에서:

1. **Redirect URI 설정**: `https://your-domain.vercel.app/products`
2. **필요한 권한 스코프**:
   - `mall.read_category`
   - `mall.write_category`
   - `mall.read_product`
   - `mall.write_product`

## 4. 로컬 개발 환경

### .env 파일 생성
```env
VITE_CAFE24_CLIENT_ID=your_cafe24_client_id
VITE_CAFE24_CLIENT_SECRET=your_cafe24_client_secret
VITE_CAFE24_SHOP_ID=your_shop_id
VITE_CAFE24_REDIRECT_URI=http://localhost:3000/products

VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 개발 서버 실행
```bash
npm run dev
```

## 5. 인증 플로우

1. 사용자가 "Cafe24 연동하기" 버튼 클릭
2. Cafe24 OAuth 페이지로 리디렉션
3. 사용자가 권한 승인
4. `/products?code=xxx`로 콜백
5. 코드를 토큰으로 교환
6. Firebase Firestore에 토큰 저장
7. 상품 목록 표시

## 6. 토큰 관리

- **액세스 토큰**: 2시간 유효
- **리프레시 토큰**: 2주 유효
- 자동 갱신: 액세스 토큰 만료 시 자동으로 리프레시
- 저장 위치: Firebase Firestore `cafe24_tokens` 컬렉션

## 7. 문제 해결

### CORS 에러
- Vercel 서버리스 함수를 통해 프록시 처리
- Firebase Functions 사용 시 자동으로 CORS 처리

### 토큰 만료
- 자동으로 리프레시 토큰을 사용해 갱신
- 리프레시 토큰도 만료되면 재인증 필요

### 인증 실패
- Client ID, Secret 확인
- Redirect URI가 정확히 일치하는지 확인
- Shop ID가 올바른지 확인

## 8. 보안 주의사항

- Client Secret은 서버 사이드에서만 사용
- 토큰은 Firebase Firestore에 안전하게 저장
- HTTPS 사용 필수
- 환경 변수로 민감한 정보 관리