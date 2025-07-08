/**
 * Canvas Manager - 캔버스 렌더링 및 객체 관리
 */
class CanvasManager {
    constructor(canvasId) {
        this.canvas = null;
        this.canvasId = canvasId;
        this.history = [];
        this.historyIndex = -1;
        this.maxHistorySize = 50;
        this.currentBackground = null;
        this.watermarkImage = null;
        this.resizeTimer = null;
        this.isLoadingState = false; // 상태 로딩 중 플래그
        
        this.init();
    }
    
    init() {
        // Fabric.js 캔버스 초기화
        this.canvas = new fabric.Canvas(this.canvasId, {
            width: 800,
            height: 600,
            backgroundColor: '#ffffff',
            preserveObjectStacking: true,
        });
        
        // 전역 컨트롤 설정
        this.setupGlobalControls();
        
        // 캔버스 이벤트 리스너 설정
        this.setupEventListeners();
        
        // 캔버스 크기 및 정렬 설정
        this.setupCanvasLayout();
        
        // 초기 히스토리 저장
        this.saveState();
    }
    
    setupGlobalControls() {
        // 회전 핸들러 커스터마이징
        fabric.Object.prototype.controls.mtr = new fabric.Control({
            x: 0,
            y: -0.5,
            offsetY: -30,
            cursorStyle: 'crosshair',
            actionHandler: fabric.controlsUtils.rotationWithSnapping,
            actionName: 'rotate',
            render: (ctx, left, top, styleOverride, fabricObject) => {
                const size = 32; // 핸들러 크기
                ctx.save();
                ctx.translate(left, top);
                ctx.rotate(fabricObject.angle * Math.PI / 180);
                // 보라색 원 배경 제거!
                // SVG 아이콘 (viewBox 0 0 24 24)
                ctx.save();
                // 아이콘을 핸들러 크기에 맞게 scale/translate
                const iconSize = 24;
                const scale = size / iconSize * 0.8; // 0.8: 여백
                ctx.scale(scale, scale);
                ctx.translate(-iconSize/2, -iconSize/2);
                ctx.strokeStyle = '#6366f1';
                ctx.lineWidth = 2.5;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                // path 1: M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8
                ctx.beginPath();
                ctx.moveTo(21, 12);
                ctx.bezierCurveTo(21, 7.03, 16.97, 3, 12, 3);
                ctx.bezierCurveTo(9.56, 3, 7.23, 3.93, 5.26, 5.74);
                ctx.lineTo(3, 8);
                ctx.stroke();
                // path 2: M3 3v5h5
                ctx.beginPath();
                ctx.moveTo(3, 3);
                ctx.lineTo(3, 8);
                ctx.lineTo(8, 8);
                ctx.stroke();
                // path 3: M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16
                ctx.beginPath();
                ctx.moveTo(3, 12);
                ctx.bezierCurveTo(3, 16.97, 7.03, 21, 12, 21);
                ctx.bezierCurveTo(14.44, 21, 16.77, 20.07, 18.74, 18.26);
                ctx.lineTo(21, 16);
                ctx.stroke();
                // path 4: M16 16h5v5
                ctx.beginPath();
                ctx.moveTo(16, 16);
                ctx.lineTo(21, 16);
                ctx.lineTo(21, 21);
                ctx.stroke();
                ctx.restore();
                ctx.restore();
            },
            cornerSize: 16,
            withConnection: true
        });
        
        // 전역 컨트롤 스타일 설정
        fabric.Object.prototype.set({
            cornerStyle: 'circle',
            cornerColor: '#6366f1',
            cornerStrokeColor: '#ffffff',
            borderColor: '#6366f1',
            transparentCorners: false,
            cornerSize: 12,
            rotatingPointOffset: 30,
        });
        
        // 전역 컨트롤 가시성 설정
        fabric.Object.prototype.setControlsVisibility({
            mt: false, mb: false, ml: false, mr: false,
        });
    }
    
