export default async function handler(req, res) {
    // CORS 헤더 설정
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        // 요청 정보 추출
        const { endpoint, method = 'GET', body, accessToken } = req.method === 'GET' 
            ? { endpoint: req.query.endpoint, accessToken: req.headers.authorization?.replace('Bearer ', '') }
            : { ...req.body, accessToken: req.headers.authorization?.replace('Bearer ', '') };

        if (!endpoint) {
            return res.status(400).json({ error: 'Endpoint is required' });
        }

        if (!accessToken) {
            return res.status(401).json({ error: 'Access token is required' });
        }

        // Cafe24 API URL 구성
        const shopId = process.env.CAFE24_SHOP_ID || process.env.VITE_CAFE24_SHOP_ID || 'sugardeco';
        const apiUrl = `https://${shopId}.cafe24api.com/api/v2${endpoint}`;

        console.log('Proxying request to:', apiUrl);

        // Cafe24 API 호출
        const headers = {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'X-Cafe24-Api-Version': '2024-06-01'
        };

        const options = {
            method: method,
            headers: headers
        };

        if (method !== 'GET' && body) {
            options.body = typeof body === 'string' ? body : JSON.stringify(body);
        }

        const response = await fetch(apiUrl, options);
        const data = await response.json();

        if (!response.ok) {
            console.error('Cafe24 API error:', data);
            return res.status(response.status).json(data);
        }

        return res.status(200).json(data);
    } catch (error) {
        console.error('Proxy error:', error);
        return res.status(500).json({ 
            error: 'Internal server error', 
            details: error.message 
        });
    }
}