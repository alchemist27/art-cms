// Global variables
let canvasManager;
let filterManager;
let itemsData = [];
let backgroundsData = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    showLoading(true);
    
    try {
        // Load data
        await loadItemsData();
        await loadBackgroundsData();
        
        // Initialize managers
        canvasManager = new CanvasManager('designCanvas');
        filterManager = new FilterManager(itemsData);
        
        // Make managers globally accessible
        window.canvasManager = canvasManager;
        window.filterManager = filterManager;
        
        // Initialize UI components
        initializeEventListeners();
        
        // Render initial content
        renderBackgrounds();
        
        showLoading(false);
        console.log('App initialized successfully');
    } catch (error) {
        console.error('Failed to initialize app:', error);
        showLoading(false);
    }
}

// Data loading functions
async function loadItemsData() {
    try {
        const response = await fetch('/assets/items.json');
        itemsData = await response.json();
        console.log('Items data loaded:', itemsData.length, 'items');
    } catch (error) {
        console.error('Failed to load items data:', error);
        // Fallback to empty array
        itemsData = [];
    }
}

async function loadBackgroundsData() {
    try {
        const response = await fetch('/assets/backgrounds.json');
        backgroundsData = await response.json();
        console.log('Backgrounds data loaded:', backgroundsData.length, 'backgrounds');
    } catch (error) {
        console.error('Failed to load backgrounds data:', error);
        // Fallback to empty array
        backgroundsData = [];
    }
}

// Canvas and filter initialization is now handled by managers

// Event listeners initialization
function initializeEventListeners() {
    // Header buttons
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => canvasManager.clear());
    }
    
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', () => canvasManager.toggleFullscreen());
    }
    
    // Canvas controls
    const undoBtn = document.getElementById('undoBtn');
    if (undoBtn) {
        undoBtn.addEventListener('click', () => canvasManager.undo());
    }
    
    const redoBtn = document.getElementById('redoBtn');
    if (redoBtn) {
        redoBtn.addEventListener('click', () => canvasManager.redo());
    }
    
    const captureBtn = document.getElementById('captureBtn');
    if (captureBtn) {
        captureBtn.addEventListener('click', () => canvasManager.downloadImage());
    }
    
    // Layer controls
    const bringToFrontBtn = document.getElementById('bringToFrontBtn');
    if (bringToFrontBtn) {
        bringToFrontBtn.addEventListener('click', () => canvasManager.bringToFront());
    }
    
    const sendToBackBtn = document.getElementById('sendToBackBtn');
    if (sendToBackBtn) {
        sendToBackBtn.addEventListener('click', () => canvasManager.sendToBack());
    }
    
    const duplicateBtn = document.getElementById('duplicateBtn');
    if (duplicateBtn) {
        duplicateBtn.addEventListener('click', () => canvasManager.duplicate());
    }
    
    const deleteBtn = document.getElementById('deleteBtn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => canvasManager.deleteSelected());
    }
    
    // Cart button
    const addToCartBtn = document.getElementById('addToCartBtn');
    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', handleAddToCart);
    }
    
    // Background upload functionality
    const uploadBackgroundBtn = document.getElementById('uploadBackgroundBtn');
    const backgroundFileInput = document.getElementById('backgroundFileInput');
    
    if (uploadBackgroundBtn && backgroundFileInput) {
        uploadBackgroundBtn.addEventListener('click', () => {
            backgroundFileInput.click();
        });
        
        backgroundFileInput.addEventListener('change', handleBackgroundUpload);
    }

    // 배경 카테고리 필터 이벤트
    const bgCatFilter = document.getElementById('backgroundCategoryFilters');
    if (bgCatFilter) {
        bgCatFilter.addEventListener('click', (e) => {
            if (e.target && e.target.matches('button[data-category]')) {
                const cat = e.target.getAttribute('data-category');
                if (selectedBgCategories.includes(cat)) {
                    selectedBgCategories = selectedBgCategories.filter(c => c !== cat);
                    e.target.classList.remove('active');
                } else {
                    selectedBgCategories.push(cat);
                    e.target.classList.add('active');
                }
                renderBackgrounds();
            }
        });
    }
}

