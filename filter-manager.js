/**
 * Filter Manager - 검색 및 필터링 시스템
 */
class FilterManager {
    constructor(itemsData) {
        this.originalItems = itemsData || [];
        this.filteredItems = [...this.originalItems];
        this.activeFilters = {
            search: '',
            type: 'all',
            color: 'all',
            direction: 'all'
        };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.renderFilterUI();
        console.log('Filter Manager initialized');
    }
    
    setupEventListeners() {
        // 검색 입력
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce((e) => {
                this.setFilter('search', e.target.value);
                this.applyFilters();
            }, 300));
        }
        
        // 타입 필터
        const typeFilters = document.getElementById('typeFilters');
        if (typeFilters) {
            typeFilters.addEventListener('click', (e) => {
                if (e.target.classList.contains('tag-btn')) {
                    this.setActiveButton(e.target, 'typeFilters');
                    this.setFilter('type', e.target.dataset.filter);
                    this.applyFilters();
                }
            });
        }
        
        // 색상 필터
        const colorFilters = document.getElementById('colorFilters');
        if (colorFilters) {
            colorFilters.addEventListener('click', (e) => {
                if (e.target.classList.contains('tag-btn')) {
                    this.setActiveButton(e.target, 'colorFilters');
                    this.setFilter('color', e.target.dataset.filter);
                    this.applyFilters();
                }
            });
        }
        
        // 비즈 방향 필터
        const directionFilters = document.getElementById('directionFilters');
        if (directionFilters) {
            directionFilters.addEventListener('click', (e) => {
                if (e.target.classList.contains('tag-btn')) {
                    this.setActiveButton(e.target, 'directionFilters');
                    this.setFilter('direction', e.target.dataset.filter);
                    this.applyFilters();
                }
            });
        }
    }
    
    renderFilterUI() {
        this.updateItemCount();
    }
    
    setFilter(type, value) {
        this.activeFilters[type] = value;
    }
    
    setActiveButton(activeBtn, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.querySelectorAll('.tag-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        activeBtn.classList.add('active');
    }
    
    applyFilters() {
        this.filteredItems = this.originalItems.filter(item => {
            return this.matchesSearch(item) &&
                   this.matchesType(item) &&
                   this.matchesColor(item) &&
                   this.matchesDirection(item);
        });
        
        this.updateItemCount();
        this.renderItems();
        this.dispatchFilterEvent();
    }
    
    matchesSearch(item) {
        const searchTerm = this.activeFilters.search.toLowerCase();
        if (!searchTerm) return true;
        
        return item.name.toLowerCase().includes(searchTerm) ||
               item.tags.some(tag => tag.toLowerCase().includes(searchTerm));
    }
    
    matchesType(item) {
        const typeFilter = this.activeFilters.type;
        if (typeFilter === 'all') return true;
        
        return item.type === typeFilter || item.tags.includes(typeFilter);
    }
    
    matchesColor(item) {
        const colorFilter = this.activeFilters.color;
        if (colorFilter === 'all') return true;
        
        return item.color === colorFilter || item.tags.includes(colorFilter);
    }
    
    matchesDirection(item) {
        const directionFilter = this.activeFilters.direction;
        if (directionFilter === 'all') return true;
        
        // 비즈 방향 필터링 - tags 배열에서 방향 정보 확인
        return item.tags.includes(directionFilter);
    }
    
    renderItems() {
        const itemsGrid = document.getElementById('itemsGrid');
        if (!itemsGrid) return;
        
        itemsGrid.innerHTML = '';
        
        if (this.filteredItems.length === 0) {
            this.renderEmptyState(itemsGrid);
            return;
        }
        
        this.filteredItems.forEach(item => {
            const itemCard = this.createItemCard(item);
            itemsGrid.appendChild(itemCard);
        });
    }
    
    renderEmptyState(container) {
        container.innerHTML = `
            <div class="empty-state-grid">
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <h4>검색 결과가 없습니다</h4>
                    <p>다른 검색어나 필터를 시도해보세요</p>
                    <button class="btn btn-secondary" onclick="filterManager.clearFilters()">
                        <i class="fas fa-refresh"></i>
                        필터 초기화
                    </button>
                </div>
            </div>
        `;
    }
    
    createItemCard(item) {
        const card = document.createElement('div');
        card.className = 'item-card fade-in';
        card.dataset.itemId = item.id;
        
        const img = document.createElement('img');
        img.src = `/assets/${item.image}`;
        img.alt = item.name;
        img.draggable = false;
        
        const name = document.createElement('div');
        name.className = 'item-name';
        name.textContent = item.name;
        
        card.appendChild(img);
        card.appendChild(name);
        
        card.addEventListener('click', () => {
            this.addItemToCanvas(item);
            this.addClickEffect(card);
        });
        
        return card;
    }
    
    addItemToCanvas(item) {
        if (window.canvasManager) {
            window.canvasManager.addItem(item).then(() => {
                console.log('Item added to canvas:', item.name);
            }).catch(error => {
                console.error('Failed to add item to canvas:', error);
            });
        }
    }
    
    addClickEffect(card) {
        card.classList.add('clicked');
        setTimeout(() => {
            card.classList.remove('clicked');
        }, 200);
    }
    
    updateItemCount() {
        const itemsCount = document.getElementById('itemsCount');
        if (itemsCount) {
            const total = this.originalItems.length;
            const filtered = this.filteredItems.length;
            
            if (filtered === total) {
                itemsCount.textContent = `${total}개 아이템`;
            } else {
                itemsCount.textContent = `${filtered}개 / ${total}개 아이템`;
            }
        }
    }
    
    clearFilters() {
        this.activeFilters = {
            search: '',
            type: 'all',
            color: 'all',
            direction: 'all'
        };
        
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = '';
        }
        
        document.querySelectorAll('.tag-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        document.querySelectorAll('[data-filter="all"]').forEach(btn => {
            btn.classList.add('active');
        });
        
        this.applyFilters();
    }
    
    dispatchFilterEvent() {
        const event = new CustomEvent('filtersChanged', {
            detail: {
                activeFilters: this.activeFilters,
                filteredItems: this.filteredItems,
                itemCount: this.filteredItems.length
            }
        });
        
        document.dispatchEvent(event);
    }
    
    debounce(func, wait) {
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
    
    updateItems(newItems) {
        this.originalItems = newItems;
        this.applyFilters();
    }
    
    getFilteredItems() {
        return this.filteredItems;
    }
} 