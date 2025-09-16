# Vercel 환경변수 설정 가이드

## 🚨 중요: Vercel 환경변수 규칙

Vercel에서는 클라이언트 사이드와 서버 사이드 환경변수를 구분합니다:

- **클라이언트 사이드**: `VITE_` 접두사 필요
- **서버 사이드 (API Routes)**: 접두사 없이 사용

## 📝 필수 환경변수 설정

### Vercel 대시보드에서 설정

1. [Vercel 대시보드](https://vercel.com) 접속
2. 프로젝트 선택
3. **Settings** → **Environment Variables**
4. 다음 변수들을 추가:

| 변수명 | 값 | 설명 |
|--------|-----|------|
| `CAFE24_CLIENT_ID` | pdlW6CsXBxzlapLweKKeEF | API Routes용 |
| `CAFE24_CLIENT_SECRET` | sRXnrcXTGJEtduydNZiQHC | API Routes용 |
| `CAFE24_SHOP_ID` | sugardeco | API Routes용 |
| `VITE_CAFE24_CLIENT_ID` | pdlW6CsXBxzlapLweKKeEF | 클라이언트용 |
| `VITE_CAFE24_CLIENT_SECRET` | sRXnrcXTGJEtduydNZiQHC | 클라이언트용 |
| `VITE_CAFE24_SHOP_ID` | sugardeco | 클라이언트용 |
| `VITE_CAFE24_REDIRECT_URI` | https://art-cms-alpha.vercel.app/products | 클라이언트용 |

> ⚠️ 주의: 같은 값이라도 두 가지 형식으로 모두 설정해야 합니다!

## 🔧 로컬 개발 환경

`.env` 파일:
```env
# Firebase CMS 설정
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

# Cafe24 설정
VITE_CAFE24_CLIENT_ID=pdlW6CsXBxzlapLweKKeEF
VITE_CAFE24_CLIENT_SECRET=sRXnrcXTGJEtduydNZiQHC
VITE_CAFE24_SHOP_ID=sugardeco
VITE_CAFE24_REDIRECT_URI=http://localhost:3000/products
```

## 🚀 배포 후 확인

### 1. 변경사항 배포
```bash
git add .
git commit -m "Fix Cafe24 OAuth authorization header"
git push
```

### 2. Vercel 자동 배포 확인
- Vercel 대시보드에서 배포 상태 확인
- 배포 완료 후 URL 확인

### 3. 프로덕션 테스트
1. https://art-cms-alpha.vercel.app 접속
2. 로그인
3. "Cafe24 상품" 메뉴 클릭
4. "Cafe24 연동하기" 클릭
5. OAuth 인증 진행

## 🐛 문제 해결

### "invalid_client" 에러
- Vercel 환경변수가 설정되었는지 확인
- `CAFE24_` 접두사 버전과 `VITE_CAFE24_` 버전 모두 설정했는지 확인

### "Enter an authorization header" 에러
- API Routes에 Basic Auth 헤더가 포함되었는지 확인
- Client ID와 Secret이 올바른지 확인

### 환경변수 확인 방법
Vercel Functions 로그에서:
1. Vercel 대시보드 → Functions 탭
2. `api/auth/cafe24/token` 함수 선택
3. 로그 확인

## 📌 체크리스트

- [ ] Vercel에 모든 환경변수 설정 (CAFE24_와 VITE_CAFE24_ 둘 다)
- [ ] Cafe24 개발자 센터에 Redirect URI 등록
- [ ] API Routes 파일 업데이트 및 배포
- [ ] 프로덕션 환경에서 OAuth 테스트

## 🔐 보안 주의사항

1. **Client Secret은 절대 클라이언트 코드에 노출되면 안됨**
2. **API Routes에서만 Secret 사용**
3. **환경변수는 Vercel 대시보드에서만 설정**
4. **`.env` 파일은 절대 Git에 커밋하지 않음**