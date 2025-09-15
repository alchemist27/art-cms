# 슈가데코 CMS

슈가데코 제품 및 배경 이미지 관리 시스템

## 기능

- 관리자 로그인 (정적 계정 인증)
- 대시보드 (통계 확인)
- 이미지 관리
  - 제품 이미지 업로드/삭제
  - 배경 이미지 업로드/삭제
  - 타입별 필터링
  - 색상별 필터링
  - 검색 기능
- 라우터 보호 (로그인 상태 확인)

## 설치 및 실행

### 1. Firebase 설정

1. [Firebase Console](https://console.firebase.google.com)에서 프로젝트 생성
2. Authentication 활성화 (이메일/비밀번호 인증)
3. Firestore Database 생성
4. Storage 생성
5. 프로젝트 설정에서 웹 앱 추가 후 설정 값 복사

### 2. 환경 변수 설정

`.env` 파일 생성 후 Firebase 설정 추가:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. Firebase 설정 파일 업데이트

`src/config/firebase.js` 파일의 설정을 환경 변수로 변경:

```javascript
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};
```

### 4. 관리자 계정 정보

정적 관리자 계정 (src/utils/auth.js에서 변경 가능):
- 이메일: admin@sugardeco.com
- 비밀번호: sugardeco2024!

### 5. Firestore 보안 규칙 설정

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 6. Storage 보안 규칙 설정

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### 7. 실행

```bash
npm install
npm run dev
```

## Vercel 배포

1. [Vercel](https://vercel.com)에 로그인
2. GitHub 저장소 연결
3. 환경 변수 설정 (Settings > Environment Variables)
4. Deploy

## 데이터 구조

### Products Collection
- name: 제품명
- type: 제품 타입
- option: 세부 옵션
- colors: 색상 태그 배열
- imageUrl: 이미지 URL
- storagePath: Storage 경로
- size: { width_mm, height_mm }
- createdAt: 생성일

### Backgrounds Collection
- name: 배경명
- type: 배경 타입
- colors: 색상 태그 배열
- imageUrl: 이미지 URL
- storagePath: Storage 경로
- createdAt: 생성일