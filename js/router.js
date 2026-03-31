/**
 * Portal Karyawan - Router PT. BISATANI
 * Mengatur perpindahan halaman (SPA) & Inisialisasi Halaman
 */

const router = {
    currentPage: 'dashboard',
    routes: ['dashboard', 'absensi', 'admin-dashboard', 'employees', 'attendance-reports', 'payroll-reports', 'settings'],
    
    init() {
        // 1. Menangani klik pada menu navigasi (Sidebar)
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                if (page) this.navigate(page);
            });
        });

        // 2. Menangani klik pada navigasi bawah (Mobile)
        document.querySelectorAll('.bottom-nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                // Jangan cegah default jika itu tombol logout
                if (item.getAttribute('onclick')) return;
                
                e.preventDefault();
                const page = item.dataset.page;
                if (page) this.navigate(page);
            });
        });
        
        // 3. Menangani tombol back/forward browser
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.page) {
                this.showPage(e.state.page, false);
            }
        });
        
        // 4. Cek halaman terakhir atau default
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
        
        // Update status aktif di Sidebar & Bottom Nav
        document.querySelectorAll('.nav-item, .bottom-nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.page === page) item.classList.add('active');
        });
        
        // Tampilkan/Sembunyikan elemen halaman
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        const targetPage = document.getElementById(`page-${page}`);
        if (targetPage) targetPage.classList.add('active');
        
        const pageTitle = document.getElementById('page-title');
        if (pageTitle) pageTitle.textContent = titles[page];
        
        if (pushState) {
            history.pushState({ page }, titles[page], `#${page}`);
        }
        
        // Jalankan fungsi khusus per halaman
        this.triggerPageInit(page);
        
        const contentArea = document.querySelector('.page-content');
        if (contentArea) contentArea.scrollTop = 0;
    },
    
    triggerPageInit(page) {
        console.log("Inisialisasi halaman:", page);
        switch(page) {
            case 'dashboard':
                if (window.initDashboard) window.initDashboard();
                break;
            case 'absensi':
                // Pastikan fungsi absen dibangunkan setiap kali halaman dibuka
                if (window.initAbsensi) window.initAbsensi();
                break;
            case 'employees':
                // REVISI: Tambahkan inisialisasi Data Karyawan
                if (window.initEmployees) window.initEmployees();
                break;
            case 'payroll-reports':
                // Inisialisasi payroll jika ada fungsi rekap
                break;
            case 'settings':
                if (window.settings && window.settings.init) window.settings.init();
                break;
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    router.init();
});

window.router = router;
