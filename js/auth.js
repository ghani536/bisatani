const auth = {
    currentUser: null,

    init() {
        // Cek apakah sudah ada sesi
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
            const res = await api.post({ action: 'login', email, password });

            if (res.success && res.data) {
                this.currentUser = res.data;
                this.currentUser.role = res.data.role || role;
                storage.set('session', this.currentUser);
                
                this.showApp();
                if(window.toast) toast.success("Selamat datang!");
            } else {
                alert(res.error || "Login Gagal");
            }
        } catch (err) {
            alert("Koneksi ke server gagal");
        }
    },

    showApp() {
        const login = document.getElementById('login-container');
        const app = document.getElementById('app-container');
        
        if (login) login.style.display = 'none';
        if (app) {
            app.classList.remove('hidden');
            app.style.display = 'flex';
        }

        // Update Nama di Sidebar
        const nameEl = document.getElementById('user-name');
        if (nameEl && this.currentUser) nameEl.textContent = this.currentUser.name;

        // Navigasi awal
        if (window.router) {
            const target = (this.currentUser.role === 'admin') ? 'admin-dashboard' : 'dashboard';
            router.navigate(target);
        }
    },

    handleLogout() {
        storage.clear();
        window.location.reload();
    },

    isLoggedIn() {
        return this.currentUser !== null;
    }
};

document.addEventListener('DOMContentLoaded', () => auth.init());
window.auth = auth;
