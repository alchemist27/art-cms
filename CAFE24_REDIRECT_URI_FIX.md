# Cafe24 Redirect URI 설정 가이드

## 🔴 현재 문제
`invalid_request` 에러: Cafe24 개발자 센터에 등록된 Redirect URI와 일치하지 않음

## ✅ 해결 방법

### 1. Cafe24 개발자 센터에서 Redirect URI 확인

1. [Cafe24 개발자 센터](https://developers.cafe24.com) 로그인
2. **내 앱** → 해당 앱 선택
3. **앱 정보 수정** 클릭
4. **OAuth & Permission** 섹션에서 **Redirect URI** 확인

### 2. 가능한 Redirect URI 형식

#### 옵션 A: 로컬 개발용
```
http://localhost:3000/products
```

#### 옵션 B: Vercel 프로덕션용
```
https://art-cms-alpha.vercel.app/products
```

#### 옵션 C: Cafe24 기본 콜백 (권장)
```
https://sugardeco.cafe24.com/api/v2/oauth/callback
```
또는
```
https://sugardeco.cafe24api.com/api/v2/oauth/callback
```

### 3. 환경별 설정

#### 로컬 개발 (.env)
```env
# 옵션 1: 직접 리다이렉트
VITE_CAFE24_REDIRECT_URI=http://localhost:3000/products

# 옵션 2: Cafe24 기본 콜백 사용
VITE_CAFE24_REDIRECT_URI=https://sugardeco.cafe24api.com/api/v2/oauth/callback
```

#### 프로덕션 (Vercel)
```env
VITE_CAFE24_REDIRECT_URI=https://art-cms-alpha.vercel.app/products
```

### 4. Cafe24 개발자 센터에 URI 등록

1. **앱 정보 수정** → **OAuth & Permission**
2. **Redirect URI** 필드에 다음 URI들을 모두 추가 (여러 개 가능):
   ```
   http://localhost:3000/products
   https://art-cms-alpha.vercel.app/products
   ```

3. **저장** 클릭

### 5. 테스트 순서

1. Cafe24 개발자 센터에서 Redirect URI 등록 확인
2. `.env` 파일의 `VITE_CAFE24_REDIRECT_URI` 수정
3. 개발 서버 재시작
4. 테스트 페이지에서 OAuth URL 확인
5. OAuth 인증 테스트

## 🔍 디버깅 팁

### OAuth URL 확인
브라우저 콘솔에서:
```javascript
// 현재 설정 확인
import('./src/config/cafe24.js').then(m => {
  console.log('Client ID:', m.cafe24Config.clientId);
  console.log('Shop ID:', m.cafe24Config.shopId);
  console.log('Redirect URI:', m.cafe24Config.redirectUri);
  console.log('Full Auth URL:', m.getAuthUrl());
});
```

### URL 파라미터 확인
OAuth URL에서 확인할 것:
- `redirect_uri`: URL 인코딩되어 있어야 함
- `client_id`: Cafe24에 등록된 Client ID와 일치
- `scope`: 권한이 올바른지 확인

## ⚠️ 주의사항

1. **정확한 일치 필요**: Redirect URI는 한 글자라도 다르면 실패
2. **프로토콜 확인**: http vs https
3. **포트 확인**: localhost:3000 vs localhost:5173
4. **경로 확인**: /products vs /api/auth/callback
5. **URL 인코딩**: 특수문자는 반드시 인코딩

## 📞 추가 도움

Cafe24 기술 지원:
- 개발자 포럼: https://developers.cafe24.com/community
- API 문서: https://developers.cafe24.com/docs/api/admin/#oauth