    setupEventListeners() {
        this.canvas.on({
            'object:added': () => {
                if (!this.isLoadingState) {
                    this.saveState();
                    this.updateUI();
                }
            },
            'object:removed': () => {
                if (!this.isLoadingState) {
                    this.saveState();
                    this.updateUI();
                }
            },
            'object:modified': () => !this.isLoadingState && this.saveState(),
            'selection:created': () => this.updateUI(),
            'selection:updated': () => this.updateUI(),
            'selection:cleared': () => this.updateUI(),
        });
        
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('resize', () => this.handleWindowResize());
    }
    
    setupCanvasLayout() {
        const wrapperEl = this.canvas.wrapperEl;
        if (wrapperEl) {
            wrapperEl.style.borderRadius = 'var(--radius-xl)';
            wrapperEl.style.boxShadow = 'var(--shadow-lg)';
            wrapperEl.style.margin = '0 auto';
        }
        
        // DOM 렌더링이 완료된 후, 캔버스 오프셋을 재계산합니다.
        // 이것이 중앙 정렬된 캔버스의 좌표 문제를 해결하는 핵심입니다.
        setTimeout(() => {
            this.canvas.calcOffset();
            this.canvas.renderAll();
        }, 0);
    }
    
    // 아이템을 캔버스에 추가
    addItem(itemData) {
        return new Promise((resolve, reject) => {
            fabric.Image.fromURL(`/assets/${itemData.image}`, (img) => {
                if (!img) return reject(new Error('이미지 로드 실패'));
                
                const maxSize = 100;
                const scale = Math.min(maxSize / img.width, maxSize / img.height);
                
                img.set({
                    left: this.canvas.width / 2,
                    top: this.canvas.height / 2,
                    scaleX: scale,
                    scaleY: scale,
                    originX: 'center',
                    originY: 'center',
                });
                
                img.itemData = itemData;
                this.canvas.add(img).setActiveObject(img);
                
                this.hideWelcomeOverlay();
                resolve(img);
            }, { crossOrigin: 'anonymous' });
        });
    }

    // 배경 설정
    setBackground(backgroundData) {
        return new Promise((resolve, reject) => {
            if (!backgroundData || !backgroundData.image) return reject(new Error('Invalid background data'));
            
            fabric.Image.fromURL(`/assets/${backgroundData.image}`, (img) => {
                this.canvas.setBackgroundImage(img, this.canvas.renderAll.bind(this.canvas), {
                    scaleX: this.canvas.width / img.width,
                    scaleY: this.canvas.height / img.height
                });
                this.currentBackground = backgroundData;
                this.hideWelcomeOverlay();
                resolve(img);
            }, { crossOrigin: 'anonymous' });
        });
    }

