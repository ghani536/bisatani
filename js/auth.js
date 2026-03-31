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

        console.log("Auth: Mencoba login untuk:", email);

        const btn = document.querySelector('.btn-login');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<span>Memverifikasi...</span>';
        }

        try {
            // DI SINI BIASANYA MACET KALAU api.js ERROR
            const res = await api.login(email, password);
            console.log("Auth: Respon dari server:", res);

            if (res.success && res.data) {
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
            if (nameEl) nameEl.textContent = this.user.name;
            
            if (window.router) {
                const target = (this.user.role === 'admin') ? 'admin-dashboard' : 'dashboard';
                router.navigate(target);
            }
        }
    }
};

document.addEventListener('DOMContentLoaded', () => auth.init());
window.auth = auth;
