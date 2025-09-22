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
        this.searchCategory = '';
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

        // 이미 인증되어 있는지 확인 (자동 토큰 갱신 포함)
        try {
            console.log('Checking authentication status...');
            this.showLoadingMessage('Cafe24 인증 확인 중...');
            
            const isAuthenticated = await cafe24Api.isAuthenticated();
            console.log('Is authenticated:', isAuthenticated);
            
            if (isAuthenticated) {
                console.log('Authentication successful, loading products...');
                await this.loadProducts();
            } else {
                console.log('Not authenticated, showing auth button...');
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

            let products = await cafe24Api.getProducts(params);
            
            // Filter by category if selected (client-side filtering since API might not support it)
            if (this.searchCategory) {
                // We'll need to load metadata for filtering
                const productNumbers = products.map(p => p.product_no);
                const existingMetadata = await productMetadataService.loadMetadataForProducts(productNumbers);
                
                products = products.filter(product => {
                    const metadata = existingMetadata[product.product_no];
                    if (!metadata || !metadata.type) return false;
                    
                    // Check if the type matches or starts with the category
                    const productType = metadata.type;
                    if (this.searchCategory === '모루공예') {
                        return productType === '모루공예-옷소품' || productType === '모루공예-눈코';
                    } else if (this.searchCategory === '부재료') {
                        return productType.startsWith('부재료-');
                    } else {
                        return productType === this.searchCategory;
                    }
                });
            }
            
            this.products = products;
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
                        <optgroup label="모루공예">
                            <option value="모루공예-옷소품" ${metadata.type === '모루공예-옷소품' ? 'selected' : ''}>모루공예-옷소품</option>
                            <option value="모루공예-눈코" ${metadata.type === '모루공예-눈코' ? 'selected' : ''}>모루공예-눈코</option>
                        </optgroup>
                        <optgroup label="부재료">
                            <option value="부재료-키링,군번줄" ${metadata.type === '부재료-키링,군번줄' ? 'selected' : ''}>부재료-키링,군번줄</option>
                            <option value="부재료-체인,O링,부속" ${metadata.type === '부재료-체인,O링,부속' ? 'selected' : ''}>부재료-체인,O링,부속</option>
                            <option value="부재료-마감,9핀,T핀" ${metadata.type === '부재료-마감,9핀,T핀' ? 'selected' : ''}>부재료-마감,9핀,T핀</option>
                            <option value="부재료-반지,목걸이,귀걸이" ${metadata.type === '부재료-반지,목걸이,귀걸이' ? 'selected' : ''}>부재료-반지,목걸이,귀걸이</option>
                        </optgroup>
                        <option value="끈/줄" ${metadata.type === '끈/줄' ? 'selected' : ''}>끈/줄</option>
                        <option value="도구/정리" ${metadata.type === '도구/정리' ? 'selected' : ''}>도구/정리</option>
                    </select>
                </td>
                <td class="product-input">
                    <div class="direction-toggle" data-product-no="${product.product_no}">
                        <label class="radio-option ${metadata.direction === '가로' ? 'active' : ''}">
                            <input type="radio" name="direction-${product.product_no}" value="가로" ${metadata.direction === '가로' ? 'checked' : ''}>
                            <span>가로</span>
                        </label>
                        <label class="radio-option ${metadata.direction === '세로' ? 'active' : ''}">
                            <input type="radio" name="direction-${product.product_no}" value="세로" ${metadata.direction === '세로' ? 'checked' : ''}>
                            <span>세로</span>
                        </label>
                    </div>
                </td>
                <td class="product-input">
                    <div class="color-selector" data-product-no="${product.product_no}">
                        <div class="color-palette">
                            <button type="button" class="color-btn ${metadata.colors && metadata.colors.includes('black') ? 'selected' : ''}" data-color="black" data-product-no="${product.product_no}" title="블랙">
                                <span class="color-swatch" style="background-color: #2d2d2d"></span>
                            </button>
                            <button type="button" class="color-btn ${metadata.colors && metadata.colors.includes('blue') ? 'selected' : ''}" data-color="blue" data-product-no="${product.product_no}" title="블루">
                                <span class="color-swatch" style="background-color: #3b82f6"></span>
                            </button>
                            <button type="button" class="color-btn ${metadata.colors && metadata.colors.includes('green') ? 'selected' : ''}" data-color="green" data-product-no="${product.product_no}" title="그린">
                                <span class="color-swatch" style="background-color: #10b981"></span>
                            </button>
                            <button type="button" class="color-btn ${metadata.colors && metadata.colors.includes('red') ? 'selected' : ''}" data-color="red" data-product-no="${product.product_no}" title="레드">
                                <span class="color-swatch" style="background-color: #ef4444"></span>
                            </button>
                            <button type="button" class="color-btn ${metadata.colors && metadata.colors.includes('yellow') ? 'selected' : ''}" data-color="yellow" data-product-no="${product.product_no}" title="옐로우">
                                <span class="color-swatch" style="background-color: #f59e0b"></span>
                            </button>
                            <button type="button" class="color-btn ${metadata.colors && metadata.colors.includes('orange') ? 'selected' : ''}" data-color="orange" data-product-no="${product.product_no}" title="오렌지">
                                <span class="color-swatch" style="background-color: #f97316"></span>
                            </button>
                            <button type="button" class="color-btn ${metadata.colors && metadata.colors.includes('pink') ? 'selected' : ''}" data-color="pink" data-product-no="${product.product_no}" title="핑크">
                                <span class="color-swatch" style="background-color: #ec4899"></span>
                            </button>
                            <button type="button" class="color-btn ${metadata.colors && metadata.colors.includes('purple') ? 'selected' : ''}" data-color="purple" data-product-no="${product.product_no}" title="퍼플">
                                <span class="color-swatch" style="background-color: #8b5cf6"></span>
                            </button>
                            <button type="button" class="color-btn ${metadata.colors && metadata.colors.includes('white') ? 'selected' : ''}" data-color="white" data-product-no="${product.product_no}" title="화이트">
                                <span class="color-swatch" style="background-color: #f8fafc; border: 1px solid #e2e8f0;"></span>
                            </button>
                            <button type="button" class="color-btn ${metadata.colors && metadata.colors.includes('transparent') ? 'selected' : ''}" data-color="transparent" data-product-no="${product.product_no}" title="투명">
                                <span class="color-swatch transparent-pattern"></span>
                            </button>
                            <button type="button" class="color-btn ${metadata.colors && metadata.colors.includes('gold') ? 'selected' : ''}" data-color="gold" data-product-no="${product.product_no}" title="골드">
                                <span class="color-swatch" style="background-color: #ffd700"></span>
                            </button>
                            <button type="button" class="color-btn ${metadata.colors && metadata.colors.includes('silver') ? 'selected' : ''}" data-color="silver" data-product-no="${product.product_no}" title="실버">
                                <span class="color-swatch" style="background-color: #c0c0c0"></span>
                            </button>
                        </div>
                        <input type="hidden" class="product-colors" data-product-no="${product.product_no}" value="${metadata.colors || ''}">
                    </div>
                </td>
                <td class="product-input">
                    <div class="keyword-selector" data-product-no="${product.product_no}">
                        <input type="text" class="input-text keyword-input" data-product-no="${product.product_no}" placeholder="키워드 입력 후 엔터">
                        <div class="keyword-tags" id="keyword-tags-${product.product_no}">
                            ${metadata.keywords ? metadata.keywords.split(',').map(keyword => keyword.trim()).filter(k => k).map(keyword => `
                                <span class="keyword-tag" data-keyword="${keyword}">
                                    ${keyword}
                                    <span class="remove-keyword" data-product-no="${product.product_no}" data-keyword="${keyword}">×</span>
                                </span>
                            `).join('') : ''}
                        </div>
                        <input type="hidden" class="product-keywords" data-product-no="${product.product_no}" value="${metadata.keywords || ''}">
                    </div>
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
                            <th width="18%">상품명</th>
                            <th width="11%">타입</th>
                            <th width="10%">방향</th>
                            <th width="13%">색상</th>
                            <th width="20%">키워드</th>
                            <th width="10%">이미지</th>
                            <th width="10%">저장</th>
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

    getColorHex(colorValue) {
        const colorMap = {
            'black': '#2d2d2d',
            'blue': '#3b82f6',
            'green': '#10b981',
            'red': '#ef4444',
            'yellow': '#f59e0b',
            'orange': '#f97316',
            'pink': '#ec4899',
            'purple': '#8b5cf6',
            'white': '#f8fafc',
            'transparent': 'transparent',
            'gold': '#ffd700',
            'silver': '#c0c0c0'
        };
        return colorMap[colorValue] || '#ccc';
    }

    getColorName(colorValue) {
        const colorNames = {
            'black': '블랙',
            'blue': '블루',
            'green': '그린',
            'red': '레드',
            'yellow': '옐로우',
            'orange': '오렌지',
            'pink': '핑크',
            'purple': '퍼플',
            'white': '화이트',
            'transparent': '투명',
            'gold': '골드',
            'silver': '실버'
        };
        return colorNames[colorValue] || colorValue;
    }

    attachProductEventListeners() {

        // Color button handlers - toggle selection
        document.querySelectorAll('.color-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productNo = e.currentTarget.dataset.productNo;
                const selectedColor = e.currentTarget.dataset.color;
                const hiddenInput = document.querySelector(`.product-colors[data-product-no="${productNo}"]`);
                
                if (!hiddenInput || !selectedColor) return;
                
                // Get current colors
                let currentColors = hiddenInput.value ? hiddenInput.value.split(',').map(c => c.trim()).filter(c => c) : [];
                
                if (btn.classList.contains('selected')) {
                    // Remove color if already selected
                    btn.classList.remove('selected');
                    currentColors = currentColors.filter(c => c !== selectedColor);
                } else {
                    // Add color if not selected
                    btn.classList.add('selected');
                    if (!currentColors.includes(selectedColor)) {
                        currentColors.push(selectedColor);
                    }
                }
                
                // Update hidden input value
                hiddenInput.value = currentColors.join(',');
            });
        });

        // Keyword input handlers
        document.querySelectorAll('.keyword-input').forEach(input => {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const productNo = e.target.dataset.productNo;
                    const keyword = e.target.value.trim();
                    
                    if (keyword) {
                        this.addKeyword(productNo, keyword);
                        e.target.value = ''; // Clear input
                    }
                }
            });
        });

        // Color tag remove handlers
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-color')) {
                const productNo = e.target.dataset.productNo;
                const color = e.target.dataset.color;
                this.removeColor(productNo, color);
            }
            
            if (e.target.classList.contains('remove-keyword')) {
                const productNo = e.target.dataset.productNo;
                const keyword = e.target.dataset.keyword;
                this.removeKeyword(productNo, keyword);
            }
        });

        // Direction toggle handlers
        document.querySelectorAll('.direction-toggle .radio-option').forEach(label => {
            label.addEventListener('click', (e) => {
                const toggle = label.parentElement;
                const productNo = toggle.dataset.productNo;
                const input = label.querySelector('input[type="radio"]');
                
                // Remove active class from all options in this toggle
                toggle.querySelectorAll('.radio-option').forEach(opt => {
                    opt.classList.remove('active');
                });
                
                // Add active class to clicked option
                label.classList.add('active');
                
                // Check the radio input
                if (input) {
                    input.checked = true;
                }
            });
        });

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

    addColor(productNo, color) {
        const hiddenInput = document.querySelector(`.product-colors[data-product-no="${productNo}"]`);
        const colorTagsContainer = document.getElementById(`color-tags-${productNo}`);
        
        if (!hiddenInput || !colorTagsContainer) return;
        
        // Get current colors
        const currentColors = hiddenInput.value ? hiddenInput.value.split(',').map(c => c.trim()) : [];
        
        // Check if color already exists
        if (currentColors.includes(color)) {
            return;
        }
        
        // Add new color
        currentColors.push(color);
        hiddenInput.value = currentColors.join(',');
        
        // Add visual tag
        const tagHTML = `
            <span class="color-tag" data-color="${color}">
                <span class="color-dot" style="background-color: ${this.getColorHex(color)}"></span>
                ${this.getColorName(color)}
                <span class="remove-color" data-product-no="${productNo}" data-color="${color}">×</span>
            </span>
        `;
        colorTagsContainer.insertAdjacentHTML('beforeend', tagHTML);
    }

    removeColor(productNo, color) {
        const hiddenInput = document.querySelector(`.product-colors[data-product-no="${productNo}"]`);
        const colorTag = document.querySelector(`#color-tags-${productNo} .color-tag[data-color="${color}"]`);
        
        if (!hiddenInput) return;
        
        // Remove from hidden input
        const currentColors = hiddenInput.value ? hiddenInput.value.split(',').map(c => c.trim()) : [];
        const newColors = currentColors.filter(c => c !== color);
        hiddenInput.value = newColors.join(',');
        
        // Remove visual tag
        if (colorTag) {
            colorTag.remove();
        }
    }

    addKeyword(productNo, keyword) {
        const hiddenInput = document.querySelector(`.product-keywords[data-product-no="${productNo}"]`);
        const keywordTagsContainer = document.getElementById(`keyword-tags-${productNo}`);
        
        if (!hiddenInput || !keywordTagsContainer) return;
        
        // Get current keywords
        const currentKeywords = hiddenInput.value ? hiddenInput.value.split(',').map(k => k.trim()) : [];
        
        // Check if keyword already exists
        if (currentKeywords.includes(keyword)) {
            return;
        }
        
        // Add new keyword
        currentKeywords.push(keyword);
        hiddenInput.value = currentKeywords.join(',');
        
        // Add visual tag
        const tagHTML = `
            <span class="keyword-tag" data-keyword="${keyword}">
                ${keyword}
                <span class="remove-keyword" data-product-no="${productNo}" data-keyword="${keyword}">×</span>
            </span>
        `;
        keywordTagsContainer.insertAdjacentHTML('beforeend', tagHTML);
    }

    removeKeyword(productNo, keyword) {
        const hiddenInput = document.querySelector(`.product-keywords[data-product-no="${productNo}"]`);
        const keywordTag = document.querySelector(`#keyword-tags-${productNo} .keyword-tag[data-keyword="${keyword}"]`);
        
        if (!hiddenInput) return;
        
        // Remove from hidden input
        const currentKeywords = hiddenInput.value ? hiddenInput.value.split(',').map(k => k.trim()) : [];
        const newKeywords = currentKeywords.filter(k => k !== keyword);
        hiddenInput.value = newKeywords.join(',');
        
        // Remove visual tag
        if (keywordTag) {
            keywordTag.remove();
        }
    }

    async saveProductMetadata(productNo) {
        const saveBtn = document.querySelector(`.btn-save[data-product-no="${productNo}"]`);
        const productRow = document.querySelector(`.product-row[data-product-id="${productNo}"]`);
        
        if (!saveBtn || !productRow) return;

        // Get all input values
        const productType = productRow.querySelector('.product-type').value;
        const beadDirection = productRow.querySelector(`input[name="direction-${productNo}"]:checked`)?.value || '';
        const productColors = productRow.querySelector('.product-colors').value;
        const productKeywords = productRow.querySelector('.product-keywords').value;
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
                colors: productColors,
                keywords: productKeywords,
                updatedAt: new Date().toISOString()
            };
            
            // Only add image fields if they exist
            if (imageInfo) {
                metadata.imageUrl = imageInfo.url;
                metadata.imagePath = imageInfo.path;
                metadata.imageFileName = imageInfo.fileName;
            }

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
            // Save metadata to Firestore (this includes image info if present)
            const result = await productMetadataService.saveMetadata(productNo, metadata);
            
            // No need to call updateProductImage separately - saveMetadata handles everything
            
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

    async handleSearch(category, keyword, productCode, productNo) {
        this.searchCategory = category || '';
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
                                <label class="filter-label">카테고리</label>
                                <select id="categorySelect" class="filter-input">
                                    <option value="">전체</option>
                                    <option value="비즈">비즈</option>
                                    <option value="파츠">파츠</option>
                                    <option value="팬던트">팬던트</option>
                                    <option value="모루공예">모루공예</option>
                                    <option value="부재료">부재료</option>
                                    <option value="끈/줄">끈/줄</option>
                                    <option value="도구/정리">도구/정리</option>
                                </select>
                            </div>
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
            const category = document.getElementById('categorySelect').value;
            const productName = document.getElementById('productNameInput').value;
            const productCode = document.getElementById('productCodeInput').value;
            const productNo = document.getElementById('productNoInput').value;
            this.handleSearch(category, productName, productCode, productNo);
        });
        
        document.getElementById('categorySelect')?.addEventListener('change', () => {
            const category = document.getElementById('categorySelect').value;
            const productName = document.getElementById('productNameInput').value;
            const productCode = document.getElementById('productCodeInput').value;
            const productNo = document.getElementById('productNoInput').value;
            this.handleSearch(category, productName, productCode, productNo);
        });
        
        document.getElementById('productNameInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const category = document.getElementById('categorySelect').value;
                const productName = e.target.value;
                const productCode = document.getElementById('productCodeInput').value;
                const productNo = document.getElementById('productNoInput').value;
                this.handleSearch(category, productName, productCode, productNo);
            }
        });
        
        document.getElementById('productCodeInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const category = document.getElementById('categorySelect').value;
                const productCode = e.target.value;
                const productName = document.getElementById('productNameInput').value;
                const productNo = document.getElementById('productNoInput').value;
                this.handleSearch(category, productName, productCode, productNo);
            }
        });
        
        document.getElementById('productNoInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const category = document.getElementById('categorySelect').value;
                const productNo = e.target.value;
                const productName = document.getElementById('productNameInput').value;
                const productCode = document.getElementById('productCodeInput').value;
                this.handleSearch(category, productName, productCode, productNo);
            }
        });
        
        document.getElementById('prevBtn')?.addEventListener('click', () => this.previousPage());
        document.getElementById('nextBtn')?.addEventListener('click', () => this.nextPage());
    }
}