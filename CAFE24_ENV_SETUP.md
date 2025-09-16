# Cafe24 환경변수 설정 가이드

## 🔑 필요한 정보

Cafe24 개발자 센터에서 다음 정보를 확인하세요:

1. **Client ID**: 앱의 고유 식별자
2. **Client Secret**: 앱의 비밀키 (절대 공개 금지)
3. **Shop ID**: 쇼핑몰 ID (예: myshop)

## 📝 로컬 개발 환경 설정

### 1. `.env` 파일 수정

`/cms/.env` 파일에 다음 내용을 추가하세요:

```env
# Cafe24 설정
VITE_CAFE24_CLIENT_ID=발급받은_클라이언트_ID
VITE_CAFE24_CLIENT_SECRET=발급받은_클라이언트_시크릿
VITE_CAFE24_SHOP_ID=쇼핑몰_ID
VITE_CAFE24_REDIRECT_URI=http://localhost:3000/products
```

### 예시:
```env
VITE_CAFE24_CLIENT_ID=abcd1234efgh5678
VITE_CAFE24_CLIENT_SECRET=xyz987654321abc
VITE_CAFE24_SHOP_ID=myshop
VITE_CAFE24_REDIRECT_URI=http://localhost:3000/products
```

### 2. 개발 서버 재시작

환경변수 변경 후 반드시 서버를 재시작하세요:

```bash
# Ctrl+C로 서버 중지 후
npm run dev
```

## 🌐 프로덕션 환경 설정 (Vercel)

### 1. Vercel 대시보드 접속
https://vercel.com/dashboard

### 2. 프로젝트 선택

### 3. Settings → Environment Variables

다음 변수들을 추가:

| 변수명 | 값 | 환경 |
|--------|-----|------|
| `VITE_CAFE24_CLIENT_ID` | 클라이언트 ID | Production, Preview, Development |
| `VITE_CAFE24_CLIENT_SECRET` | 클라이언트 시크릿 | Production, Preview, Development |
| `VITE_CAFE24_SHOP_ID` | 쇼핑몰 ID | Production, Preview, Development |
| `VITE_CAFE24_REDIRECT_URI` | https://your-domain.vercel.app/products | Production, Preview |

### 4. 재배포

환경변수 설정 후 재배포:
```bash
vercel --prod
```

## 🏪 Cafe24 개발자 센터 설정

### 1. [Cafe24 개발자 센터](https://developers.cafe24.com) 접속

### 2. 앱 관리 → OAuth 설정

### 3. Redirect URI 설정

**개발 환경**:
```
http://localhost:3000/products
```

**프로덕션 환경**:
```
https://your-domain.vercel.app/products
```

> ⚠️ 주의: Redirect URI는 정확히 일치해야 합니다!

### 4. 필요한 권한 스코프 확인
- ✅ mall.read_category
- ✅ mall.write_category
- ✅ mall.read_product
- ✅ mall.write_product

## ✅ 설정 확인 방법

### 1. 테스트 페이지 열기
```
http://localhost:3000/test-cafe24.html
```

### 2. 설정 값 확인
- Client ID가 표시되는지 확인
- Shop ID가 표시되는지 확인
- Redirect URI가 올바른지 확인

### 3. OAuth 테스트
"🔐 Cafe24 OAuth 테스트" 버튼 클릭

## ❌ 일반적인 문제

### "설정되지 않음" 표시
- `.env` 파일 확인
- 환경변수 이름이 정확한지 확인 (VITE_ 접두사 필수)
- 서버 재시작

### OAuth 인증 실패
- Client ID/Secret 확인
- Redirect URI 일치 확인
- Shop ID 확인

### CORS 에러
- Vercel 배포 시 자동 해결
- 로컬에서는 API Routes 사용

## 🔒 보안 주의사항

1. **Client Secret을 GitHub에 커밋하지 마세요**
2. `.env` 파일은 `.gitignore`에 포함되어 있어야 합니다
3. 프로덕션에서는 Vercel 환경변수 사용
4. Client Secret은 서버 사이드에서만 사용

## 📞 도움말

추가 도움이 필요하면:
- [Cafe24 개발자 문서](https://developers.cafe24.com/docs/api/)
- [Vercel 환경변수 문서](https://vercel.com/docs/environment-variables)