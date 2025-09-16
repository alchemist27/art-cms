# Cafe24 API 연동 가이드

## 개요
이 가이드는 CMS 대시보드에서 Cafe24 쇼핑몰의 상품 정보를 연동하는 방법을 설명합니다.

## 1. Cafe24 개발자 센터에서 앱 등록

1. [Cafe24 개발자 센터](https://developers.cafe24.com) 접속
2. 로그인 후 "앱 만들기" 클릭
3. 다음 정보를 입력:
   - **앱 이름**: Sugardeco CMS
   - **앱 설명**: 슈가데코 CMS 상품 관리 시스템
   - **앱 URL**: https://your-domain.vercel.app

4. OAuth 설정:
   - **Redirect URI**: `https://your-domain.vercel.app/api/auth/cafe24/callback`
   - **Scope 설정**: 
     - `mall.read_product` (상품 조회 권한) - 필수

5. 앱 등록 완료 후 다음 정보를 확인:
   - Client ID
   - Client Secret
   - Shop ID (쇼핑몰 ID)

## 2. Vercel 환경 변수 설정

Vercel 대시보드에서 다음 환경 변수를 설정합니다:

1. [Vercel 대시보드](https://vercel.com) 접속
2. 프로젝트 선택
3. Settings → Environment Variables
4. 다음 변수들을 추가:

```
VITE_CAFE24_CLIENT_ID=발급받은_클라이언트_ID
VITE_CAFE24_CLIENT_SECRET=발급받은_클라이언트_시크릿
VITE_CAFE24_SHOP_ID=쇼핑몰_ID
VITE_CAFE24_REDIRECT_URI=https://your-domain.vercel.app/api/auth/cafe24/callback
```

## 3. 로컬 개발 환경 설정

로컬에서 테스트하려면 프로젝트 루트에 `.env` 파일을 생성:

```env
VITE_CAFE24_CLIENT_ID=발급받은_클라이언트_ID
VITE_CAFE24_CLIENT_SECRET=발급받은_클라이언트_시크릿
VITE_CAFE24_SHOP_ID=쇼핑몰_ID
VITE_CAFE24_REDIRECT_URI=http://localhost:5173/api/auth/cafe24/callback
```

## 4. 사용 방법

1. CMS 대시보드 로그인
2. 좌측 사이드바에서 "Cafe24 상품" 메뉴 클릭
3. 처음 접속 시 "Cafe24 연동하기" 버튼 클릭
4. Cafe24 OAuth 인증 진행
5. 인증 완료 후 상품 목록이 자동으로 표시됨

## 5. 주요 기능

- **상품 목록 조회**: 페이지당 20개씩 상품 표시
- **상품 검색**: 상품명으로 검색 가능
- **상품 상세 보기**: 상품 클릭 시 상세 정보 모달 표시
  - 기본 정보 (상품코드, 등록일 등)
  - 가격 정보 (판매가, 소비자가, 공급가)
  - 재고 정보
  - 판매/진열 상태
- **페이지네이션**: 이전/다음 버튼으로 페이지 이동

## 6. API 엔드포인트

프로젝트는 다음 API 엔드포인트를 사용합니다:

- `/api/auth/cafe24/token` - 액세스 토큰 발급
- `/api/auth/cafe24/refresh` - 토큰 갱신
- `/api/auth/cafe24/callback` - OAuth 콜백 처리

## 7. 보안 주의사항

- **Client Secret은 절대 공개되지 않도록 주의**
- 환경 변수는 반드시 서버 사이드에서만 사용
- 프로덕션 환경에서는 반드시 HTTPS 사용
- `.env` 파일은 `.gitignore`에 포함되어야 함

## 8. 문제 해결

### 인증 실패 시
- Client ID, Secret이 올바른지 확인
- Redirect URI가 Cafe24 앱 설정과 정확히 일치하는지 확인
- Shop ID가 올바른지 확인

### 상품이 표시되지 않을 때
- 브라우저 콘솔에서 에러 메시지 확인
- 네트워크 탭에서 API 호출 상태 확인
- 토큰이 만료되었다면 다시 로그인

### CORS 에러 발생 시
- Vercel의 API Routes를 통해 프록시 처리되므로 일반적으로 발생하지 않음
- 로컬 개발 시 Vite 프록시 설정 확인

## 9. 추가 개발 가능 기능

현재 구현된 기능은 상품 조회만 가능합니다. 추가로 다음 기능들을 구현할 수 있습니다:

- 상품 정보 수정 (`mall.write_product` 권한 필요)
- 카테고리별 상품 필터링
- 상품 이미지 갤러리
- 엑셀 내보내기
- 재고 알림 설정

## 10. 참고 자료

- [Cafe24 개발자 센터](https://developers.cafe24.com)
- [Cafe24 API 문서](https://developers.cafe24.com/docs/api/)
- [OAuth 2.0 인증 가이드](https://developers.cafe24.com/docs/api/admin/#oauth)