export const cafe24Config = {
    clientId: import.meta.env.VITE_CAFE24_CLIENT_ID || '',
    clientSecret: import.meta.env.VITE_CAFE24_CLIENT_SECRET || '',
    shopId: import.meta.env.VITE_CAFE24_SHOP_ID || '',
    redirectUri: import.meta.env.VITE_CAFE24_REDIRECT_URI || `${window.location.origin}/products`,
    apiVersion: '2025-06-01',
    baseUrl: 'https://api.cafe24.com',
    scope: 'mall.read_category,mall.write_category,mall.read_product,mall.write_product',
    // Firebase Functions URLs (프로덕션에서는 환경변수로 설정)
    functionsUrl: import.meta.env.VITE_FIREBASE_FUNCTIONS_URL || 'https://us-central1-artstudio-cms.cloudfunctions.net'
};

export const getAuthUrl = () => {
    // Cafe24 OAuth 2.0 인증 URL 생성
    // 주의: redirect_uri는 Cafe24 개발자 센터에 등록된 것과 정확히 일치해야 함
    const authUrl = `https://${cafe24Config.shopId}.cafe24.com/api/v2/oauth/authorize`;
    
    const params = new URLSearchParams({
        response_type: 'code',
        client_id: cafe24Config.clientId,
        state: 'cafe24_auth',
        redirect_uri: cafe24Config.redirectUri,
        scope: cafe24Config.scope
    });

    const fullUrl = `${authUrl}?${params.toString()}`;
    
    console.log('Cafe24 Auth URL:', fullUrl);
    console.log('Redirect URI:', cafe24Config.redirectUri);
    console.log('Client ID:', cafe24Config.clientId);
    console.log('Shop ID:', cafe24Config.shopId);
    console.log('Scope:', cafe24Config.scope);
    
    return fullUrl;
};

export const getCafe24ApiUrl = (endpoint) => {
    return `https://${cafe24Config.shopId}.cafe24api.com/api/v2${endpoint}`;
};