    saveState() {
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }
        this.history.push(this.canvas.toDatalessJSON());
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
        }
        this.historyIndex = this.history.length - 1;
        this.updateHistoryButtons();
    }

    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.loadState(this.history[this.historyIndex]);
        }
    }

    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.loadState(this.history[this.historyIndex]);
        }
    }
    
    loadState(state) {
        this.isLoadingState = true;
        this.canvas.loadFromJSON(state, () => {
            this.canvas.renderAll();
            this.isLoadingState = false;
            this.updateUI();
        });
    }
    
    updateHistoryButtons() {
        document.getElementById('undoBtn').disabled = this.historyIndex <= 0;
        document.getElementById('redoBtn').disabled = this.historyIndex >= this.history.length - 1;
    }
    
    bringToFront() { this.canvas.getActiveObject()?.bringToFront(); this.canvas.renderAll(); }
    sendToBack() { this.canvas.getActiveObject()?.sendToBack(); this.canvas.renderAll(); }
    bringForward() { this.canvas.getActiveObject()?.bringForward(); this.canvas.renderAll(); }
    sendBackwards() { this.canvas.getActiveObject()?.sendBackwards(); this.canvas.renderAll(); }

    deleteSelected() {
        this.canvas.getActiveObjects().forEach(obj => this.canvas.remove(obj));
        this.canvas.discardActiveObject().renderAll();
    }
    
    handleKeyDown(e) {
        if (e.ctrlKey || e.metaKey) {
            if (e.key === 'z') { e.preventDefault(); this.undo(); }
            if (e.key === 'y') { e.preventDefault(); this.redo(); }
        }
        if (e.key === 'Delete' || e.key === 'Backspace') {
            this.deleteSelected();
        }
    }

    handleWindowResize() {
        clearTimeout(this.resizeTimer);
        this.resizeTimer = setTimeout(() => {
            this.canvas.calcOffset();
            this.canvas.renderAll();
        }, 100);
    }
    
    updateUI() {
        this.updateSelectedItems();
        this.updateLayerControls();
        this.updateHistoryButtons();
    }
    
    updateLayerControls() {
        const activeObject = this.canvas.getActiveObject();
        document.querySelectorAll('.layer-btn').forEach(btn => btn.disabled = !activeObject);
    }
    
    updateSelectedItems() {
        const objects = this.canvas.getObjects().filter(obj => obj.itemData);
        const selectedItemsContainer = document.getElementById('selectedItems');
        const selectedCount = document.getElementById('selectedCount');
        
        if (!selectedItemsContainer) return;
        
        if (objects.length === 0) {
            selectedItemsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>추가된 아이템이 없습니다</p>
                </div>
            `;
            if (selectedCount) selectedCount.textContent = '0개';
            return;
        }
        
        selectedItemsContainer.innerHTML = '';
        objects.forEach((obj, index) => {
            if (obj.itemData) {
                const selectedItem = this.createSelectedItemElement(obj, index);
                selectedItemsContainer.appendChild(selectedItem);
            }
        });
        
        if (selectedCount) {
            selectedCount.textContent = `${objects.length}개`;
        }
    }
    
    createSelectedItemElement(object, index) {
        const itemData = object.itemData;
        const item = document.createElement('div');
        item.className = 'selected-item';
        item.dataset.objectIndex = index;
        
        const img = document.createElement('img');
        img.src = `/assets/${itemData.image}`;
        img.alt = itemData.name;
        
        const info = document.createElement('div');
        info.className = 'selected-item-info';
        
        const name = document.createElement('div');
        name.className = 'selected-item-name';
        name.textContent = itemData.name;
        
        const actions = document.createElement('div');
        actions.className = 'selected-item-actions';
        
        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
        deleteBtn.className = 'item-delete-btn';
        deleteBtn.title = '삭제';
        deleteBtn.onclick = (e) => {
            e.stopPropagation();
            this.canvas.remove(object);
            this.canvas.renderAll();
        };
        
        actions.appendChild(deleteBtn);
        info.appendChild(name);
        
        item.appendChild(img);
        item.appendChild(info);
        item.appendChild(actions);
        
        // 클릭 시 해당 객체 선택
        item.onclick = () => {
            this.canvas.setActiveObject(object);
            this.canvas.renderAll();
        };
        
        return item;
    }
    
    hideWelcomeOverlay() {
        const overlay = document.getElementById('canvasOverlay');
        if (overlay) overlay.style.display = 'none';
    }

    showWatermark() {
        // 이 함수는 app.js에서 호출되지만, 현재는 기능이 필요 없습니다.
        // 호환성을 위해 빈 함수로 남겨둡니다.
    }

    hideWatermark() {
        // 이 함수는 app.js에서 호출되지만, 현재는 기능이 필요 없습니다.
        // 호환성을 위해 빈 함수로 남겨둡니다.
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }
    
    duplicate() {
        const activeObject = this.canvas.getActiveObject();
        if (activeObject) {
            activeObject.clone(cloned => {
                cloned.set({
                    left: activeObject.left + 20,
                    top: activeObject.top + 20,
                });
                this.canvas.add(cloned).setActiveObject(cloned);
            });
        }
    }

    clear() {
        this.canvas.clear();
        this.currentBackground = null;
        
        const overlay = document.getElementById('canvasOverlay');
        if (overlay) {
            overlay.classList.remove('hidden');
            overlay.style.display = 'flex';
        }
        
        this.saveState();
    }

    downloadImage() {
        const dataURL = this.canvas.toDataURL({
            format: 'png',
            quality: 1,
            multiplier: 2
        });
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = 'design.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
} 