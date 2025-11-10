import { cafe24Db, cafe24Auth } from '../config/firebaseCafe24.js';
import { auth } from '../config/firebase.js';
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';

class Cafe24TokenService {
    constructor() {
        this.collection = 'cafe24_tokens';
        this.db = cafe24Db; // Cafe24 전용 Firestore 사용
    }

    async getCurrentUserId() {
        // 먼저 CMS auth에서 사용자 확인
        const user = auth.currentUser;
        if (!user) {
            // Firebase 인증 없이도 사용 가능하도록 로컬 ID 사용
            return 'local_user';
        }
        return user.uid;
    }

    async saveTokens(accessToken, refreshToken, expiresIn) {
        try {
            const userId = await this.getCurrentUserId();
            const tokenDoc = doc(this.db, this.collection, userId);
            
            const tokenData = {
                accessToken: accessToken,
                refreshToken: refreshToken,
                expiresAt: new Date(Date.now() + (expiresIn * 1000)).toISOString(),
                updatedAt: new Date().toISOString(),
                userId: userId
            };

            await setDoc(tokenDoc, tokenData);
            
            // 로컬 스토리지에도 임시 저장 (빠른 접근용)
            localStorage.setItem('cafe24_access_token', accessToken);
            localStorage.setItem('cafe24_refresh_token', refreshToken);
            localStorage.setItem('cafe24_expires_at', tokenData.expiresAt);
            
            return tokenData;
        } catch (error) {
            console.error('Error saving tokens:', error);
            throw error;
        }
    }

    async getTokens() {
        try {
            const userId = await this.getCurrentUserId();
            const tokenDoc = doc(this.db, this.collection, userId);
            const docSnap = await getDoc(tokenDoc);

            if (docSnap.exists()) {
                const data = docSnap.data();
                
                // 토큰 만료 확인
                const expiresAt = new Date(data.expiresAt);
                const now = new Date();
                
                if (expiresAt <= now) {
                    console.log('Token expired, needs refresh');
                    return { expired: true, refreshToken: data.refreshToken };
                }
                
                return {
                    accessToken: data.accessToken,
                    refreshToken: data.refreshToken,
                    expiresAt: data.expiresAt,
                    expired: false
                };
            }
            
            // Firestore에 없으면 로컬 스토리지 확인
            const localAccessToken = localStorage.getItem('cafe24_access_token');
            const localRefreshToken = localStorage.getItem('cafe24_refresh_token');
            const localExpiresAt = localStorage.getItem('cafe24_expires_at');
            
            if (localAccessToken && localRefreshToken) {
                // 로컬 스토리지에 있으면 Firestore에 저장
                await this.saveTokens(
                    localAccessToken, 
                    localRefreshToken, 
                    Math.floor((new Date(localExpiresAt) - new Date()) / 1000)
                );
                
                return {
                    accessToken: localAccessToken,
                    refreshToken: localRefreshToken,
                    expiresAt: localExpiresAt,
                    expired: false
                };
            }
            
            return null;
        } catch (error) {
            console.error('Error getting tokens:', error);
            
            // 오류 시 로컬 스토리지 확인
            const localAccessToken = localStorage.getItem('cafe24_access_token');
            const localRefreshToken = localStorage.getItem('cafe24_refresh_token');
            const localExpiresAt = localStorage.getItem('cafe24_expires_at');
            
            if (localAccessToken) {
                return {
                    accessToken: localAccessToken,
                    refreshToken: localRefreshToken,
                    expiresAt: localExpiresAt,
                    expired: false
                };
            }
            
            return null;
        }
    }

    async updateTokens(accessToken, refreshToken, expiresIn) {
        try {
            const userId = await this.getCurrentUserId();
            const tokenDoc = doc(this.db, this.collection, userId);
            
            const tokenData = {
                accessToken: accessToken,
                refreshToken: refreshToken,
                expiresAt: new Date(Date.now() + (expiresIn * 1000)).toISOString(),
                updatedAt: new Date().toISOString()
            };

            await updateDoc(tokenDoc, tokenData);
            
            // 로컬 스토리지도 업데이트
            localStorage.setItem('cafe24_access_token', accessToken);
            localStorage.setItem('cafe24_refresh_token', refreshToken);
            localStorage.setItem('cafe24_expires_at', tokenData.expiresAt);
            
            return tokenData;
        } catch (error) {
            console.error('Error updating tokens:', error);
            throw error;
        }
    }

    async deleteTokens() {
        try {
            const userId = await this.getCurrentUserId();
            const tokenDoc = doc(this.db, this.collection, userId);
            
            await deleteDoc(tokenDoc);
            
            // 로컬 스토리지에서도 삭제
            localStorage.removeItem('cafe24_access_token');
            localStorage.removeItem('cafe24_refresh_token');
            localStorage.removeItem('cafe24_expires_at');
            
            return true;
        } catch (error) {
            console.error('Error deleting tokens:', error);
            
            // 로컬 스토리지는 삭제
            localStorage.removeItem('cafe24_access_token');
            localStorage.removeItem('cafe24_refresh_token');
            localStorage.removeItem('cafe24_expires_at');
            
            throw error;
        }
    }

    async isAuthenticated() {
        const tokens = await this.getTokens();
        return tokens && !tokens.expired && tokens.accessToken;
    }
}

export const cafe24TokenService = new Cafe24TokenService();