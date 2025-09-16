import { cafe24Config, getCafe24ApiUrl } from '../config/cafe24.js';

class Cafe24ApiService {
    constructor() {
        this.accessToken = localStorage.getItem('cafe24_access_token');
        this.refreshToken = localStorage.getItem('cafe24_refresh_token');
        this.shopId = cafe24Config.shopId;
    }

    setTokens(accessToken, refreshToken) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        localStorage.setItem('cafe24_access_token', accessToken);
        localStorage.setItem('cafe24_refresh_token', refreshToken);
    }

    clearTokens() {
        this.accessToken = null;
        this.refreshToken = null;
        localStorage.removeItem('cafe24_access_token');
        localStorage.removeItem('cafe24_refresh_token');
    }

    isAuthenticated() {
        return !!this.accessToken;
    }

    async exchangeCodeForToken(code) {
        try {
            const response = await fetch('/api/auth/cafe24/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    grant_type: 'authorization_code',
                    code: code,
                    client_id: cafe24Config.clientId,
                    client_secret: cafe24Config.clientSecret,
                    redirect_uri: cafe24Config.redirectUri
                })
            });

            if (!response.ok) {
                throw new Error('Failed to exchange code for token');
            }

            const data = await response.json();
            this.setTokens(data.access_token, data.refresh_token);
            return data;
        } catch (error) {
            console.error('Token exchange error:', error);
            throw error;
        }
    }

    async refreshAccessToken() {
        try {
            const response = await fetch('/api/auth/cafe24/refresh', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    grant_type: 'refresh_token',
                    refresh_token: this.refreshToken,
                    client_id: cafe24Config.clientId,
                    client_secret: cafe24Config.clientSecret
                })
            });

            if (!response.ok) {
                throw new Error('Failed to refresh token');
            }

            const data = await response.json();
            this.setTokens(data.access_token, data.refresh_token);
            return data;
        } catch (error) {
            console.error('Token refresh error:', error);
            this.clearTokens();
            throw error;
        }
    }

    async makeApiRequest(endpoint, options = {}) {
        if (!this.isAuthenticated()) {
            throw new Error('Not authenticated with Cafe24');
        }

        const url = getCafe24ApiUrl(endpoint);
        const headers = {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
            'X-Cafe24-Api-Version': cafe24Config.apiVersion,
            ...options.headers
        };

        try {
            let response = await fetch(url, {
                ...options,
                headers
            });

            if (response.status === 401) {
                await this.refreshAccessToken();
                response = await fetch(url, {
                    ...options,
                    headers: {
                        ...headers,
                        'Authorization': `Bearer ${this.accessToken}`
                    }
                });
            }

            if (!response.ok) {
                throw new Error(`API request failed: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request error:', error);
            throw error;
        }
    }

    async getProducts(params = {}) {
        const queryParams = new URLSearchParams({
            display: params.display || 'T',
            selling: params.selling || 'T',
            limit: params.limit || 100,
            offset: params.offset || 0,
            ...params
        });

        const endpoint = `/admin/products?${queryParams.toString()}`;
        const response = await this.makeApiRequest(endpoint);
        return response.products || [];
    }

    async getProduct(productNo) {
        const endpoint = `/admin/products/${productNo}`;
        const response = await this.makeApiRequest(endpoint);
        return response.product;
    }

    async getProductInventory(productNo) {
        const endpoint = `/admin/products/${productNo}/inventories`;
        const response = await this.makeApiRequest(endpoint);
        return response.inventories || [];
    }

    async getProductImages(productNo) {
        const endpoint = `/admin/products/${productNo}/images`;
        const response = await this.makeApiRequest(endpoint);
        return response.images || [];
    }

    async getCategories() {
        const endpoint = '/admin/categories';
        const response = await this.makeApiRequest(endpoint);
        return response.categories || [];
    }

    async searchProducts(keyword) {
        const params = {
            product_name: keyword
        };
        return await this.getProducts(params);
    }
}

export const cafe24Api = new Cafe24ApiService();