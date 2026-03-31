/**
 * Portal Karyawan - Main JavaScript PT. BISATANI
 * Versi Stabil: Fix Session & UI Sync
 */

// 1. Storage Manager
const storage = {
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            if (!item) return defaultValue;
            return JSON.parse(item);
        } catch (e) { 
            console.error("Storage Get Error:", e);
            return defaultValue; 
        }
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

// 2. Toast Notification
const toast = {
    container: null,
    init() { 
        this.container = document.getElementById('toast-container'); 
    },
    show(message, type = 'info', title = '', duration = 3000) {
        if (!this.container) this.init();
        if (!this.container) return; // Guard jika elemen tidak ada

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
        `;
        
        this.container.appendChild(toastEl);
        
        setTimeout(() => {
            toastEl.style.opacity = '0';
            setTimeout(() => toastEl.remove(), 500);
        }, duration);
    },
    success(msg) { this.show(msg, 'success'); },
    error(msg) { this.show(msg, 'error'); },
    info(msg) { this.show(msg, 'info'); }
};

// 3. Date & Time Utils
const dateTime = {
    formatDate(date) {
        const d = new Date(date);
        if (isNaN(d)) return "-";
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    },
    formatTime(date) {
        const d = new Date(date);
        if (isNaN(d)) return "--:--";
        return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }
};

// 4. Inisialisasi DOM
document.addEventListener('DOMContentLoaded', () => {
    // Jalankan Jam Digital
    const timeDisplay = document.getElementById('current-time');
    if (timeDisplay) {
        const timeEl = timeDisplay.querySelector('.time');
        const dateEl = timeDisplay.querySelector('.date');
        
        setInterval(() => {
            const now = new Date();
            if (timeEl) timeEl.textContent = dateTime.formatTime(now);
            if (dateEl) dateEl.textContent = dateTime.formatDate(now);
        }, 1000);
    }
});

// Export Global
window.storage = storage;
window.toast = toast;
window.dateTime = dateTime;
