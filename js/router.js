/**
 * Portal Karyawan - Router PT. BISATANI
 * Menangani navigasi antar halaman & Inisialisasi Script
 */
const router = {
    currentPage: 'dashboard',
    
    init() {
        console.log("Router: Menginisialisasi navigasi...");
        const menuItems = document.querySelectorAll('.nav-item, .bottom-nav-item, [data-page]');
        
        menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const page = item.dataset.page;
                if (page) {
                    e.preventDefault();
                    this.navigate(page);
                }
            });
        });

        // Cek jika ada sesi tersimpan
        const lastPage = storage.get('currentPage') || 'dashboard';
        if (auth.isLoggedIn()) this.navigate(lastPage);
    },

    navigate(page) {
        if (!auth.isLoggedIn()) return;

        console.log("Router: Berpindah ke ->", page);

        // 1. Update UI Active Class
        document.querySelectorAll('.nav-item, .bottom-nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.page === page) item.classList.add('active');
        });

        // 2. Switch Halaman
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        const target = document.getElementById(`page-${page}`);
        if (target) {
            target.classList.add('active');
            this.currentPage = page;
            storage.set('currentPage', page);
            
            // Update Title
            const titleEl = document.getElementById('page-title');
            if (titleEl) titleEl.textContent = page.replace('-', ' ').toUpperCase();
            
            // 3. Jalankan Init Spesifik Halaman
            this.triggerPageInit(page);
        }
    },

    triggerPageInit(page) {
        try {
            // Aktifkan script sesuai halaman
            if (page === 'absensi' && window.absensi) window.absensi.init();
            if (page === 'attendance-reports' && window.adminReports) window.adminReports.init();
            if (page === 'employees' && window.adminEmployees) window.adminEmployees.init();
            if (page === 'payroll-reports' && window.payroll) window.payroll.init();
            if (page === 'settings' && window.settings) window.settings.init();
        } catch (e) {
            console.error("Router: Gagal init halaman " + page, e);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => router.init(), 200);
});
