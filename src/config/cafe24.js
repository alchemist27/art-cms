export const cafe24Config = {
    clientId: import.meta.env.VITE_CAFE24_CLIENT_ID || '',
    clientSecret: import.meta.env.VITE_CAFE24_CLIENT_SECRET || '',
    shopId: import.meta.env.VITE_CAFE24_SHOP_ID || '',
    redirectUri: import.meta.env.VITE_CAFE24_REDIRECT_URI || window.location.origin + '/api/auth/cafe24/callback',
    apiVersion: '2024-06-01',
    baseUrl: 'https://api.cafe24.com',
    scope: 'mall.read_product'
};

export const getAuthUrl = () => {
    const params = new URLSearchParams({
        response_type: 'code',
        client_id: cafe24Config.clientId,
        redirect_uri: cafe24Config.redirectUri,
        scope: cafe24Config.scope,
        shop_no: cafe24Config.shopId
    });

    return `https://${cafe24Config.shopId}.cafe24api.com/api/v2/oauth/authorize?${params.toString()}`;
};

export const getCafe24ApiUrl = (endpoint) => {
    return `https://${cafe24Config.shopId}.cafe24api.com/api/v2${endpoint}`;
};