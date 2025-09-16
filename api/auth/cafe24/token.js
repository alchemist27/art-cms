export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { grant_type, code, client_id, client_secret, redirect_uri, refresh_token } = req.body;

    try {
        const shopId = process.env.VITE_CAFE24_SHOP_ID;
        const tokenUrl = `https://${shopId}.cafe24api.com/api/v2/oauth/token`;

        const params = new URLSearchParams();
        params.append('grant_type', grant_type);
        params.append('client_id', client_id || process.env.VITE_CAFE24_CLIENT_ID);
        params.append('client_secret', client_secret || process.env.VITE_CAFE24_CLIENT_SECRET);

        if (grant_type === 'authorization_code') {
            params.append('code', code);
            params.append('redirect_uri', redirect_uri);
        } else if (grant_type === 'refresh_token') {
            params.append('refresh_token', refresh_token);
        }

        const response = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString()
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json(data);
        }

        return res.status(200).json(data);
    } catch (error) {
        console.error('Token exchange error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}