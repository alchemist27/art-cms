export default async function handler(req, res) {
    // CORS 헤더 설정
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        let endpoint, method, body, accessToken;

        if (req.method === 'GET') {
            // GET 요청 처리
            endpoint = req.query.endpoint;
            method = 'GET';
            accessToken = req.headers.authorization?.replace('Bearer ', '');
        } else {
            // POST, PUT, DELETE 요청 처리
            ({ endpoint, method, body } = req.body);
            accessToken = req.headers.authorization?.replace('Bearer ', '');
        }

        console.log('Proxy request:', {
            endpoint,
            method,
            hasAccessToken: !!accessToken,
            shopId: process.env.CAFE24_SHOP_ID || process.env.VITE_CAFE24_SHOP_ID
        });

        if (!endpoint) {
            return res.status(400).json({ 
                error: 'Bad Request',
                message: 'Endpoint is required' 
            });
        }

        if (!accessToken) {
            return res.status(401).json({ 
                error: 'Unauthorized',
                message: 'Access token is required' 
            });
        }

        // Cafe24 API URL 구성
        // endpoint가 이미 쿼리 파라미터를 포함하고 있음
        const shopId = process.env.CAFE24_SHOP_ID || process.env.VITE_CAFE24_SHOP_ID || 'sugardeco';
        const apiUrl = `https://${shopId}.cafe24api.com/api/v2${endpoint}`;

        console.log('Proxying to Cafe24 API:', apiUrl);

        // Cafe24 API 호출
        const headers = {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'X-Cafe24-Api-Version': '2025-06-01'
        };

        const options = {
            method: method || 'GET',
            headers: headers
        };

        if (method !== 'GET' && body) {
            options.body = typeof body === 'string' ? body : JSON.stringify(body);
        }

        const response = await fetch(apiUrl, options);
        
        // 응답 본문이 있는지 확인
        const responseText = await response.text();
        let data;
        
        try {
            data = responseText ? JSON.parse(responseText) : {};
        } catch (parseError) {
            console.error('Failed to parse response:', responseText);
            data = { error: 'Invalid response from Cafe24 API', response: responseText };
        }

        if (!response.ok) {
            console.error('Cafe24 API error:', {
                status: response.status,
                statusText: response.statusText,
                data
            });
            return res.status(response.status).json({
                error: data.error || response.statusText,
                error_description: data.error_description || 'API request failed',
                details: data
            });
        }

        return res.status(200).json(data);
    } catch (error) {
        console.error('Proxy error:', error);
        return res.status(500).json({ 
            error: 'Internal server error', 
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
}