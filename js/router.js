/**
 * Portal Karyawan - Router PT. BISATANI
 * Mengatur perpindahan halaman (SPA)
 */

const router = {
    currentPage: 'dashboard',
    // Daftar rute yang aktif di PT. Bisatani
    routes: ['dashboard', 'absensi', 'admin-dashboard', 'employees', 'attendance-reports', 'payroll-reports', 'settings'],
    
    init() {
        // Menangani klik pada menu navigasi
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                if (page) this.navigate(page);
            });
        });
        
        // Menangani tombol back/forward browser
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.page) {
                this.showPage(e.state.page, false);
            }
        });
        
        // Cek halaman terakhir yang dibuka dari storage
        const storedPage = storage.get('currentPage');
        if (storedPage && this.routes.includes(storedPage)) {
            this.showPage(storedPage, false);
        } else {
            this.showPage('dashboard', false);
        }
    },
    
    navigate(page) {
        if (!this.routes.includes(page)) return;
        this.showPage(page, true);
        storage.set('currentPage', page);
    },
    
    showPage(page, pushState = true) {
        this.currentPage = page;
        
        // Judul halaman di tab browser
        const titles = {
            dashboard: 'Dashboard',
            absensi: 'Absensi & Lembur',
            'admin-dashboard': 'Admin Panel',
            employees: 'Data Karyawan',
            'attendance-reports': 'Rekap Absensi',
            'payroll-reports': 'Rekap Gaji (Payroll)',
            settings: 'Pengaturan Gaji'
        };
        
        document.title = `${titles[page]} - PT. BISATANI`;
        
        // Update status aktif di Sidebar
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.page === page) item.classList.add('active');
        });
        
        // Tampilkan/Sembunyikan elemen halaman
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        const targetPage = document.getElementById(`page-${page}`);
        if (targetPage) targetPage.classList.add('active');
        
        // Update judul di Header atas
        const pageTitle = document.getElementById('page-title');
        if (pageTitle) pageTitle.textContent = titles[page];
        
        // Simpan ke history browser
        if (pushState) {
            history.pushState({ page }, titles[page], `#${page}`);
        }
        
        // Panggil fungsi inisialisasi halaman jika ada
        this.triggerPageInit(page);
        
        // Scroll kembali ke atas setiap pindah halaman
        const contentArea = document.querySelector('.page-content');
        if (contentArea) contentArea.scrollTop = 0;
    },
    
    triggerPageInit(page) {
        switch(page) {
            case 'dashboard':
                if (window.initDashboard) window.initDashboard();
                break;
            case 'absensi':
                if (window.initAbsensi) window.initAbsensi();
                break;
            case 'payroll-reports':
                // Inisialisasi halaman payroll jika diperlukan
                break;
            case 'settings':
                if (window.settings && window.settings.init) window.settings.init();
                break;
        }
    }
};

// Inisialisasi router saat DOM siap
document.addEventListener('DOMContentLoaded', () => {
    router.init();
});

window.router = router;