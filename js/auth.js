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
                console.log("Auth: Form disubmit!");
                await this.handleLogin();
            };
        }

        // Handle Logout Button
        const logoutBtn = document.getElementById('btn-logout');
        if (logoutBtn) {
            logoutBtn.onclick = () => this.handleLogout();
        }
    },

    async handleLogin() {
        const emailEl = document.getElementById('login-email');
        const passwordEl = document.getElementById('login-password');
        const roleEl = document.querySelector('input[name="role"]:checked');

        if (!emailEl || !passwordEl || !roleEl) {
            console.error("Auth: Elemen form tidak ditemukan!");
            return;
        }

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
            console.log("Auth: Respon dari server:", res);

            if (res.success && res.data) {
                // Simpan data user dan tambahkan role
                this.user = { ...res.data, role: res.data.role || role };
                storage.set('session', this.user);
                this.showApp();
            } else {
                alert(res.error || "Login Gagal. Cek kembali data Anda.");
                this.resetButton();
            }
        } catch (err) {
            console.error("Auth: Error fatal saat login:", err);
            alert("Terjadi kesalahan sistem. Silakan coba lagi.");
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
        console.log("Auth: Menampilkan Dashboard...");
        const loginCont = document.getElementById('login-container');
        const appCont = document.getElementById('app-container');
        
        if (loginCont) loginCont.style.display = 'none';
        if (appCont) {
            appCont.classList.remove('hidden');
            appCont.style.display = 'flex';
        }

        if (this.user) {
            const nameEl = document.getElementById('user-name');
            const welcomeEl = document.getElementById('welcome-name');
            const roleEl = document.getElementById('user-role');
            
            if (nameEl) nameEl.textContent = this.user.name;
            if (welcomeEl) welcomeEl.textContent = this.user.name.split(' ')[0];
            if (roleEl) roleEl.textContent = this.user.role === 'admin' ? 'Administrator' : 'Karyawan';
            
            // Navigasi Router
            if (window.router) {
                const target = (this.user.role === 'admin') ? 'admin-dashboard' : 'dashboard';
                router.navigate(target);
            }
        }
    },

    // --- FUNGSI KRUSIAL UNTUK ROUTER ---
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

// Pastikan inisialisasi berjalan
document.addEventListener('DOMContentLoaded', () => auth.init());

// Ekspos ke global agar bisa dibaca router.js
window.auth = auth;