// Item rendering is now handled by FilterManager

// 임시: 배경 id별 카테고리 매핑 함수
function getBackgroundCategory(bg) {
    // 실제로는 bg.category 사용, 여기선 id로 임시 분기
    if (bg.id === 'bg1') return '키링';
    if (bg.id === 'bg2') return '팔찌/목걸이';
    // 필요시 더 추가
    return '기타';
}

let selectedBgCategories = [];

function renderBackgrounds() {
    const backgroundGrid = document.getElementById('backgroundGrid');
    
    if (!backgroundGrid) return;
    
    backgroundGrid.innerHTML = '';
    
    // 필터링
    let filtered = backgroundsData;
    if (selectedBgCategories.length > 0) {
        filtered = backgroundsData.filter(bg => selectedBgCategories.includes(getBackgroundCategory(bg)));
    }
    filtered.forEach((bg, index) => {
        const bgCard = createBackgroundCard(bg, false); // 기본 활성화 제거
        backgroundGrid.appendChild(bgCard);
    });
    
    // 워터마크 로고 표시 (배경 선택 전까지)
    if (canvasManager) {
        canvasManager.showWatermark();
    }
}

function createBackgroundCard(bg, isActive = false) {
    const card = document.createElement('div');
    card.className = `background-card ${isActive ? 'active' : ''}`;
    card.dataset.bgId = bg.id;
    
    const img = document.createElement('img');
    img.src = `/assets/${bg.image}`;
    img.alt = bg.name;
    
    const name = document.createElement('div');
    name.className = 'bg-name';
    name.textContent = bg.name;
    
    card.appendChild(img);
    card.appendChild(name);
    
    // Add click event to change background
    card.addEventListener('click', () => {
        setActiveBackground(card);
        setCanvasBackground(bg);
    });
    
    return card;
}

// Canvas functions are now handled by CanvasManager

function setCanvasBackground(bg) {
    if (!canvasManager || !bg) {
        console.error('Canvas manager or background data is missing');
        return;
    }
    
    console.log('Setting canvas background:', bg);
    
    // 워터마크 숨기기
    canvasManager.hideWatermark();
    
    // 환영 오버레이 숨기기
    canvasManager.hideWelcomeOverlay();
    
    canvasManager.setBackground(bg).then(() => {
        console.log('Background set successfully:', bg.name);
        
        // 오버레이 완전히 숨기기
        const overlay = document.getElementById('canvasOverlay');
        if (overlay) {
            overlay.classList.add('hidden');
            overlay.style.display = 'none';
        }
        
        // 강제로 캔버스 다시 렌더링
        setTimeout(() => {
            canvasManager.canvas.renderAll();
            // console.log('Final canvas render completed');
            
            // 디버깅 모드일 때만 캔버스 상호작용 상태 확인
            if (window.DEBUG_MODE) {
                // canvasManager.debugCanvasInteraction();
            }
        }, 100);
    }).catch(err => {
        console.error('Failed to set background:', err);
        // 배경 설정 실패 시 워터마크 다시 표시
        canvasManager.showWatermark();
    });
}

function setActiveBackground(activeCard) {
    // Remove active class from all background cards
    document.querySelectorAll('.background-card').forEach(card => {
        card.classList.remove('active');
    });
    
    // Add active class to selected card
    activeCard.classList.add('active');
}

function handleBackgroundUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Check if file is an image
    if (!file.type.startsWith('image/')) {
        showNotification('이미지 파일만 업로드할 수 있습니다.', 'error');
        return;
    }
    
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
        showNotification('파일 크기는 10MB 이하여야 합니다.', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const imageUrl = e.target.result;
        
        // Create a temporary background object
        const customBackground = {
            id: 'custom-' + Date.now(),
            name: file.name.replace(/\.[^/.]+$/, ''), // Remove file extension
            image: imageUrl,
            isCustom: true
        };
        
        // Set the custom background
        setCustomCanvasBackground(customBackground);
        
        // Clear the file input
        event.target.value = '';
        
        showNotification('배경 이미지가 성공적으로 업로드되었습니다!', 'success');
    };
    
    reader.onerror = function() {
        showNotification('파일을 읽는 중 오류가 발생했습니다.', 'error');
    };
    
    reader.readAsDataURL(file);
}

