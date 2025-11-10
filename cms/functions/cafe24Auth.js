// Firebase Functions for Cafe24 OAuth
// 이 파일은 Firebase Functions에 배포되어야 합니다

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const fetch = require('node-fetch');

// Firebase Admin 초기화
if (admin.apps.length === 0) {
    admin.initializeApp();
}

const db = admin.firestore();

// Cafe24 OAuth 토큰 교환
exports.exchangeCafe24Token = functions.https.onRequest(async (req, res) => {
    // CORS 설정
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }

    try {
        const { code, userId } = req.body;

        if (!code || !userId) {
            res.status(400).json({ error: 'Missing code or userId' });
            return;
        }

        // 환경 변수에서 Cafe24 설정 가져오기
        const clientId = functions.config().cafe24?.client_id || process.env.CAFE24_CLIENT_ID;
        const clientSecret = functions.config().cafe24?.client_secret || process.env.CAFE24_CLIENT_SECRET;
        const shopId = functions.config().cafe24?.shop_id || process.env.CAFE24_SHOP_ID;
        const redirectUri = functions.config().cafe24?.redirect_uri || process.env.CAFE24_REDIRECT_URI;

        // Cafe24 토큰 엔드포인트
        const tokenUrl = `https://${shopId}.cafe24api.com/api/v2/oauth/token`;

        // 토큰 교환 요청
        const params = new URLSearchParams();
        params.append('grant_type', 'authorization_code');
        params.append('code', code);
        params.append('client_id', clientId);
        params.append('client_secret', clientSecret);
        params.append('redirect_uri', redirectUri);

        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString()
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Cafe24 token exchange failed:', data);
            res.status(response.status).json(data);
            return;
        }

        // Firestore에 토큰 저장
        const tokenData = {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresAt: new Date(Date.now() + (data.expires_in * 1000)),
            shopId: shopId,
            userId: userId,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        await db.collection('cafe24_tokens').doc(userId).set(tokenData);

        res.status(200).json({
            success: true,
            expires_in: data.expires_in
        });

    } catch (error) {
        console.error('Error exchanging token:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Cafe24 토큰 갱신
exports.refreshCafe24Token = functions.https.onRequest(async (req, res) => {
    // CORS 설정
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).send('Method Not Allowed');
        return;
    }

    try {
        const { userId } = req.body;

        if (!userId) {
            res.status(400).json({ error: 'Missing userId' });
            return;
        }

        // Firestore에서 현재 토큰 가져오기
        const tokenDoc = await db.collection('cafe24_tokens').doc(userId).get();
        
        if (!tokenDoc.exists) {
            res.status(404).json({ error: 'Token not found' });
            return;
        }

        const tokenData = tokenDoc.data();
        
        // 환경 변수에서 Cafe24 설정 가져오기
        const clientId = functions.config().cafe24.client_id;
        const clientSecret = functions.config().cafe24.client_secret;
        const shopId = tokenData.shopId || functions.config().cafe24.shop_id;

        // Cafe24 토큰 엔드포인트
        const tokenUrl = `https://${shopId}.cafe24api.com/api/v2/oauth/token`;

        // 토큰 갱신 요청
        const params = new URLSearchParams();
        params.append('grant_type', 'refresh_token');
        params.append('refresh_token', tokenData.refreshToken);
        params.append('client_id', clientId);
        params.append('client_secret', clientSecret);

        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString()
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Cafe24 token refresh failed:', data);
            res.status(response.status).json(data);
            return;
        }

        // Firestore에 새 토큰 저장
        const newTokenData = {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresAt: new Date(Date.now() + (data.expires_in * 1000)),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        await db.collection('cafe24_tokens').doc(userId).update(newTokenData);

        res.status(200).json({
            success: true,
            expires_in: data.expires_in
        });

    } catch (error) {
        console.error('Error refreshing token:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Cafe24 API 프록시 (CORS 우회)
exports.cafe24ApiProxy = functions.https.onRequest(async (req, res) => {
    // CORS 설정
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    try {
        const userId = req.headers['x-user-id'];
        const endpoint = req.query.endpoint;

        if (!userId || !endpoint) {
            res.status(400).json({ error: 'Missing userId or endpoint' });
            return;
        }

        // Firestore에서 토큰 가져오기
        const tokenDoc = await db.collection('cafe24_tokens').doc(userId).get();
        
        if (!tokenDoc.exists) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }

        const tokenData = tokenDoc.data();
        const shopId = tokenData.shopId || functions.config().cafe24.shop_id;

        // Cafe24 API 호출
        const apiUrl = `https://${shopId}.cafe24api.com/api/v2${endpoint}`;
        
        const headers = {
            'Authorization': `Bearer ${tokenData.accessToken}`,
            'Content-Type': 'application/json',
            'X-Cafe24-Api-Version': '2025-06-01'
        };

        const options = {
            method: req.method,
            headers: headers
        };

        if (req.method !== 'GET' && req.body) {
            options.body = JSON.stringify(req.body);
        }

        const response = await fetch(apiUrl, options);
        const data = await response.json();

        res.status(response.status).json(data);

    } catch (error) {
        console.error('API proxy error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});