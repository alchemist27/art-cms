import { Sidebar } from '../components/Sidebar.js';
import { backgroundService } from '../services/backgroundService.js';

export class BackgroundsPage {
    constructor(container) {
        this.container = container;
        this.backgrounds = [];
        this.isLoading = false;
        this.selectedCategory = 'all';
        
        this.render();
        this.loadBackgrounds();
    }

    async loadBackgrounds() {
        this.isLoading = true;
        this.updateLoadingState(true);
        
        try {
            this.backgrounds = await backgroundService.getBackgrounds(
                this.selectedCategory === 'all' ? null : this.selectedCategory
            );
            this.displayBackgrounds();
        } catch (error) {
            console.error('Failed to load backgrounds:', error);
            this.showError('배경 이미지를 불러오는데 실패했습니다.');
        } finally {
            this.isLoading = false;
            this.updateLoadingState(false);
        }
    }

    displayBackgrounds() {
        const backgroundsContainer = document.getElementById('backgroundsContainer');
        if (!backgroundsContainer) return;

        if (this.backgrounds.length === 0) {
            backgroundsContainer.innerHTML = `
                <div class="empty-state">
                    <p>등록된 배경 이미지가 없습니다.</p>
                </div>
            `;
            return;
        }

        const backgroundsHTML = this.backgrounds.map(bg => `
            <tr class="background-row" data-id="${bg.id}">
                <td>${bg.category}</td>
                <td>${bg.displayName}</td>
                <td class="thumbnail-cell">
                    <img 
                        src="${bg.thumbnailUrl || bg.url}" 
                        alt="${bg.displayName}"
                        class="thumbnail-img"
                        data-full-url="${bg.url}"
                    >
                    <div class="preview-popup">
                        <img src="${bg.url}" alt="${bg.displayName}">
                    </div>
                </td>
                <td class="filename-cell">${bg.fileName}</td>
                <td>${this.formatFileSize(bg.size)}</td>
                <td class="action-cell">
                    <button class="btn-delete" data-id="${bg.id}">
                        <i class="fas fa-trash"></i> 삭제
                    </button>
                </td>
            </tr>
        `).join('');

        backgroundsContainer.innerHTML = `
            <div class="backgrounds-table-container">
                <table class="backgrounds-table">
                    <thead>
                        <tr>
                            <th width="15%">카테고리</th>
                            <th width="25%">노출 이름</th>
                            <th width="15%">미리보기</th>
                            <th width="20%">파일명</th>
                            <th width="10%">용량</th>
                            <th width="15%">삭제</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${backgroundsHTML}
                    </tbody>
                </table>
            </div>
        `;

        this.attachEventListeners();
    }

