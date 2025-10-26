import { db, storage } from '../config/firebase.js';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, query, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { Sidebar } from '../components/Sidebar.js';

export class ImageManagementPage {
    constructor(container) {
        this.container = container;
        this.currentTab = 'products';
        this.images = [];
        this.filteredImages = [];
        this.render();
        this.attachEvents();
        this.loadImages();
    }
    
    render() {
        this.container.innerHTML = `
            <div class="dashboard-container">
                ${Sidebar.render('images')}
                
                <div class="main-content">
                    <div class="page-header">
                        <h1 class="page-title">이미지 관리</h1>
                        <p class="page-subtitle">제품 및 배경 이미지를 관리합니다</p>
                    </div>
                    
                    <div class="image-management">
                        <div class="tabs">
                            <button class="tab-btn active" data-tab="products">제품 이미지</button>
                            <button class="tab-btn" data-tab="backgrounds">배경 이미지</button>
                        </div>
                        
                        <div class="upload-section" id="uploadSection">
                            <p class="upload-text">이미지를 드래그하거나 클릭하여 업로드</p>
                            <input type="file" class="file-input" id="fileInput" accept="image/*" multiple>
                            <button class="btn btn-primary" onclick="document.getElementById('fileInput').click()">
                                파일 선택
                            </button>
                        </div>
                        
                        <div id="uploadForm" style="display: none;">
                            <h3 style="margin-bottom: 20px;">이미지 정보 입력</h3>
                            <div class="image-form">
                                <div class="form-row">
                                    <label class="form-label">이미지 이름</label>
                                    <input type="text" class="form-input" id="imageName" required>
                                </div>
                                
                                <div class="form-row half">
                                    <label class="form-label">타입</label>
                                    <select class="form-select" id="imageType">
                                        <option value="">선택하세요</option>
                                    </select>
                                </div>
                                
                                <div class="form-row half">
                                    <label class="form-label">옵션</label>
                                    <select class="form-select" id="imageOption">
                                        <option value="">선택하세요</option>
                                    </select>
                                </div>
                                
                                <div class="form-row">
                                    <label class="form-label">색상 태그</label>
                                    <input type="text" class="form-input" id="colorTags" placeholder="콤마로 구분 (예: red, blue, green)">
                                </div>
                                
                                <div class="form-row half" id="sizeRow" style="display: none;">
                                    <label class="form-label">너비 (mm)</label>
                                    <input type="number" class="form-input" id="widthMm" placeholder="20">
                                </div>
                                
                                <div class="form-row half" id="heightRow" style="display: none;">
                                    <label class="form-label">높이 (mm)</label>
                                    <input type="number" class="form-input" id="heightMm" placeholder="30">
                                </div>
                                
                                <div class="form-row">
                                    <button class="btn btn-primary" id="saveImageBtn">저장</button>
                                    <button class="btn btn-secondary" id="cancelUploadBtn" style="margin-left: 10px;">취소</button>
                                </div>
                            </div>
                        </div>
                        
                        <div class="filter-section">
                            <div class="search-box">
                                <input type="text" class="search-input" id="searchInput" placeholder="이미지 검색...">
                            </div>
                            <select class="filter-dropdown" id="typeFilter">
                                <option value="">모든 타입</option>
                            </select>
                            <select class="filter-dropdown" id="colorFilter">
                                <option value="">모든 색상</option>
                                <option value="black">블랙</option>
                                <option value="blue">블루</option>
                                <option value="green">그린</option>
                                <option value="red">레드</option>
                                <option value="yellow">옐로우</option>
                                <option value="orange">오렌지</option>
                                <option value="pink">핑크</option>
                                <option value="purple">퍼플</option>
                                <option value="white">화이트</option>
                                <option value="transparent">투명</option>
                                <option value="gold">골드</option>
                                <option value="silver">실버</option>
                            </select>
                        </div>
                        
                        <div class="images-grid" id="imagesGrid">
                            <div class="loading-state">
                                <div class="loading-spinner"></div>
                                <p>이미지를 불러오는 중...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        Sidebar.attachEvents();
        this.updateTypeOptions();
    }
    
    updateTypeOptions() {
        const typeSelect = document.getElementById('imageType');
        const typeFilter = document.getElementById('typeFilter');
        
        if (this.currentTab === 'products') {
            typeSelect.innerHTML = `
                <option value="">선택하세요</option>
                <option value="비즈">비즈</option>
                <option value="파츠">파츠</option>
                <option value="팬던트">팬던트</option>
                <option value="모루공예">모루공예</option>
                <option value="부자재">부자재</option>
                <option value="끈/줄">끈/줄</option>
            `;
            
            typeFilter.innerHTML = `
                <option value="">모든 타입</option>
                <option value="비즈">비즈</option>
                <option value="파츠">파츠</option>
                <option value="팬던트">팬던트</option>
                <option value="모루공예">모루공예</option>
                <option value="부자재">부자재</option>
                <option value="끈/줄">끈/줄</option>
            `;
        } else {
            typeSelect.innerHTML = `
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
            `;
            
            typeFilter.innerHTML = `
                <option value="">모든 타입</option>
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
            `;
        }
    }
    
    attachEvents() {
        // 탭 전환
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentTab = e.target.dataset.tab;
                this.updateTypeOptions();
                this.loadImages();
                
                // 제품 탭일 때만 사이즈 입력 표시
                const sizeRow = document.getElementById('sizeRow');
                const heightRow = document.getElementById('heightRow');
                if (this.currentTab === 'products') {
                    sizeRow.style.display = 'block';
                    heightRow.style.display = 'block';
                } else {
                    sizeRow.style.display = 'none';
                    heightRow.style.display = 'none';
                }
            });
        });
        
        // 타입 선택시 옵션 업데이트
        document.getElementById('imageType').addEventListener('change', (e) => {
            this.updateOptionsByType(e.target.value);
        });
        
        // 파일 업로드
        const uploadSection = document.getElementById('uploadSection');
        const fileInput = document.getElementById('fileInput');
        
        uploadSection.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadSection.classList.add('drag-over');
        });
        
        uploadSection.addEventListener('dragleave', () => {
            uploadSection.classList.remove('drag-over');
        });
        
        uploadSection.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadSection.classList.remove('drag-over');
            this.handleFiles(e.dataTransfer.files);
        });
        
        fileInput.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });
        
        // 저장 버튼
        document.getElementById('saveImageBtn').addEventListener('click', () => {
            this.saveImage();
        });
        
        // 취소 버튼
        document.getElementById('cancelUploadBtn').addEventListener('click', () => {
            this.cancelUpload();
        });
        
        // 검색 및 필터
        document.getElementById('searchInput').addEventListener('input', () => this.filterImages());
        document.getElementById('typeFilter').addEventListener('change', () => this.filterImages());
        document.getElementById('colorFilter').addEventListener('change', () => this.filterImages());
    }
    
    updateOptionsByType(type) {
        const optionSelect = document.getElementById('imageOption');
        
        if (this.currentTab === 'products') {
            switch(type) {
                case '비즈':
                    optionSelect.innerHTML = `
                        <option value="">선택하세요</option>
                        <option value="가로">가로</option>
                        <option value="세로">세로</option>
                    `;
                    break;
                case '모루공예':
                    optionSelect.innerHTML = `
                        <option value="">선택하세요</option>
                        <option value="옷소품">옷소품</option>
                        <option value="눈코">눈코</option>
                    `;
                    break;
                case '부재료':
                    optionSelect.innerHTML = `
                        <option value="">선택하세요</option>
                        <option value="키링,군번줄">키링,군번줄</option>
                        <option value="체인,O링,부속">체인,O링,부속</option>
                        <option value="마감,9핀,T핀">마감,9핀,T핀</option>
                        <option value="반지,목걸이,귀걸이">반지,목걸이,귀걸이</option>
                    `;
                    break;
                default:
                    optionSelect.innerHTML = '<option value="">해당없음</option>';
            }
        } else {
            optionSelect.innerHTML = '<option value="">해당없음</option>';
        }
    }
    
    async handleFiles(files) {
        if (files.length === 0) return;
        
        this.currentFile = files[0];
        const reader = new FileReader();
        
        reader.onload = (e) => {
            document.getElementById('uploadSection').style.display = 'none';
            document.getElementById('uploadForm').style.display = 'block';
            
            // 파일명을 기본 이름으로 설정
            const fileName = this.currentFile.name.split('.')[0];
            document.getElementById('imageName').value = fileName;
        };
        
        reader.readAsDataURL(this.currentFile);
    }
    
    async saveImage() {
        const name = document.getElementById('imageName').value;
        const type = document.getElementById('imageType').value;
        const option = document.getElementById('imageOption').value;
        const colorTags = document.getElementById('colorTags').value.split(',').map(tag => tag.trim()).filter(tag => tag);
        
        if (!name || !type) {
            alert('필수 정보를 입력해주세요.');
            return;
        }
        
        try {
            // Storage에 이미지 업로드
            const timestamp = Date.now();
            const fileName = `${this.currentTab}/${timestamp}_${this.currentFile.name}`;
            const storageRef = ref(storage, fileName);
            const snapshot = await uploadBytes(storageRef, this.currentFile);
            const downloadURL = await getDownloadURL(snapshot.ref);
            
            // Firestore에 메타데이터 저장
            const imageData = {
                name,
                type,
                option: option || null,
                colors: colorTags,
                imageUrl: downloadURL,
                storagePath: fileName,
                createdAt: new Date(),
                category: this.currentTab
            };
            
            // 제품인 경우 사이즈 정보 추가
            if (this.currentTab === 'products') {
                const widthMm = document.getElementById('widthMm').value;
                const heightMm = document.getElementById('heightMm').value;
                if (widthMm && heightMm) {
                    imageData.size = {
                        width_mm: parseInt(widthMm),
                        height_mm: parseInt(heightMm)
                    };
                }
            }
            
            await addDoc(collection(db, this.currentTab), imageData);
            
            alert('이미지가 성공적으로 업로드되었습니다.');
            this.cancelUpload();
            this.loadImages();
        } catch (error) {
            console.error('이미지 업로드 실패:', error);
            alert('이미지 업로드에 실패했습니다.');
        }
    }
    
    cancelUpload() {
        document.getElementById('uploadSection').style.display = 'block';
        document.getElementById('uploadForm').style.display = 'none';
        document.getElementById('fileInput').value = '';
        this.currentFile = null;
        
        // 폼 초기화
        document.getElementById('imageName').value = '';
        document.getElementById('imageType').value = '';
        document.getElementById('imageOption').value = '';
        document.getElementById('colorTags').value = '';
        document.getElementById('widthMm').value = '';
        document.getElementById('heightMm').value = '';
    }
    
    async loadImages() {
        try {
            const snapshot = await getDocs(collection(db, this.currentTab));
            this.images = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            this.filteredImages = [...this.images];
            this.displayImages();
        } catch (error) {
            console.error('이미지 로드 실패:', error);
        }
    }
    
    filterImages() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        const typeFilter = document.getElementById('typeFilter').value;
        const colorFilter = document.getElementById('colorFilter').value;
        
        this.filteredImages = this.images.filter(image => {
            const matchesSearch = !searchTerm || image.name.toLowerCase().includes(searchTerm);
            const matchesType = !typeFilter || image.type === typeFilter;
            const matchesColor = !colorFilter || (image.colors && image.colors.includes(colorFilter));
            
            return matchesSearch && matchesType && matchesColor;
        });
        
        this.displayImages();
    }
    
    displayImages() {
        const grid = document.getElementById('imagesGrid');
        
        if (this.filteredImages.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <p>등록된 이미지가 없습니다.</p>
                </div>
            `;
            return;
        }
        
