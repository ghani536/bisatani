/**
 * Portal Karyawan - Router PT. BISATANI
 */
const router = {
    currentPage: 'dashboard',
    
    init() {
        document.querySelectorAll('.nav-item, .bottom-nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (item.getAttribute('onclick')) return;
                e.preventDefault();
                const page = item.dataset.page;
                if (page) this.navigate(page);
            });
        });
    },

    navigate(page) {
        // Hanya pindah jika sudah login
        if (!auth.isLoggedIn()) return;

        // Update Menu Aktif
        document.querySelectorAll('.nav-item, .bottom-nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.page === page) item.classList.add('active');
        });

        // Tampilkan Halaman
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        const target = document.getElementById(`page-${page}`);
        if (target) target.classList.add('active');

        // Update Judul
        const titleEl = document.getElementById('page-title');
        if (titleEl) titleEl.textContent = page.replace('-', ' ').toUpperCase();

        // Init Data Halaman
        try {
            if (page === 'attendance-reports' && window.adminReports) {
                adminReports.init();
            }
        } catch (e) { console.error("Halaman Error:", e); }
    }
};

document.addEventListener('DOMContentLoaded', () => router.init());
window.router = router;
