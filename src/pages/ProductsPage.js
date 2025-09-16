import { Sidebar } from '../components/Sidebar.js';
import { cafe24Api } from '../services/cafe24Api.js';
import { getAuthUrl } from '../config/cafe24.js';

export class ProductsPage {
    constructor(container) {
        this.container = container;
        this.products = [];
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.isLoading = false;
        this.searchKeyword = '';
        
        this.render();
        this.checkAuthAndLoadProducts();
    }

    async checkAuthAndLoadProducts() {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');

        if (code) {
            try {
                await cafe24Api.exchangeCodeForToken(code);
                window.history.replaceState({}, '', '/cms/products');
                await this.loadProducts();
            } catch (error) {
                console.error('Token exchange failed:', error);
                this.showAuthButton();
            }
        } else if (cafe24Api.isAuthenticated()) {
            await this.loadProducts();
        } else {
            this.showAuthButton();
        }
    }

    showAuthButton() {
        const productsContainer = document.getElementById('productsContainer');
        if (productsContainer) {
            productsContainer.innerHTML = `
                <div class="auth-container">
                    <div class="auth-card">
                        <h2>Cafe24 연동이 필요합니다</h2>
                        <p>상품 정보를 가져오려면 Cafe24 계정과 연동이 필요합니다.</p>
                        <button class="btn btn-primary" onclick="window.location.href='${getAuthUrl()}'">
                            Cafe24 연동하기
                        </button>
                    </div>
                </div>
            `;
        }
    }

    async loadProducts() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.updateLoadingState(true);