        grid.innerHTML = this.filteredImages.map(image => `
            <div class="image-card" data-id="${image.id}">
                <img src="${image.imageUrl}" alt="${image.name}" class="image-preview">
                <div class="image-info">
                    <div class="image-name">${image.name}</div>
                    <div class="image-meta">
                        <span class="meta-tag">${image.type}</span>
                        ${image.option ? `<span class="meta-tag">${image.option}</span>` : ''}
                        ${image.size ? `<span class="meta-tag">${image.size.width_mm}x${image.size.height_mm}mm</span>` : ''}
                    </div>
                    ${image.colors && image.colors.length > 0 ? `
                        <div class="image-meta">
                            ${image.colors.map(color => `<span class="meta-tag">${color}</span>`).join('')}
                        </div>
                    ` : ''}
                    <div class="image-actions">
                        <button class="btn btn-small btn-danger" onclick="window.deleteImage('${image.id}', '${image.storagePath}')">
                            삭제
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }
}

// 전역 함수로 삭제 기능 추가
window.deleteImage = async (imageId, storagePath) => {
    if (!confirm('정말 이 이미지를 삭제하시겠습니까?')) return;
    
    try {
        // Storage에서 이미지 삭제
        const storageRef = ref(storage, storagePath);
        await deleteObject(storageRef);
        
        // Firestore에서 문서 삭제
        const currentTab = window.location.pathname === '/images' ? 
            document.querySelector('.tab-btn.active').dataset.tab : 'products';
        await deleteDoc(doc(db, currentTab, imageId));
        
        alert('이미지가 삭제되었습니다.');
        
        // 페이지 새로고침 대신 이미지 목록 재로드
        const page = new ImageManagementPage(document.getElementById('app'));
    } catch (error) {
        console.error('이미지 삭제 실패:', error);
        alert('이미지 삭제에 실패했습니다.');
    }
};