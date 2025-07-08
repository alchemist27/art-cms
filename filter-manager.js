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
            color: ['all'], // 배열로 변경하여 다중 선택 지원
            direction: 'all',
            sort: 'popular' // 정렬 옵션 추가
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
                    // 비즈 방향 필터 그룹 표시/숨김 처리
                    const directionGroup = document.getElementById('directionFilterGroup');
                    if (directionGroup) {
                        if (e.target.dataset.filter === '비즈') {
                            directionGroup.style.display = '';
                        } else {
                            directionGroup.style.display = 'none';
                        }
                    }
                    // 모루공예 타입 필터 그룹 표시/숨김 처리
                    const moruGroup = document.getElementById('moruFilterGroup');
                    if (moruGroup) {
                        if (e.target.dataset.filter === '모루공예') {
                            moruGroup.style.display = '';
                        } else {
                            moruGroup.style.display = 'none';
                        }
                    }
                    // 부재료 타입 필터 그룹 표시/숨김 처리
                    const bunjaeGroup = document.getElementById('bunjaeFilterGroup');
                    if (bunjaeGroup) {
                        if (e.target.dataset.filter === '부재료') {
                            bunjaeGroup.style.display = '';
                        } else {
                            bunjaeGroup.style.display = 'none';
                        }
                    }
                    this.applyFilters();
                }
            });
        }
        
        // 색상 필터
        const colorFilters = document.getElementById('colorFilters');
        if (colorFilters) {
            colorFilters.addEventListener('click', (e) => {
                if (e.target.classList.contains('tag-btn')) {
                    const color = e.target.dataset.filter;
                    let selectedColors = [...this.activeFilters.color];

                    if (color === 'all') {
                        // '전체' 클릭 시 모두 해제하고 'all'만 남김
                        selectedColors = ['all'];
                        colorFilters.querySelectorAll('.tag-btn').forEach(btn => btn.classList.remove('active'));
                        e.target.classList.add('active');
                    } else {
                        // 'all'이 선택되어 있으면 해제
                        selectedColors = selectedColors.filter(c => c !== 'all');
                        if (selectedColors.includes(color)) {
                            // 이미 선택된 색상 클릭 시 해제
                            selectedColors = selectedColors.filter(c => c !== color);
                            e.target.classList.remove('active');
                        } else {
                            // 새 색상 추가
                            selectedColors.push(color);
                            e.target.classList.add('active');
                        }
                        // 아무것도 선택 안 하면 'all' 활성화
                        if (selectedColors.length === 0) {
                            selectedColors = ['all'];
                            colorFilters.querySelector('[data-filter="all"]').classList.add('active');
                        } else {
                            colorFilters.querySelector('[data-filter="all"]').classList.remove('active');
                        }
                    }
                    this.setFilter('color', selectedColors);
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
        
        // 정렬 탭
        const sortTabs = document.getElementById('sortTabs');
        if (sortTabs) {
            sortTabs.addEventListener('click', (e) => {
                if (e.target.classList.contains('sort-tab')) {
                    this.setActiveSortTab(e.target);
                    this.setFilter('sort', e.target.dataset.sort);
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
    
    setActiveSortTab(activeTab) {
        const sortTabs = document.getElementById('sortTabs');
        if (!sortTabs) return;
        
        sortTabs.querySelectorAll('.sort-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        activeTab.classList.add('active');
    }
    
    applyFilters() {
        this.filteredItems = this.originalItems.filter(item => {
            return this.matchesSearch(item) &&
                   this.matchesType(item) &&
                   this.matchesColor(item) &&
                   this.matchesDirection(item);
        });
        
        // 정렬 적용
        this.sortItems();
        
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
        if (colorFilter.includes('all')) return true; // 배열에 'all'이 포함되어 있으면 모든 색상 통과
        
        return colorFilter.some(color => item.color === color || item.tags.includes(color));
    }
    
    matchesDirection(item) {
        const directionFilter = this.activeFilters.direction;
        if (directionFilter === 'all') return true;
        
        // 비즈 방향 필터링 - tags 배열에서 방향 정보 확인
        return item.tags.includes(directionFilter);
    }
    
    sortItems() {
        const sortType = this.activeFilters.sort;
        
        switch (sortType) {
            case 'popular':
                // 인기순 - 기본 순서 유지 (items.json의 순서)
                break;
            case 'small':
                // 작은순 - 크기 기준 오름차순
                this.filteredItems.sort((a, b) => {
                    const sizeA = (a.width || 0) * (a.height || 0);
                    const sizeB = (b.width || 0) * (b.height || 0);
                    return sizeA - sizeB;
                });
                break;
            case 'large':
                // 큰순 - 크기 기준 내림차순
                this.filteredItems.sort((a, b) => {
                    const sizeA = (a.width || 0) * (a.height || 0);
                    const sizeB = (b.width || 0) * (b.height || 0);
                    return sizeB - sizeA;
                });
                break;
            default:
                break;
        }
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
            color: ['all'],
            direction: 'all',
            sort: 'popular'
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
        
        // 정렬 탭 초기화
        const sortTabs = document.getElementById('sortTabs');
        if (sortTabs) {
            sortTabs.querySelectorAll('.sort-tab').forEach(tab => {
                tab.classList.remove('active');
            });
            sortTabs.querySelector('[data-sort="popular"]').classList.add('active');
        }
        
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