    attachEventListeners() {
        // Thumbnail hover preview
        document.querySelectorAll('.thumbnail-img').forEach(img => {
            const previewPopup = img.nextElementSibling;
            
            img.addEventListener('mouseenter', (e) => {
                if (previewPopup) {
                    previewPopup.style.display = 'block';
                }
            });
            
            img.addEventListener('mouseleave', (e) => {
                if (previewPopup) {
                    previewPopup.style.display = 'none';
                }
            });
        });

        // Delete buttons
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = e.currentTarget.dataset.id;
                if (confirm('이 배경 이미지를 삭제하시겠습니까?')) {
                    await this.deleteBackground(id);
                }
            });
        });
    }

    async uploadBackground(file) {
        const modal = this.showUploadModal();
        
        modal.querySelector('#uploadForm')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const category = modal.querySelector('#categorySelect').value;
            const displayName = modal.querySelector('#displayNameInput').value;
            
            if (!category || !displayName) {
                alert('카테고리와 노출 이름을 입력해주세요.');
                return;
            }
            
            this.showLoading('업로드 중...');
            
            try {
                await backgroundService.uploadBackground(file, category, displayName);
                this.hideModal();
                this.showNotification('배경 이미지가 등록되었습니다!', 'success');
                await this.loadBackgrounds();
            } catch (error) {
                console.error('Upload failed:', error);
                this.showNotification('업로드에 실패했습니다.', 'error');
            } finally {
                this.hideLoading();
            }
        });
    }

    async deleteBackground(id) {
        this.showLoading('삭제 중...');
        
        try {
            await backgroundService.deleteBackground(id);
            this.showNotification('배경 이미지가 삭제되었습니다.', 'success');
            await this.loadBackgrounds();
        } catch (error) {
            console.error('Delete failed:', error);
            this.showNotification('삭제에 실패했습니다.', 'error');
        } finally {
            this.hideLoading();
        }
    }

    showUploadModal() {
        const modalHTML = `
            <div class="modal-overlay" id="uploadModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>배경 이미지 업로드</h2>
                        <button class="modal-close" onclick="window.backgroundsPage.hideModal()">×</button>
                    </div>
                    <form id="uploadForm" class="upload-form">
                        <div class="form-group">
                            <label class="form-label">카테고리</label>
                            <select id="categorySelect" class="form-select" required>
                                <option value="">선택하세요</option>
                                <option value="키링">키링</option>
                                <option value="팔찌/목걸이">팔찌/목걸이</option>
                                <option value="반지/귀걸이">반지/귀걸이</option>
                                <option value="네일아트">네일아트</option>
                                <option value="핸드폰기종">핸드폰기종</option>
                                <option value="레진아트">레진아트</option>
                                <option value="모루공예">모루공예</option>
                                <option value="비녀공예">비녀공예</option>
                                <option value="스위츠데코">스위츠데코</option>
                                <option value="스마트톡/탑로더">스마트톡/탑로더</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">노출 이름</label>
                            <input type="text" id="displayNameInput" class="form-input" placeholder="예: 핑크 키링 배경" required>
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" style="flex: 1; width: auto;" onclick="window.backgroundsPage.hideModal()">취소</button>
                            <button type="submit" class="btn btn-primary" style="flex: 3; width: auto;">업로드</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        return document.getElementById('uploadModal');
    }

    hideModal() {
        document.getElementById('uploadModal')?.remove();
    }

    formatFileSize(bytes) {
        if (!bytes) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    showLoading(message) {
        const loadingHTML = `
            <div class="loading-overlay" id="loadingOverlay">
                <div class="loading-content">
                    <div class="spinner"></div>
                    <p>${message}</p>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', loadingHTML);
    }

    hideLoading() {
        document.getElementById('loadingOverlay')?.remove();
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

    render() {
        this.container.innerHTML = `
            <div class="dashboard-container">
                ${Sidebar.render('backgrounds')}
                
                <div class="main-content">
                    <div class="page-header">
                        <h1 class="page-title">배경 이미지 관리</h1>
                        <p class="page-subtitle">디자인 캔버스에서 사용할 배경 이미지를 관리합니다</p>
                    </div>
                    
                    <div class="controls-section">
                        <div class="filter-group">
                            <select id="categoryFilter" class="filter-select">
                                <option value="all">전체 카테고리</option>
                                <option value="키링">키링</option>
                                <option value="팔찌/목걸이">팔찌/목걸이</option>
                                <option value="반지/귀걸이">반지/귀걸이</option>
                                <option value="네일아트">네일아트</option>
                                <option value="핸드폰기종">핸드폰기종</option>
                                <option value="레진아트">레진아트</option>
                                <option value="모루공예">모루공예</option>
                                <option value="비녀공예">비녀공예</option>
                                <option value="스위츠데코">스위츠데코</option>
                                <option value="스마트톡/탑로더">스마트톡/탑로더</option>
                            </select>
                        </div>
                        <button class="btn btn-primary" id="uploadBtn">
                            <i class="fas fa-upload"></i>
                            새 배경 이미지 업로드
                        </button>
                    </div>
                    
                    <input type="file" id="fileInput" accept="image/*" style="display: none;">
                    
                    <div id="errorContainer"></div>
                    <div id="loadingIndicator" style="display: none;">
                        <div class="spinner">로딩중...</div>
                    </div>
                    
                    <div id="backgroundsContainer" class="backgrounds-container">
                        <!-- Backgrounds will be loaded here -->
                    </div>
                </div>
            </div>
        `;
        
        Sidebar.attachEvents();
        window.backgroundsPage = this;
        
        // Attach initial event listeners after render
        this.attachInitialEventListeners();
    }
    
    attachInitialEventListeners() {
        // Category filter
        document.getElementById('categoryFilter')?.addEventListener('change', (e) => {
            this.selectedCategory = e.target.value;
            this.loadBackgrounds();
        });

        // Upload button
        document.getElementById('uploadBtn')?.addEventListener('click', () => {
            console.log('Upload button clicked');
            document.getElementById('fileInput')?.click();
        });

        // File input change
        document.getElementById('fileInput')?.addEventListener('change', async (e) => {
            console.log('File selected');
            const file = e.target.files[0];
            if (file) {
                await this.uploadBackground(file);
                e.target.value = ''; // Reset input
            }
        });
    }
}