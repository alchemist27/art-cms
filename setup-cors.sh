#!/bin/bash

# Firebase Storage CORS 설정 스크립트

echo "Firebase Storage CORS 설정을 시작합니다..."

# CORS 설정 파일 생성
cat > cors.json << EOF
[
  {
    "origin": ["*"],
    "method": ["GET", "HEAD", "PUT", "POST", "DELETE"],
    "maxAgeSeconds": 3600,
    "responseHeader": ["Content-Type"]
  }
]
EOF

echo "CORS 설정 파일이 생성되었습니다."
echo ""
echo "이제 다음 단계를 수행하세요:"
echo ""
echo "1. Google Cloud SDK가 설치되어 있지 않다면:"
echo "   brew install google-cloud-sdk"
echo ""
echo "2. Google Cloud 인증:"
echo "   gcloud auth login"
echo ""
echo "3. 프로젝트 설정:"
echo "   gcloud config set project artstudio-cms"
echo ""
echo "4. CORS 설정 적용:"
echo "   gsutil cors set cors.json gs://artstudio-cms.firebasestorage.app"
echo ""
echo "5. 설정 확인:"
echo "   gsutil cors get gs://artstudio-cms.firebasestorage.app"