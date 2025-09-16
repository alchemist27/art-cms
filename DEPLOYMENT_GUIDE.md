# CMS 배포 가이드

## Firebase 설정

### 1. Firebase 프로젝트 2개 사용
- **CMS 프로젝트**: `artstudio-cms` (기존 이미지 및 인증 관리)
- **Cafe24 토큰 프로젝트**: `art-token-9bcd9` (Cafe24 토큰 전용)

### 2. Cafe24 토큰 Firebase 설정 (이미 완료됨)
```javascript
const firebaseCafe24Config = {
  apiKey: "AIzaSyDrH6VBNRx6H-nESOKSqWH7cdXwSQ4jTos",
  authDomain: "art-token-9bcd9.firebaseapp.com",
  projectId: "art-token-9bcd9",
  storageBucket: "art-token-9bcd9.firebasestorage.app",
  messagingSenderId: "546735038745",
  appId: "1:546735038745:web:909bcc3955a25cc1cda588"
};
```

### 3. Firestore 보안 규칙 배포
```bash
# Cafe24 토큰 프로젝트에 배포
firebase use art-token-9bcd9
firebase deploy --only firestore:rules -f firestore-cafe24.rules
```

## Vercel 배포

### 1. 환경 변수 설정
Vercel 대시보드에서 다음 환경 변수를 설정:

```env
# Cafe24 설정 (필수)
VITE_CAFE24_CLIENT_ID=your_cafe24_client_id
VITE_CAFE24_CLIENT_SECRET=your_cafe24_client_secret  
VITE_CAFE24_SHOP_ID=your_cafe24_shop_id
VITE_CAFE24_REDIRECT_URI=https://your-domain.vercel.app/products

# 기존 CMS Firebase 설정 (선택)
VITE_FIREBASE_API_KEY=your_cms_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_cms_auth_domain
VITE_FIREBASE_PROJECT_ID=your_cms_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_cms_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_cms_sender_id
VITE_FIREBASE_APP_ID=your_cms_app_id
```

### 2. 배포 명령
```bash
vercel --prod
```

## Cafe24 개발자 센터 설정

### 1. OAuth Redirect URI
```
https://your-domain.vercel.app/products
```

### 2. 필요한 권한 스코프
- `mall.read_category`
- `mall.write_category`
- `mall.read_product`
- `mall.write_product`

## 로컬 개발

### 1. 의존성 설치
```bash
npm install
```

### 2. 로컬 환경 변수 (.env 파일)
```env
VITE_CAFE24_CLIENT_ID=your_cafe24_client_id
VITE_CAFE24_CLIENT_SECRET=your_cafe24_client_secret
VITE_CAFE24_SHOP_ID=your_cafe24_shop_id
VITE_CAFE24_REDIRECT_URI=http://localhost:3000/products
```

### 3. 개발 서버 실행
```bash
npm run dev
```

## 테스트 체크리스트

- [ ] CMS 로그인 가능
- [ ] 이미지 업로드/관리 정상 작동
- [ ] Cafe24 연동하기 클릭 시 OAuth 페이지로 이동
- [ ] OAuth 승인 후 `/products`로 리다이렉트
- [ ] 상품 목록 표시
- [ ] 상품 검색 기능
- [ ] 페이지네이션
- [ ] 토큰 자동 갱신

## 보안 체크리스트

- [ ] Client Secret이 클라이언트 코드에 노출되지 않음
- [ ] Firestore 보안 규칙 적용됨
- [ ] HTTPS 사용
- [ ] 환경 변수로 민감한 정보 관리

## 문제 해결

### 1. Cafe24 연동 실패
- Redirect URI 확인
- Client ID/Secret 확인
- Shop ID 확인

### 2. 토큰 저장 실패
- Firebase 프로젝트 ID 확인
- Firestore 보안 규칙 확인
- 브라우저 콘솔 에러 확인

### 3. CORS 에러
- Vercel API Routes 설정 확인
- `/api/auth/cafe24/token.js` 파일 존재 확인