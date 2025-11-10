import { LoginPage } from './pages/LoginPage.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { ProductsPage } from './pages/ProductsPage.js';
import { BackgroundsPage } from './pages/BackgroundsPage.js';
import { isAuthenticated } from './utils/auth.js';

class Router {
    constructor() {
        this.routes = {
            '/login': LoginPage,
            '/dashboard': DashboardPage,
            '/products': ProductsPage,
            '/backgrounds': BackgroundsPage,
            '/cms/login': LoginPage,
            '/cms/dashboard': DashboardPage,
            '/cms/products': ProductsPage,
            '/cms/backgrounds': BackgroundsPage
        };
        
        // 보호된 라우트 목록
        this.protectedRoutes = ['/dashboard', '/products', '/backgrounds', '/cms/dashboard', '/cms/products', '/cms/backgrounds'];
    }
    
    init() {
        const path = window.location.pathname;
        if (path === '/' || !this.routes[path]) {
            this.navigate('/login');
        } else {
            this.render(path);
        }
    }
    
    navigate(path) {
        // 보호된 라우트 접근 시 인증 체크
        if (this.protectedRoutes.includes(path) && !isAuthenticated()) {
            window.history.pushState({}, '', '/login');
            this.render('/login');
            return;
        }
        
        window.history.pushState({}, '', path);
        this.render(path);
    }
    
    render(path) {
        const app = document.getElementById('app');
        
        // 보호된 라우트 접근 시 인증 체크
        if (this.protectedRoutes.includes(path) && !isAuthenticated()) {
            path = '/login';
        }
        
        const Page = this.routes[path];
        
        if (Page) {
            app.innerHTML = '';
            new Page(app);
        } else {
            // 존재하지 않는 경로는 로그인 상태에 따라 처리
            if (isAuthenticated()) {
                this.navigate('/dashboard');
            } else {
                this.navigate('/login');
            }
        }
    }
}

export const router = new Router();