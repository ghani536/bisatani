/**
 * Portal Karyawan - Auth PT. BISATANI
 */
const auth = {
    user: null,

    init() {
        const session = storage.get('session');
        if (session) {
            this.user = session;
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

        toast.info("Memverifikasi...");

        try {
            const res = await api.login(email, password);
            if (res.success && res.data) {
                this.user = { ...res.data, role: res.data.role || role };
                storage.set('session', this.user);
                toast.success("Login Berhasil!");
                this.showApp();
            } else {
                toast.error(res.error || "Login Gagal");
            }
        } catch (err) {
            toast.error("Gagal terhubung ke server");
        }
    },

    showApp() {
        // Sembunyikan Login, Tampilkan App
        const loginCont = document.getElementById('login-container');
        const appCont = document.getElementById('app-container');
        
        if (loginCont) loginCont.style.display = 'none';
        if (appCont) {
            appCont.classList.remove('hidden');
            appCont.style.display = 'flex';
        }

        // Update UI Identitas
        if (this.user) {
            document.getElementById('user-name').textContent = this.user.name;
            document.getElementById('welcome-name').textContent = this.user.name.split(' ')[0];
            
            const adminMenu = document.getElementById('admin-menu-nav');
            const empMenu = document.getElementById('employee-menu');
            
            if (this.user.role === 'admin') {
                if (adminMenu) adminMenu.classList.remove('hidden');
                if (window.router) window.router.navigate('admin-dashboard');
            } else {
                if (empMenu) empMenu.classList.remove('hidden');
                if (window.router) window.router.navigate('dashboard');
            }
        }
    },

    handleLogout() {
        storage.clear();
        window.location.reload();
    },

    isLoggedIn() { return this.user !== null; }
};

document.addEventListener('DOMContentLoaded', () => auth.init());
window.auth = auth;
