import { cafe24Config, getCafe24ApiUrl } from '../config/cafe24.js';
import { cafe24TokenService } from './cafe24TokenService.js';

class Cafe24ApiService {
    constructor() {
        this.shopId = cafe24Config.shopId;
        this.tokenService = cafe24TokenService;
    }

    async setTokens(accessToken, refreshToken, expiresIn = 7200) {
        await this.tokenService.saveTokens(accessToken, refreshToken, expiresIn);
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
    }

    async clearTokens() {
        await this.tokenService.deleteTokens();
        this.accessToken = null;
        this.refreshToken = null;
    }

    async isAuthenticated() {
        const tokens = await this.tokenService.getTokens();
        if (tokens && !tokens.expired) {
            this.accessToken = tokens.accessToken;
            this.refreshToken = tokens.refreshToken;
            return true;
        }
        return false;
    }

    async getAccessToken() {
        const tokens = await this.tokenService.getTokens();
        
        if (!tokens) {
            throw new Error('Not authenticated with Cafe24');
        }

        if (tokens.expired && tokens.refreshToken) {
            // 토큰이 만료되면 자동으로 갱신
            await this.refreshAccessToken();
            const newTokens = await this.tokenService.getTokens();
            return newTokens.accessToken;
        }

        return tokens.accessToken;
    }

    async exchangeCodeForToken(code) {
        try {
            console.log('Exchanging code for token...');

            // Vercel 서버리스 함수를 통해 토큰 교환
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

            const data = await response.json();

            if (!response.ok) {
                console.error('Token exchange failed:', data);
                throw new Error(data.error_description || 'Failed to exchange code for token');
            }

            console.log('Token exchange successful');
            await this.setTokens(data.access_token, data.refresh_token, data.expires_in || 7200);
            return data;
        } catch (error) {
            console.error('Token exchange error:', error);
            throw error;
        }
    }

    async refreshAccessToken() {
        try {
            const tokens = await this.tokenService.getTokens();
            
            if (!tokens || !tokens.refreshToken) {
                throw new Error('No refresh token available');
            }

            const response = await fetch('/api/auth/cafe24/refresh', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    grant_type: 'refresh_token',
                    refresh_token: tokens.refreshToken,
                    client_id: cafe24Config.clientId,
                    client_secret: cafe24Config.clientSecret
                })
            });

            if (!response.ok) {
                throw new Error('Failed to refresh token');
            }

            const data = await response.json();
            await this.setTokens(data.access_token, data.refresh_token, data.expires_in || 7200);
            return data;
        } catch (error) {
            console.error('Token refresh error:', error);
            await this.clearTokens();
            throw error;
        }
    }

    async makeApiRequest(endpoint, options = {}) {
        const isAuth = await this.isAuthenticated();
        if (!isAuth) {
            throw new Error('Not authenticated with Cafe24');
        }

        const accessToken = await this.getAccessToken();
        const url = getCafe24ApiUrl(endpoint);
        const headers = {
            'Authorization': `Bearer ${accessToken}`,
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
                // 토큰이 만료되었으면 갱신 후 재시도
                await this.refreshAccessToken();
                const newAccessToken = await this.getAccessToken();
                response = await fetch(url, {
                    ...options,
                    headers: {
                        ...headers,
                        'Authorization': `Bearer ${newAccessToken}`
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

    async getCategory(categoryNo) {
        const endpoint = `/admin/categories/${categoryNo}`;
        const response = await this.makeApiRequest(endpoint);
        return response.category;
    }

    async createCategory(categoryData) {
        const endpoint = '/admin/categories';
        const response = await this.makeApiRequest(endpoint, {
            method: 'POST',
            body: JSON.stringify({
                shop_no: this.shopId,
                category: categoryData
            })
        });
        return response.category;
    }

    async updateCategory(categoryNo, categoryData) {
        const endpoint = `/admin/categories/${categoryNo}`;
        const response = await this.makeApiRequest(endpoint, {
            method: 'PUT',
            body: JSON.stringify({
                shop_no: this.shopId,
                category: categoryData
            })
        });
        return response.category;
    }

    async deleteCategory(categoryNo) {
        const endpoint = `/admin/categories/${categoryNo}`;
        await this.makeApiRequest(endpoint, {
            method: 'DELETE'
        });
        return true;
    }

    async createProduct(productData) {
        const endpoint = '/admin/products';
        const response = await this.makeApiRequest(endpoint, {
            method: 'POST',
            body: JSON.stringify({
                shop_no: this.shopId,
                product: productData
            })
        });
        return response.product;
    }

    async updateProduct(productNo, productData) {
        const endpoint = `/admin/products/${productNo}`;
        const response = await this.makeApiRequest(endpoint, {
            method: 'PUT',
            body: JSON.stringify({
                shop_no: this.shopId,
                product: productData
            })
        });
        return response.product;
    }

    async deleteProduct(productNo) {
        const endpoint = `/admin/products/${productNo}`;
        await this.makeApiRequest(endpoint, {
            method: 'DELETE'
        });
        return true;
    }

    async updateProductPrice(productNo, priceData) {
        const endpoint = `/admin/products/${productNo}/price`;
        const response = await this.makeApiRequest(endpoint, {
            method: 'PUT',
            body: JSON.stringify({
                shop_no: this.shopId,
                ...priceData
            })
        });
        return response;
    }

    async updateProductDisplay(productNo, display) {
        const endpoint = `/admin/products/${productNo}/display`;
        const response = await this.makeApiRequest(endpoint, {
            method: 'PUT',
            body: JSON.stringify({
                shop_no: this.shopId,
                display: display ? 'T' : 'F'
            })
        });
        return response;
    }

    async updateProductSelling(productNo, selling) {
        const endpoint = `/admin/products/${productNo}/selling`;
        const response = await this.makeApiRequest(endpoint, {
            method: 'PUT',
            body: JSON.stringify({
                shop_no: this.shopId,
                selling: selling ? 'T' : 'F'
            })
        });
        return response;
    }

    async updateProductStock(productNo, variantCode, quantity) {
        const endpoint = `/admin/products/${productNo}/variants/${variantCode}/inventory`;
        const response = await this.makeApiRequest(endpoint, {
            method: 'PUT',
            body: JSON.stringify({
                shop_no: this.shopId,
                stock_quantity: quantity
            })
        });
        return response;
    }

    async searchProducts(keyword) {
        const params = {
            product_name: keyword
        };
        return await this.getProducts(params);
    }

    async getProductsByCategory(categoryNo) {
        const params = {
            category: categoryNo
        };
        return await this.getProducts(params);
    }
}

export const cafe24Api = new Cafe24ApiService();