        try {
            const offset = (this.currentPage - 1) * this.itemsPerPage;
            const params = {
                limit: this.itemsPerPage,
                offset: offset
            };

            if (this.searchKeyword) {
                params.product_name = this.searchKeyword;
            }

            this.products = await cafe24Api.getProducts(params);
            this.displayProducts();
        } catch (error) {
            console.error('Failed to load products:', error);
            this.showError('상품을 불러오는데 실패했습니다.');
            
            if (error.message.includes('Not authenticated')) {
                this.showAuthButton();
            }
        } finally {
            this.isLoading = false;
            this.updateLoadingState(false);
        }
    }

    displayProducts() {
        const productsContainer = document.getElementById('productsContainer');
        if (!productsContainer) return;

        if (this.products.length === 0) {
            productsContainer.innerHTML = `
                <div class="empty-state">
                    <p>표시할 상품이 없습니다.</p>
                </div>
            `;
            return;
        }

        const productsHTML = this.products.map(product => `
            <div class="product-card" data-product-id="${product.product_no}">
                <div class="product-image">
                    ${product.detail_image ? 
                        `<img src="${product.detail_image}" alt="${product.product_name}" onerror="this.src='/placeholder.png'">` :
                        `<div class="no-image">이미지 없음</div>`
                    }
                </div>
                <div class="product-info">
                    <h3 class="product-name">${product.product_name}</h3>
                    <p class="product-code">상품코드: ${product.product_code || 'N/A'}</p>
                    <p class="product-price">
                        판매가: ${this.formatPrice(product.price)} 원
                        ${product.retail_price ? `<br>소비자가: ${this.formatPrice(product.retail_price)} 원` : ''}
                    </p>
                    <p class="product-stock">재고: ${product.stock_quantity || 0}개</p>
                    <div class="product-status">
                        <span class="status-badge ${product.display === 'T' ? 'active' : 'inactive'}">
                            ${product.display === 'T' ? '진열중' : '진열안함'}
                        </span>
                        <span class="status-badge ${product.selling === 'T' ? 'active' : 'inactive'}">
                            ${product.selling === 'T' ? '판매중' : '판매중지'}
                        </span>
                    </div>
                </div>
                <div class="product-actions">
                    <button class="btn btn-sm" onclick="window.productsPage.viewProductDetail('${product.product_no}')">
                        상세보기
                    </button>
                </div>
            </div>
        `).join('');

        productsContainer.innerHTML = `
            <div class="products-grid">
                ${productsHTML}
            </div>
        `;
    }

    async viewProductDetail(productNo) {
        try {
            const product = await cafe24Api.getProduct(productNo);
            const inventory = await cafe24Api.getProductInventory(productNo);
            
            this.showProductModal(product, inventory);
        } catch (error) {
            console.error('Failed to load product detail:', error);
            this.showError('상품 상세정보를 불러오는데 실패했습니다.');
        }
    }

    showProductModal(product, inventory) {
        const modalHTML = `
            <div class="modal-overlay" id="productModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>${product.product_name}</h2>
                        <button class="modal-close" onclick="window.productsPage.closeModal()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="product-detail-grid">
                            <div class="detail-section">
                                <h3>기본 정보</h3>
                                <p><strong>상품코드:</strong> ${product.product_code || 'N/A'}</p>
                                <p><strong>상품번호:</strong> ${product.product_no}</p>
                                <p><strong>등록일:</strong> ${product.created_date || 'N/A'}</p>
                                <p><strong>수정일:</strong> ${product.updated_date || 'N/A'}</p>
                            </div>
                            <div class="detail-section">
                                <h3>가격 정보</h3>
                                <p><strong>판매가:</strong> ${this.formatPrice(product.price)} 원</p>
                                <p><strong>소비자가:</strong> ${this.formatPrice(product.retail_price)} 원</p>
                                <p><strong>공급가:</strong> ${this.formatPrice(product.supply_price)} 원</p>
                            </div>
                            <div class="detail-section">
                                <h3>재고 정보</h3>
                                ${inventory && inventory.length > 0 ? 
                                    inventory.map(inv => `
                                        <p><strong>${inv.option_value || '기본'}:</strong> ${inv.stock_quantity}개</p>
                                    `).join('') :
                                    '<p>재고 정보 없음</p>'
                                }
                            </div>
                            <div class="detail-section">
                                <h3>상태</h3>
                                <p><strong>진열상태:</strong> ${product.display === 'T' ? '진열중' : '진열안함'}</p>
                                <p><strong>판매상태:</strong> ${product.selling === 'T' ? '판매중' : '판매중지'}</p>
                            </div>
                        </div>
                        ${product.detail_image ? 
                            `<div class="product-detail-image">
                                <img src="${product.detail_image}" alt="${product.product_name}">
                            </div>` : ''
                        }
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    closeModal() {
        const modal = document.getElementById('productModal');
        if (modal) {
            modal.remove();
        }
    }

    formatPrice(price) {
        if (!price) return '0';
        return parseInt(price).toLocaleString('ko-KR');
    }

    updateLoadingState(isLoading) {
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = isLoading ? 'block' : 'none';
        }
    }

    showError(message) {
        const errorContainer = document.getElementById('errorContainer');
        if (errorContainer) {
            errorContainer.innerHTML = `
                <div class="error-message">
                    ${message}
                </div>
            `;
            setTimeout(() => {
                errorContainer.innerHTML = '';
            }, 5000);
        }
    }

    async handleSearch(keyword) {
        this.searchKeyword = keyword;
        this.currentPage = 1;
        await this.loadProducts();
    }

    async nextPage() {
        this.currentPage++;
        await this.loadProducts();
    }

    async previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            await this.loadProducts();
        }
    }

    render() {
        this.container.innerHTML = `
            <div class="dashboard-container">
                ${Sidebar.render('products')}
                
                <div class="main-content">
                    <div class="page-header">
                        <h1 class="page-title">Cafe24 상품 관리</h1>
                        <p class="page-subtitle">Cafe24 쇼핑몰에 등록된 상품 정보</p>
                    </div>
                    
                    <div class="controls-section">
                        <div class="search-bar">
                            <input 
                                type="text" 
                                id="searchInput" 
                                placeholder="상품명으로 검색..."
                                class="search-input"
                            >
                            <button class="btn btn-primary" id="searchBtn">검색</button>
                        </div>
                        
                        <div class="pagination-controls">
                            <button class="btn btn-secondary" id="prevBtn" ${this.currentPage === 1 ? 'disabled' : ''}>
                                이전
                            </button>
                            <span class="page-info">페이지 ${this.currentPage}</span>
                            <button class="btn btn-secondary" id="nextBtn">
                                다음
                            </button>
                        </div>
                    </div>
                    
                    <div id="errorContainer"></div>
                    <div id="loadingIndicator" style="display: none;">
                        <div class="spinner">로딩중...</div>
                    </div>
                    
                    <div id="productsContainer" class="products-container">
                        <!-- Products will be loaded here -->
                    </div>
                </div>
            </div>
        `;
        
        Sidebar.attachEvents();
        
        window.productsPage = this;
        
        document.getElementById('searchBtn')?.addEventListener('click', () => {
            const keyword = document.getElementById('searchInput').value;
            this.handleSearch(keyword);
        });
        
        document.getElementById('searchInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSearch(e.target.value);
            }
        });
        
        document.getElementById('prevBtn')?.addEventListener('click', () => this.previousPage());
        document.getElementById('nextBtn')?.addEventListener('click', () => this.nextPage());
    }
}