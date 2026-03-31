/**
 * Portal Karyawan - Auth PT. BISATANI
 */
const auth = {
    user: null,

    init() {
        console.log("Auth: Inisialisasi...");
        const session = storage.get('session');
        if (session) {
            this.user = session;
            this.showApp();
        }

        const form = document.getElementById('login-form');
        if (form) {
            form.onsubmit = async (e) => {
                e.preventDefault();
                await this.handleLogin();
            };
        }

        const logoutBtn = document.getElementById('btn-logout');
        if (logoutBtn) {
            logoutBtn.onclick = () => this.handleLogout();
        }
    },

    async handleLogin() {
        const emailEl = document.getElementById('login-email');
        const passwordEl = document.getElementById('login-password');
        const roleEl = document.querySelector('input[name="role"]:checked');

        if (!emailEl || !passwordEl || !roleEl) return;

        const email = emailEl.value;
        const password = passwordEl.value;
        const role = roleEl.value;

        const btn = document.querySelector('.btn-login');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<span>Memverifikasi...</span>';
        }

        try {
            const res = await api.login(email, password);
            if (res.success && res.data) {
                this.user = { ...res.data, role: res.data.role || role };
                storage.set('session', this.user);
                this.showApp();
            } else {
                alert(res.error || "Login Gagal.");
                this.resetButton();
            }
        } catch (err) {
            alert("Kesalahan sistem.");
            this.resetButton();
        }
    },

    resetButton() {
        const btn = document.querySelector('.btn-login');
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<span>Login</span><i class="fas fa-arrow-right"></i>';
        }
    },

    showApp() {
        const loginCont = document.getElementById('login-container');
        const appCont = document.getElementById('app-container');
        
        if (loginCont) loginCont.style.display = 'none';
        if (appCont) {
            appCont.classList.remove('hidden');
            appCont.style.display = 'flex';
        }

        if (this.user) {
            // Update UI Identitas
            document.getElementById('user-name').textContent = this.user.name;
            const welcomeEl = document.getElementById('welcome-name');
            if (welcomeEl) welcomeEl.textContent = this.user.name.split(' ')[0];
            
            document.getElementById('user-role').textContent = 
                this.user.role === 'admin' ? 'Administrator' : 'Karyawan';
            
            // Manajemen Menu Admin vs Karyawan
            const adminMenu = document.getElementById('admin-menu-nav');
            const empMenu = document.getElementById('employee-menu');

            if (this.user.role === 'admin') {
                if (adminMenu) adminMenu.classList.remove('hidden');
                if (empMenu) empMenu.classList.add('hidden');
                if (window.router) router.navigate('admin-dashboard');
            } else {
                if (adminMenu) adminMenu.classList.add('hidden');
                if (empMenu) empMenu.classList.remove('hidden');
                if (window.router) router.navigate('dashboard');
                
                // OPTIMASI: Langsung siapkan kamera & GPS di background
                if (window.absensi) {
                    console.log("Auth: Memanaskan hardware absensi...");
                    absensi.init(); 
                }
            }
        }
    }, // <-- Tadi kurang kurung kurawal ini

    isLoggedIn() {
        return this.user !== null;
    },

    handleLogout() {
        if (confirm("Apakah Anda yakin ingin keluar?")) {
            storage.clear();
            this.user = null;
            window.location.reload();
        }
    }
};

document.addEventListener('DOMContentLoaded', () => auth.init());
window.auth = auth;
