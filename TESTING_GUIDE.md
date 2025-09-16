# Cafe24 OAuth 테스트 가이드

## 🧪 테스트 도구

### 1. 테스트 페이지
브라우저에서 `/test-cafe24.html` 열기:
```
http://localhost:3000/test-cafe24.html
```

이 페이지에서:
- 현재 Cafe24 설정 확인
- OAuth URL 생성 및 복사
- 인증 상태 확인
- 토큰 삭제

## 📝 테스트 체크리스트

### 1단계: 설정 확인
- [ ] Client ID가 올바른지 확인
- [ ] Shop ID가 올바른지 확인
- [ ] Redirect URI가 `/products`로 설정되어 있는지 확인
- [ ] 환경 변수가 제대로 로드되는지 확인

### 2단계: OAuth 인증 테스트
1. CMS 로그인
2. "Cafe24 상품" 메뉴 클릭
3. "Cafe24 연동하기" 버튼 클릭
4. 브라우저 콘솔에서 로그 확인:
   ```
   Cafe24 Auth URL: https://...
   Redirect URI: ...
   Client ID: ...
   Shop ID: ...
   ```

### 3단계: 콜백 처리 확인
OAuth 승인 후 `/products`로 리다이렉트되면:

1. URL 파라미터 확인:
   - `code`: 인증 코드
   - `state`: cafe24_auth
   
2. 브라우저 콘솔 로그:
   ```
   OAuth callback params: {code: "present", ...}
   Exchanging code for token...
   Token exchange successful, loading products...
   ```

### 4단계: 토큰 저장 확인

#### Firebase Firestore 확인
1. [Firebase Console](https://console.firebase.google.com) 접속
2. `art-token-9bcd9` 프로젝트 선택
3. Firestore Database → `cafe24_tokens` 컬렉션 확인
4. 토큰 문서 확인:
   ```json
   {
     "accessToken": "...",
     "refreshToken": "...",
     "expiresAt": "...",
     "userId": "local_user" or "uid"
   }
   ```

#### 로컬 스토리지 확인
브라우저 개발자 도구 → Application → Local Storage:
- `cafe24_access_token`
- `cafe24_refresh_token`
- `cafe24_expires_at`

## 🐛 일반적인 문제 해결

### 1. "Cafe24 연동하기" 클릭 후 dashboard로 이동
**원인**: Redirect URI 불일치
**해결**: 
- Cafe24 개발자 센터에서 Redirect URI를 `https://your-domain.vercel.app/products`로 설정
- 로컬 테스트 시: `http://localhost:3000/products`

### 2. CORS 에러
**원인**: 브라우저에서 직접 Cafe24 API 호출
**해결**: Vercel API Routes 사용 확인

### 3. 토큰 교환 실패
**확인 사항**:
```javascript
// 브라우저 콘솔에서 실행
console.log(import.meta.env.VITE_CAFE24_CLIENT_ID);
console.log(import.meta.env.VITE_CAFE24_CLIENT_SECRET);
console.log(import.meta.env.VITE_CAFE24_SHOP_ID);
console.log(import.meta.env.VITE_CAFE24_REDIRECT_URI);
```

### 4. Firebase 권한 에러
**확인**: Firestore 보안 규칙
```javascript
// local_user는 항상 접근 가능
allow read, write: if userId == 'local_user';
```

## 🔍 디버깅 명령어

### 브라우저 콘솔에서
```javascript
// 현재 설정 확인
import('./src/config/cafe24.js').then(m => console.log(m.cafe24Config));

// 인증 상태 확인
import('./src/services/cafe24Api.js').then(async m => {
  const isAuth = await m.cafe24Api.isAuthenticated();
  console.log('Authenticated:', isAuth);
});

// 토큰 정보 확인
console.log({
  access: localStorage.getItem('cafe24_access_token'),
  refresh: localStorage.getItem('cafe24_refresh_token'),
  expires: localStorage.getItem('cafe24_expires_at')
});

// 토큰 삭제
localStorage.removeItem('cafe24_access_token');
localStorage.removeItem('cafe24_refresh_token');
localStorage.removeItem('cafe24_expires_at');
```

### 네트워크 탭 확인
1. 개발자 도구 → Network 탭
2. OAuth 인증 시:
   - `authorize` 요청 확인
   - Redirect 응답 확인
3. 토큰 교환 시:
   - `/api/auth/cafe24/token` 요청
   - Request/Response 확인

## 📊 예상 플로우

```mermaid
graph TD
    A[Cafe24 상품 페이지 접근] --> B{인증 확인}
    B -->|미인증| C[Cafe24 연동하기 버튼 표시]
    B -->|인증됨| D[상품 목록 로드]
    C --> E[OAuth 페이지로 이동]
    E --> F[사용자 승인]
    F --> G[/products?code=xxx 콜백]
    G --> H[토큰 교환]
    H --> I[Firebase/LocalStorage 저장]
    I --> D
    D --> J[상품 표시]
```

## ✅ 성공 기준
1. OAuth 인증 완료
2. 토큰이 Firebase와 LocalStorage에 저장됨
3. 상품 목록이 표시됨
4. 페이지 새로고침 후에도 인증 유지
5. 토큰 만료 시 자동 갱신