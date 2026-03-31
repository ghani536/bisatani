const auth = {
    currentUser: null,

    init() {
        const session = storage.get('session');
        if (session) {
            this.currentUser = session;
            this.showApp();
        }

        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.onsubmit = (e) => this.handleLogin(e);
        }

        const logoutBtn = document.getElementById('btn-logout');
        if (logoutBtn) {
            logoutBtn.onclick = () => this.handleLogout();
        }
    },

    async handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const role = document.querySelector('input[name="role"]:checked').value;

        try {
            const result = await api.login(email, password);

            if (result.success && result.data) {
                const user = {
                    id: result.data.id,
                    email: result.data.email,
                    name: result.data.name,
                    role: result.data.role || role,
                    avatar: result.data.avatar || '',
                    loginTime: new Date().toISOString()
                };

                this.currentUser = user;
                storage.set('session', user);
                
                // LANGSUNG PANGGIL SHOWAPP TANPA TUNGGU ROUTER
                this.showApp();
                toast.success(`Selamat datang, ${user.name}!`);
            } else {
                toast.error(result.error || 'Email atau password salah!');
            }
        } catch (error) {
            toast.error('Gagal terhubung ke server');
        }
    },

    showApp() {
        const loginContainer = document.getElementById('login-container');
        const appContainer = document.getElementById('app-container');

        if (loginContainer && appContainer) {
            // PAKSA SEMBUNYIKAN LOGIN
            loginContainer.style.setProperty('display', 'none', 'important');
            loginContainer.classList.add('hidden');
            
            // PAKSA TAMPILKAN APP
            appContainer.style.setProperty('display', 'flex', 'important');
            appContainer.classList.remove('hidden');

            this.updateUserUI();

            const adminNav = document.getElementById('admin-menu-nav');
            const empNav = document.getElementById('employee-menu');
            
            if (this.currentUser && this.currentUser.role === 'admin') {
                if (adminNav) adminNav.classList.remove('hidden');
                if (empNav) empNav.classList.add('hidden');
                if (window.router) window.router.navigate('admin-dashboard');
            } else {
                if (adminNav) adminNav.classList.add('hidden');
                if (empNav) empNav.classList.remove('hidden');
                if (window.router) window.router.navigate('dashboard');
            }
        }
    },

    updateUserUI() {
        if (!this.currentUser) return;
        const nameEl = document.getElementById('user-name');
        const welcomeEl = document.getElementById('welcome-name');
        if (nameEl) nameEl.textContent = this.currentUser.name;
        if (welcomeEl) welcomeEl.textContent = this.currentUser.name.split(' ')[0];
    },

    handleLogout() {
        storage.clear();
        window.location.reload();
    },

    isLoggedIn() {
        return this.currentUser !== null || storage.get('session') !== null;
    }
};

document.addEventListener('DOMContentLoaded', () => auth.init());
window.auth = auth;
