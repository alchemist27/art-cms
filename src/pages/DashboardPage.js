import { db } from '../config/firebase.js';
import { collection, getDocs } from 'firebase/firestore';
import { router } from '../router.js';
import { Sidebar } from '../components/Sidebar.js';

export class DashboardPage {
    constructor(container) {
        this.container = container;
        this.stats = {
            products: 0,
            backgrounds: 0,
            totalUploads: 0
        };
        this.render();
        this.loadStats();
    }
    
    async loadStats() {
        try {
            // 제품 이미지 개수 가져오기
            const productsSnapshot = await getDocs(collection(db, 'products'));
            this.stats.products = productsSnapshot.size;
            
            // 배경 이미지 개수 가져오기
            const backgroundsSnapshot = await getDocs(collection(db, 'backgrounds'));
            this.stats.backgrounds = backgroundsSnapshot.size;
            
            this.stats.totalUploads = this.stats.products + this.stats.backgrounds;
            
            this.updateStatsDisplay();
        } catch (error) {
            console.error('통계 로드 실패:', error);
        }
    }
    
    updateStatsDisplay() {
        document.getElementById('productCount').textContent = this.stats.products;
        document.getElementById('backgroundCount').textContent = this.stats.backgrounds;
        document.getElementById('totalCount').textContent = this.stats.totalUploads;
    }
    
    render() {
        this.container.innerHTML = `
            <div class="dashboard-container">
                ${Sidebar.render('dashboard')}
                
                <div class="main-content">
                    <div class="page-header">
                        <h1 class="page-title">대시보드</h1>
                        <p class="page-subtitle">슈가데코 CMS 관리 시스템</p>
                    </div>
                    
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-header">
                                <span class="stat-title">제품 이미지</span>
                            </div>
                            <div class="stat-value" id="productCount">0</div>
                        </div>
                        
                        <div class="stat-card">
                            <div class="stat-header">
                                <span class="stat-title">배경 이미지</span>
                            </div>
                            <div class="stat-value" id="backgroundCount">0</div>
                        </div>
                        
                        <div class="stat-card">
                            <div class="stat-header">
                                <span class="stat-title">전체 업로드</span>
                            </div>
                            <div class="stat-value" id="totalCount">0</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // 사이드바 이벤트 연결
        Sidebar.attachEvents();
    }
}