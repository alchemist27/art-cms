import { Sidebar } from '../components/Sidebar.js';
import { cafe24Api } from '../services/cafe24Api.js';
import { getAuthUrl } from '../config/cafe24.js';
import { productMetadataService } from '../services/productMetadataService.js';

export class ProductsPage {
    constructor(container) {
        this.container = container;
        this.products = [];
        this.currentPage = 1;
        this.itemsPerPage = 100;
        this.isLoading = false;
        this.searchKeyword = '';
        this.searchProductCode = '';
        this.searchProductNo = '';
        
        this.render();
        this.checkAuthAndLoadProducts();
    }

    async checkAuthAndLoadProducts() {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');
        const state = urlParams.get('state');
        const error_description = urlParams.get('error_description');

        console.log('OAuth callback params:', {
            code: code ? 'present' : 'none',
            error,
            state,
            error_description
        });

        // 에러가 있으면 표시
        if (error) {
            console.error('OAuth error:', error, error_description);
            this.showError(`카페24 인증에 실패했습니다: ${error_description || error}`);
            this.showAuthButton();
            return;
        }

        // OAuth 콜백으로 code를 받았을 때
        if (code) {
            // state 확인 (CSRF 보호)
            if (state !== 'cafe24_auth') {
                console.error('Invalid state parameter');
                this.showError('보안 검증에 실패했습니다. 다시 시도해주세요.');
                this.showAuthButton();
                return;
            }

            try {
                console.log('Exchanging code for token...');
                this.showLoadingMessage('Cafe24 연동 중...');
                
                await cafe24Api.exchangeCodeForToken(code);
                
                // URL에서 OAuth 파라미터 제거
                const cleanUrl = window.location.pathname;
                window.history.replaceState({}, '', cleanUrl);
                
                console.log('Token exchange successful, loading products...');
                // 토큰 교환 성공 후 상품 로드
                await this.loadProducts();
            } catch (error) {
                console.error('Token exchange failed:', error);
                this.showError(`토큰 교환에 실패했습니다: ${error.message}`);
                this.showAuthButton();
            }
            return;
        }

        // 이미 인증되어 있는지 확인
        try {
            console.log('Checking authentication status...');
            const isAuthenticated = await cafe24Api.isAuthenticated();
            console.log('Is authenticated:', isAuthenticated);
            
            if (isAuthenticated) {
                await this.loadProducts();
            } else {
                this.showAuthButton();
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            this.showAuthButton();
        }
    }

    showLoadingMessage(message) {
        const productsContainer = document.getElementById('productsContainer');
        if (productsContainer) {
            productsContainer.innerHTML = `
                <div class="loading-container">
                    <div class="spinner"></div>
                    <p>${message}</p>
                </div>
            `;
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
            
            if (this.searchProductCode) {
                params.product_code = this.searchProductCode;
            }
            
            if (this.searchProductNo) {
                params.product_no = this.searchProductNo;
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

    async displayProducts() {
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

        // Load existing metadata for all products
        const productNumbers = this.products.map(p => p.product_no);
        const existingMetadata = await productMetadataService.loadMetadataForProducts(productNumbers);

        const productsHTML = this.products.map((product, index) => {
            const metadata = existingMetadata[product.product_no] || {};
            return `
            <tr class="product-row" data-product-id="${product.product_no}">
                <td class="product-info">
                    <div class="product-no">${product.product_no}</div>
                    <div class="product-code">${product.product_code || '-'}</div>
                </td>
                <td class="product-name">
                    <span class="name-text" title="${product.product_name}">${product.product_name}</span>
                </td>
                <td class="product-input">
                    <select class="input-select product-type" data-product-no="${product.product_no}">
                        <option value="">타입 선택</option>
                        <option value="비즈" ${metadata.type === '비즈' ? 'selected' : ''}>비즈</option>
                        <option value="파츠" ${metadata.type === '파츠' ? 'selected' : ''}>파츠</option>
                        <option value="팬던트" ${metadata.type === '팬던트' ? 'selected' : ''}>팬던트</option>
                        <option value="모루공예" ${metadata.type === '모루공예' ? 'selected' : ''}>모루공예</option>
                        <option value="부재료" ${metadata.type === '부재료' ? 'selected' : ''}>부재료</option>
                        <option value="끈/줄" ${metadata.type === '끈/줄' ? 'selected' : ''}>끈/줄</option>
                        <option value="도구/정리" ${metadata.type === '도구/정리' ? 'selected' : ''}>도구/정리</option>
                    </select>
                </td>
                <td class="product-input">
                    <select class="input-select bead-direction" data-product-no="${product.product_no}">
                        <option value="">방향 선택</option>
                        <option value="가로" ${metadata.direction === '가로' ? 'selected' : ''}>가로</option>
                        <option value="세로" ${metadata.direction === '세로' ? 'selected' : ''}>세로</option>
                    </select>
                </td>
                <td class="product-input">
                    <input type="text" class="input-text product-size" data-product-no="${product.product_no}" value="${metadata.size || ''}" placeholder="예: 10mm">
                </td>
                <td class="product-input">
                    <select class="input-select product-color" data-product-no="${product.product_no}">
                        <option value="">색상 선택</option>
                        <option value="black" ${metadata.color === 'black' ? 'selected' : ''}>블랙</option>
                        <option value="blue" ${metadata.color === 'blue' ? 'selected' : ''}>블루</option>
                        <option value="green" ${metadata.color === 'green' ? 'selected' : ''}>그린</option>
                        <option value="red" ${metadata.color === 'red' ? 'selected' : ''}>레드</option>
                        <option value="yellow" ${metadata.color === 'yellow' ? 'selected' : ''}>옐로우</option>
                        <option value="orange" ${metadata.color === 'orange' ? 'selected' : ''}>오렌지</option>
                        <option value="pink" ${metadata.color === 'pink' ? 'selected' : ''}>핑크</option>
                        <option value="purple" ${metadata.color === 'purple' ? 'selected' : ''}>퍼플</option>
                        <option value="white" ${metadata.color === 'white' ? 'selected' : ''}>화이트</option>
                        <option value="transparent" ${metadata.color === 'transparent' ? 'selected' : ''}>투명</option>
                        <option value="gold" ${metadata.color === 'gold' ? 'selected' : ''}>골드</option>
                        <option value="silver" ${metadata.color === 'silver' ? 'selected' : ''}>실버</option>
                    </select>
                </td>
                <td class="product-input">
                    <input type="text" class="input-text product-keyword" data-product-no="${product.product_no}" value="${metadata.keywords || ''}" placeholder="키워드 입력">
                </td>
                <td class="product-input">
                    <div class="file-upload-wrapper">
                        <input type="file" id="image-${product.product_no}" class="input-file product-image" data-product-no="${product.product_no}" accept="image/*" style="display:none;">
                        <label for="image-${product.product_no}" class="file-upload-btn">
                            <i class="fas fa-upload"></i> ${metadata.imageFileName ? '재업로드' : '업로드'}
                        </label>
                        <span class="file-name" id="filename-${product.product_no}">${metadata.imageFileName || ''}</span>
                    </div>
                </td>
                <td class="product-action">
                    <button class="btn-save" data-product-no="${product.product_no}">저장</button>
                </td>
            </tr>
        `;
        }).join('');

        productsContainer.innerHTML = `
            <div class="products-table-container">
                <table class="products-table">
                    <thead>
                        <tr>
                            <th width="8%">상품정보</th>
                            <th width="10%">상품명</th>
                            <th width="11%">타입</th>
                            <th width="9%">방향</th>
                            <th width="10%">사이즈</th>
                            <th width="11%">색상</th>
                            <th width="15%">키워드</th>
                            <th width="15%">이미지</th>
                            <th width="11%">저장</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${productsHTML}
                    </tbody>
                </table>
            </div>
        `;

        // Add event listeners for all input elements
        this.attachProductEventListeners();
    }

    attachProductEventListeners() {
        // File upload handlers
        document.querySelectorAll('.product-image').forEach(input => {
            input.addEventListener('change', (e) => {
                const productNo = e.target.dataset.productNo;
                const file = e.target.files[0];
                if (file) {
                    const filenameSpan = document.getElementById(`filename-${productNo}`);
                    if (filenameSpan) {
                        filenameSpan.textContent = file.name;
                    }
                }
            });
        });

        // Save button handlers
        document.querySelectorAll('.btn-save').forEach(button => {
            button.addEventListener('click', async (e) => {
                const productNo = e.target.dataset.productNo;
                await this.saveProductMetadata(productNo);
            });
        });
    }

    async saveProductMetadata(productNo) {
        const saveBtn = document.querySelector(`.btn-save[data-product-no="${productNo}"]`);
        const productRow = document.querySelector(`.product-row[data-product-id="${productNo}"]`);
        
        if (!saveBtn || !productRow) return;

        // Get all input values
        const productType = productRow.querySelector('.product-type').value;
        const beadDirection = productRow.querySelector('.bead-direction').value;
        const productSize = productRow.querySelector('.product-size').value;
        const productColor = productRow.querySelector('.product-color').value;
        const productKeyword = productRow.querySelector('.product-keyword').value;
        const imageFile = productRow.querySelector('.product-image').files[0];

        // Show loading state
        saveBtn.classList.add('saving');
        saveBtn.disabled = true;

        try {
            let imageInfo = null;
            
            // Upload image if selected
            if (imageFile) {
                imageInfo = await this.uploadProductImage(productNo, imageFile);
            }

            // Save metadata to Firebase
            const metadata = {
                productNo,
                type: productType,
                direction: beadDirection,
                size: productSize,
                color: productColor,
                keywords: productKeyword,
                imageUrl: imageInfo ? imageInfo.url : null,
                imagePath: imageInfo ? imageInfo.path : null,
                imageFileName: imageInfo ? imageInfo.fileName : null,
                updatedAt: new Date().toISOString()
            };

            await this.saveToFirebase(productNo, metadata);

            // Success feedback
            productRow.classList.add('saved');
            setTimeout(() => {
                productRow.classList.remove('saved');
            }, 1000);

            // Show notification
            this.showNotification('저장되었습니다!', 'success');

        } catch (error) {
            console.error('Error saving product metadata:', error);
            this.showNotification('저장 중 오류가 발생했습니다.', 'error');
        } finally {
            saveBtn.classList.remove('saving');
            saveBtn.disabled = false;
        }
    }

    async uploadProductImage(productNo, file) {
        try {
            const imageInfo = await productMetadataService.uploadImage(productNo, file);
            return imageInfo;
        } catch (error) {
            console.error('Error uploading image:', error);
            throw error;
        }
    }

    async saveToFirebase(productNo, metadata) {
        try {
            // Save metadata to Firestore
            const result = await productMetadataService.saveMetadata(productNo, metadata);
            
            // If there's an image, update the image metadata
            if (metadata.imageUrl) {
                await productMetadataService.updateProductImage(productNo, metadata.imageUrl);
            }
            
            return result;
        } catch (error) {
            console.error('Error saving to Firebase:', error);
            throw error;
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            background: ${type === 'success' ? '#00b894' : type === 'error' ? '#e17055' : '#74b9ff'};
            color: white;
            font-size: 14px;
            z-index: 9999;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
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

    async handleSearch(keyword, productCode, productNo) {
        this.searchKeyword = keyword || '';
        this.searchProductCode = productCode || '';
        this.searchProductNo = productNo || '';
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
                    
                    <div class="filter-section">
                        <div class="filter-row">
                            <div class="filter-group">
                                <label class="filter-label">상품번호</label>
                                <input 
                                    type="text" 
                                    id="productNoInput" 
                                    placeholder="상품번호로 검색..."
                                    class="filter-input"
                                >
                            </div>
                            <div class="filter-group">
                                <label class="filter-label">상품코드</label>
                                <input 
                                    type="text" 
                                    id="productCodeInput" 
                                    placeholder="상품코드로 검색..."
                                    class="filter-input"
                                >
                            </div>
                            <div class="filter-group">
                                <label class="filter-label">상품명</label>
                                <input 
                                    type="text" 
                                    id="productNameInput" 
                                    placeholder="상품명으로 검색..."
                                    class="filter-input"
                                >
                            </div>
                            <div class="filter-actions">
                                <button class="btn btn-primary" id="searchBtn">검색</button>
                                <button class="btn btn-secondary" id="resetBtn">초기화</button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="pagination-section">
                        <div class="pagination-info">
                            <span>페이지 ${this.currentPage} (100개씩 표시)</span>
                        </div>
                        <div class="pagination-controls">
                            <button class="btn btn-secondary" id="prevBtn" ${this.currentPage === 1 ? 'disabled' : ''}>
                                이전
                            </button>
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
            const productName = document.getElementById('productNameInput').value;
            const productCode = document.getElementById('productCodeInput').value;
            const productNo = document.getElementById('productNoInput').value;
            this.handleSearch(productName, productCode, productNo);
        });
        
        document.getElementById('resetBtn')?.addEventListener('click', () => {
            document.getElementById('productNameInput').value = '';
            document.getElementById('productCodeInput').value = '';
            document.getElementById('productNoInput').value = '';
            this.handleSearch('', '', '');
        });
        
        document.getElementById('productNameInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const productName = e.target.value;
                const productCode = document.getElementById('productCodeInput').value;
                const productNo = document.getElementById('productNoInput').value;
                this.handleSearch(productName, productCode, productNo);
            }
        });
        
        document.getElementById('productCodeInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const productCode = e.target.value;
                const productName = document.getElementById('productNameInput').value;
                const productNo = document.getElementById('productNoInput').value;
                this.handleSearch(productName, productCode, productNo);
            }
        });
        
        document.getElementById('productNoInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const productNo = e.target.value;
                const productName = document.getElementById('productNameInput').value;
                const productCode = document.getElementById('productCodeInput').value;
                this.handleSearch(productName, productCode, productNo);
            }
        });
        
        document.getElementById('prevBtn')?.addEventListener('click', () => this.previousPage());
        document.getElementById('nextBtn')?.addEventListener('click', () => this.nextPage());
    }
}