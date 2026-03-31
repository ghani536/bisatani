const router = {
    routes: ['dashboard', 'absensi', 'admin-dashboard', 'employees', 'attendance-reports', 'payroll-reports', 'settings'],
    init() {
        document.querySelectorAll('.nav-item, .bottom-nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                if (page) this.navigate(page);
            });
        });
    },
    navigate(page) {
        if (!this.routes.includes(page)) return;
        
        // Sembunyikan semua halaman
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        
        // Tampilkan halaman tujuan
        const target = document.getElementById(`page-${page}`);
        if (target) target.classList.add('active');
        
        // Update Title
        const titleEl = document.getElementById('page-title');
        if (titleEl) titleEl.textContent = page.replace('-', ' ').toUpperCase();

        // Jalankan Init Halaman (Proteksi Error)
        try {
            this.triggerPageInit(page);
        } catch (e) { console.error("Gagal init halaman:", page); }
    },
    triggerPageInit(page) {
        if (page === 'attendance-reports' && window.adminReports) {
            adminReports.init();
        }
        // Tambahkan init lain di sini jika perlu
    }
};
document.addEventListener('DOMContentLoaded', () => router.init());
window.router = router;
