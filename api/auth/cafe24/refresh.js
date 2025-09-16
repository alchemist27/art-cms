export default async function handler(req, res) {
    // CORS 헤더 설정
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { refresh_token } = req.body;

    try {
        // Vercel 환경변수 사용 (VITE_ 접두사 없이)
        const shopId = process.env.CAFE24_SHOP_ID || process.env.VITE_CAFE24_SHOP_ID || 'sugardeco';
        const clientId = process.env.CAFE24_CLIENT_ID || process.env.VITE_CAFE24_CLIENT_ID;
        const clientSecret = process.env.CAFE24_CLIENT_SECRET || process.env.VITE_CAFE24_CLIENT_SECRET;
        
        const tokenUrl = `https://${shopId}.cafe24api.com/api/v2/oauth/token`;
        
        // Basic Authentication 헤더 생성
        const authString = `${clientId}:${clientSecret}`;
        const authBase64 = Buffer.from(authString).toString('base64');

        const params = new URLSearchParams();
        params.append('grant_type', 'refresh_token');
        params.append('refresh_token', refresh_token);

        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${authBase64}`,
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': 'application/json'
            },
            body: params.toString()
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('Cafe24 token refresh failed:', data);
            return res.status(response.status).json(data);
        }

        return res.status(200).json(data);
    } catch (error) {
        console.error('Token refresh error:', error);
        return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
}