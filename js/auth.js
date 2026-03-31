const auth = {
    user: null,
    init() {
        const session = storage.get('session');
        if (session) {
            this.user = session;
            this.showApp();
        }
        const form = document.getElementById('login-form');
        if (form) form.onsubmit = (e) => this.handleLogin(e);
        
        const logoutBtn = document.getElementById('btn-logout');
        if (logoutBtn) logoutBtn.onclick = () => this.handleLogout();
    },
    async handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;
        const role = document.querySelector('input[name="role"]:checked').value;

        try {
            const res = await api.login(email, password);
            if (res.success && res.data) {
                this.user = res.data;
                this.user.role = res.data.role || role;
                storage.set('session', this.user);
                this.showApp();
            } else {
                alert(res.error || "Login Gagal");
            }
        } catch (err) { alert("Error Server"); }
    },
    showApp() {
        document.getElementById('login-container').style.display = 'none';
        const app = document.getElementById('app-container');
        app.classList.remove('hidden');
        app.style.display = 'flex';
        
        const nameEl = document.getElementById('user-name');
        if (nameEl && this.user) nameEl.textContent = this.user.name;

        if (window.router) {
            const target = (this.user.role === 'admin') ? 'admin-dashboard' : 'dashboard';
            router.navigate(target);
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