function setCustomCanvasBackground(customBackground) {
    if (!canvasManager || !customBackground) {
        console.error('Canvas manager or background data is missing');
        return;
    }
    
    console.log('Setting custom canvas background:', customBackground);
    
    // 워터마크 숨기기
    canvasManager.hideWatermark();
    
    // 환영 오버레이 숨기기
    canvasManager.hideWelcomeOverlay();
    
    // Use the custom image URL directly
    fabric.Image.fromURL(customBackground.image, (img) => {
        if (!img) {
            console.error('Failed to load custom background image');
            showNotification('이미지 로드에 실패했습니다.', 'error');
            return;
        }
        
        canvasManager.canvas.setBackgroundImage(img, canvasManager.canvas.renderAll.bind(canvasManager.canvas), {
            scaleX: canvasManager.canvas.width / img.width,
            scaleY: canvasManager.canvas.height / img.height
        });
        
        canvasManager.currentBackground = customBackground;
        
        // 오버레이 완전히 숨기기
        const overlay = document.getElementById('canvasOverlay');
        if (overlay) {
            overlay.classList.add('hidden');
            overlay.style.display = 'none';
        }
        
        // 강제로 캔버스 다시 렌더링
        setTimeout(() => {
            canvasManager.canvas.renderAll();
        }, 100);
        
        console.log('Custom background set successfully:', customBackground.name);
    }, { crossOrigin: 'anonymous' });
}

// Filter functions are now handled by FilterManager

// Canvas control functions are now handled by CanvasManager

// UI update functions are now handled by CanvasManager

// Cart functionality
function handleAddToCart() {
    if (!canvasManager) return;
    
    const objects = canvasManager.canvas.getObjects();
    const items = objects.filter(obj => obj.itemData);
    
    if (items.length === 0) {
        showNotification('캔버스에 추가된 아이템이 없습니다.', 'info');
        return;
    }
    
    // 아이템 정보 수집
    const cartItems = items.map(obj => ({
        id: obj.itemData.id,
        name: obj.itemData.name,
        image: obj.itemData.image,
        size: `${obj.itemData.width}×${obj.itemData.height}px`,
        type: obj.itemData.type || '파츠'
    }));
    
    // 장바구니 담기 시뮬레이션
    console.log('장바구니에 담을 아이템들:', cartItems);
    
    // 성공 메시지 표시
    showNotification(`${items.length}개 아이템이 장바구니에 담겼습니다!`, 'success');
    
    // 실제 구현에서는 여기서 서버로 데이터를 전송하거나
    // 로컬 스토리지에 저장하는 로직을 추가할 수 있습니다.
}

function showNotification(message, type = 'info') {
    // 간단한 알림 표시 (실제로는 더 정교한 알림 시스템을 구현할 수 있음)
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // 스타일 설정
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.zIndex = '9999';
    notification.style.padding = '12px 20px';
    notification.style.borderRadius = '8px';
    notification.style.color = 'white';
    notification.style.fontWeight = '500';
    notification.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    notification.style.transform = 'translateX(100%)';
    notification.style.transition = 'transform 0.3s ease-in-out';
    
    // 타입별 배경색
    switch (type) {
        case 'success':
            notification.style.backgroundColor = '#10b981';
            break;
        case 'error':
            notification.style.backgroundColor = '#ef4444';
            break;
        case 'info':
        default:
            notification.style.backgroundColor = '#6366f1';
            break;
    }
    
    document.body.appendChild(notification);
    
    // 애니메이션으로 표시
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // 3초 후 제거
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

function showLoading(show) {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        if (show) {
            loadingOverlay.classList.add('show');
        } else {
            loadingOverlay.classList.remove('show');
        }
    }
}

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
} 