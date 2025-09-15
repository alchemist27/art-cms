import { logout } from '../utils/auth.js';
import { router } from '../router.js';

export class Sidebar {
    static render(activePage) {
        return `
            <aside class="sidebar">
                <div class="sidebar-header">
                    <div class="sidebar-logo">✨ 슈가데코 CMS</div>
                </div>
                
                <nav>
                    <ul class="nav-menu">
                        <li class="nav-item">
                            <a href="/dashboard" class="nav-link ${activePage === 'dashboard' ? 'active' : ''}" data-route="/dashboard">
                                <span class="nav-icon">📊</span>
                                대시보드
                            </a>
                        </li>
                        <li class="nav-item">
                            <a href="/images" class="nav-link ${activePage === 'images' ? 'active' : ''}" data-route="/images">
                                <span class="nav-icon">🖼️</span>
                                이미지 관리
                            </a>
                        </li>
                        <li class="nav-item" style="margin-top: auto; padding-top: 20px; border-top: 1px solid var(--border-color);">
                            <a href="#" class="nav-link" id="logoutBtn">
                                <span class="nav-icon">🚪</span>
                                로그아웃
                            </a>
                        </li>
                    </ul>
                </nav>
            </aside>
        `;
    }
    
    static attachEvents() {
        // 네비게이션 링크 이벤트
        document.querySelectorAll('.nav-link[data-route]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const route = e.currentTarget.getAttribute('data-route');
                router.navigate(route);
            });
        });
        
        // 로그아웃 이벤트
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                logout();
                router.navigate('/login');
            });
        }
    }
}