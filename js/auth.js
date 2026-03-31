/**
 * Portal Karyawan - Authentication PT. BISATANI
 * Handle login/logout and session management
 */

const auth = {
    currentUser: null,

    init() {
        // 1. Cek Sesi yang tersimpan
        const session = storage.get('session');
        if (session) {
            this.currentUser = session;
            this.showApp();
        }

        // 2. Handler Form Login
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            // Gunakan arrow function agar 'this' tetap merujuk ke object auth
            loginForm.onsubmit = (e) => this.handleLogin(e);
        }

        // 3. Toggle password visibility
        const togglePassword = document.getElementById('toggle-password');
        if (togglePassword) {
            togglePassword.onclick = () => this.togglePasswordVisibility();
        }

        // 4. Logout button
        const logoutBtn = document.getElementById('btn-logout');
        if (logoutBtn) {
            logoutBtn.onclick = () => this.handleLogout();
        }
        
        // 5. Profile click
        const userProfile = document.querySelector('.user-profile');
        if (userProfile) {
            const userInfoArea = userProfile.querySelector('.user-info');
            const userAvatarArea = userProfile.querySelector('.user-avatar');
            if (userInfoArea) {
                userInfoArea.style.cursor = 'pointer';
                userInfoArea.onclick = () => this.openProfileModal();
            }
            if (userAvatarArea) {
                userAvatarArea.style.cursor = 'pointer';
                userAvatarArea.onclick = () => this.openProfileModal();
            }
        }
    },

    async handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const role = document.querySelector('input[name="role"]:checked').value;

        if (!email || !password) {
            toast.error('Email dan password harus diisi!');
            return;
        }

        const submitBtn = e.target.querySelector('.btn-login');
        submitBtn.disabled = true;
        toast.info("Sedang memverifikasi...");

        try {
            // Pastikan fungsi api.login sudah benar di api.js
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

                toast.success(`Selamat datang, ${user.name}!`);
                
                // Pindah ke tampilan Aplikasi
                this.showApp();
            } else {
                toast.error(result.error || 'Email atau password salah!');
            }
        } catch (error) {
            console.error('Login error:', error);
            toast.error('Gagal terhubung ke server');
        } finally {
            submitBtn.disabled = false;
        }
    },

    handleLogout() {
        if (confirm('Apakah Anda yakin ingin logout?')) {
            this.currentUser = null;
            storage.remove('session');
            storage.remove('currentPage');
            window.location.reload(); // Reload untuk reset semua state JS
        }
    },

    showApp() {
        const loginContainer = document.getElementById('login-container');
        const appContainer = document.getElementById('app-container');

        if (loginContainer && appContainer) {
            loginContainer.classList.add('hidden'); // Gunakan class hidden agar konsisten
            loginContainer.style.display = 'none';
            appContainer.classList.remove('hidden');

            this.updateUserUI();

            // Tentukan menu berdasarkan role
            const employeeNav = document.getElementById('employee-menu');
            const adminNav = document.getElementById('admin-menu-nav');
            
            if (this.currentUser && this.currentUser.role === 'admin') {
                if (employeeNav) employeeNav.classList.add('hidden');
                if (adminNav) adminNav.classList.remove('hidden');
                router.navigate('admin-dashboard');
            } else {
                if (employeeNav) employeeNav.classList.remove('hidden');
                if (adminNav) adminNav.classList.add('hidden');
                router.navigate('dashboard');
            }
        }
    },

    updateUserUI() {
        if (!this.currentUser) return;
        const userNameEl = document.getElementById('user-name');
        const userRoleEl = document.getElementById('user-role');
        const welcomeNameEl = document.getElementById('welcome-name');
        const avatarEl = document.getElementById('user-avatar');

        if (userNameEl) userNameEl.textContent = this.currentUser.name;
        if (userRoleEl) userRoleEl.textContent = this.currentUser.role === 'admin' ? 'Administrator' : 'Karyawan';
        if (welcomeNameEl) welcomeNameEl.textContent = this.currentUser.name.split(' ')[0];
        if (avatarEl) {
            avatarEl.src = this.currentUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(this.currentUser.name)}&background=10B981&color=fff`;
        }
    },

    togglePasswordVisibility() {
        const passwordInput = document.getElementById('login-password');
        const toggleBtn = document.getElementById('toggle-password');
        const icon = toggleBtn.querySelector('i');

        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            if(icon) icon.className = 'fas fa-eye-slash';
        } else {
            passwordInput.type = 'password';
            if(icon) icon.className = 'fas fa-eye';
        }
    },

    isLoggedIn() {
        return this.currentUser !== null;
    }
};

// Inisialisasi
document.addEventListener('DOMContentLoaded', () => {
    auth.init();
});
