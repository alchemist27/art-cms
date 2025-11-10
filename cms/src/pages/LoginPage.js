import { login } from '../utils/auth.js';
import { router } from '../router.js';

export class LoginPage {
    constructor(container) {
        this.container = container;
        this.render();
        this.attachEvents();
    }
    
    render() {
        this.container.innerHTML = `
            <div class="login-container">
                <div class="login-card">
                    <div class="login-header">
                        <h1>슈가데코 CMS</h1>
                        <p>관리자 로그인</p>
                    </div>
                    <form id="loginForm">
                        <div class="form-group">
                            <label class="form-label">이메일</label>
                            <input type="email" class="form-input" id="email" required placeholder="admin@sugardeco.com">
                        </div>
                        <div class="form-group">
                            <label class="form-label">비밀번호</label>
                            <input type="password" class="form-input" id="password" required placeholder="비밀번호를 입력하세요">
                        </div>
                        <button type="submit" class="btn btn-primary">로그인</button>
                    </form>
                    <div id="errorMessage" style="color: var(--danger); margin-top: 16px; text-align: center; display: none;"></div>
                </div>
            </div>
        `;
    }
    
    attachEvents() {
        const form = document.getElementById('loginForm');
        const errorMessage = document.getElementById('errorMessage');
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            if (login(email, password)) {
                router.navigate('/dashboard');
            } else {
                errorMessage.textContent = '이메일 또는 비밀번호가 올바르지 않습니다.';
                errorMessage.style.display = 'block';
                
                // 3초 후 에러 메시지 숨기기
                setTimeout(() => {
                    errorMessage.style.display = 'none';
                }, 3000);
            }
        });
    }
}