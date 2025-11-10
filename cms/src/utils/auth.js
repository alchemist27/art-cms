// 정적 관리자 계정 설정
const ADMIN_CREDENTIALS = {
    email: 'admin@sugardeco.com',
    password: 'sugardeco2024!'
};

// 로그인 상태 확인
export const isAuthenticated = () => {
    return sessionStorage.getItem('isLoggedIn') === 'true';
};

// 로그인 처리
export const login = (email, password) => {
    if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('adminEmail', email);
        return true;
    }
    return false;
};

// 로그아웃 처리
export const logout = () => {
    sessionStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('adminEmail');
};

// 현재 로그인한 사용자 정보
export const getCurrentUser = () => {
    if (isAuthenticated()) {
        return {
            email: sessionStorage.getItem('adminEmail')
        };
    }
    return null;
};