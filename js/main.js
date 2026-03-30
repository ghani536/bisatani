/**
 * Portal Karyawan - Main JavaScript PT. BISATANI
 * Utility functions and shared functionality
 */

// Storage Manager (Untuk simpan sesi login)
const storage = {
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) { return defaultValue; }
    },
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) { return false; }
    },
    remove(key) { localStorage.removeItem(key); },
    clear() { localStorage.clear(); }
};

// Toast Notification System (Notifikasi Cantik)
const toast = {
    container: null,
    init() { this.container = document.getElementById('toast-container'); },
    show(message, type = 'info', title = '', duration = 3000) {
        if (!this.container) this.init();
        const icons = { success: 'fa-check-circle', error: 'fa-times-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
        const titles = { success: 'Berhasil', error: 'Error', warning: 'Peringatan', info: 'Info' };
        const toastEl = document.createElement('div');
        toastEl.className = `toast ${type}`;
        toastEl.innerHTML = `
            <div class="toast-icon"><i class="fas ${icons[type]}"></i></div>
            <div class="toast-content">
                <div class="toast-title">${title || titles[type]}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>
        `;
        this.container.appendChild(toastEl);
        setTimeout(() => {
            toastEl.style.opacity = '0';
            toastEl.style.transform = 'translateX(100%)';
            setTimeout(() => toastEl.remove(), 300);
        }, duration);
    },
    success(message, title) { this.show(message, 'success', title); },
    error(message, title) { this.show(message, 'error', title); }
};

// Date & Time Utilities
const dateTime = {
    formatDate(date) {
        const d = new Date(date);
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    },
    formatTime(date) {
        return new Date(date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
};

// Update UI Identity PT. BISATANI
function updateCompanyUI() {
    const companyName = "PT. BISATANI";
    const elements = {
        'login-company-name': companyName,
        'footer-company': companyName,
        'sidebar-brand': "BISATANI"
    };
    Object.entries(elements).forEach(([id, value]) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    });
    document.title = companyName;
}

// Inisialisasi saat halaman siap
document.addEventListener('DOMContentLoaded', () => {
    updateCompanyUI();

    // Jalankan jam digital di pojok kanan atas
    const timeDisplay = document.getElementById('current-time');
    if (timeDisplay) {
        setInterval(() => {
            const now = new Date();
            const timeEl = timeDisplay.querySelector('.time');
            const dateEl = timeDisplay.querySelector('.date');
            if (timeEl) timeEl.textContent = dateTime.formatTime(now);
            if (dateEl) dateEl.textContent = dateTime.formatDate(now);
        }, 1000);
    }

    // Tampilkan nama user yang login
    const userNameEl = document.getElementById('user-name');
    const welcomeNameEl = document.getElementById('welcome-name');
    const storedName = localStorage.getItem('userName');
    if (storedName) {
        if (userNameEl) userNameEl.textContent = storedName;
        if (welcomeNameEl) welcomeNameEl.textContent = storedName;
    }
});

// Export Global
window.storage = storage;
window.toast = toast;
window.dateTime = dateTime;