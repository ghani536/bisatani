/**
 * Portal Karyawan - Router PT. BISATANI
 * Menangani navigasi antar halaman & Inisialisasi Script
 */
const router = {
    currentPage: 'dashboard',
    
    init() {
        console.log("Router: Menginisialisasi navigasi...");
        
        // Ambil semua elemen yang punya atribut data-page
        const menuItems = document.querySelectorAll('[data-page]');
        
        menuItems.forEach(item => {
            // Hapus event listener lama agar tidak double
            item.onclick = (e) => {
                const page = item.getAttribute('data-page');
                if (page) {
                    e.preventDefault();
                    this.navigate(page);
                }
            };
        });

        // Cek jika ada sesi tersimpan atau sedang login
        // Gunakan localStorage langsung jika 'storage' object tidak ditemukan
        const savedPage = localStorage.getItem('currentPage') || 'dashboard';
        
        if (typeof auth !== 'undefined' && auth.isLoggedIn()) {
            this.navigate(savedPage);
        }
    },

    navigate(page) {
        // Cek Login (Pastikan object auth ada)
        if (typeof auth !== 'undefined' && !auth.isLoggedIn()) return;

        console.log("Router: Berpindah ke ->", page);

        // 1. Update UI Active Class di Sidebar & Bottom Nav
        document.querySelectorAll('[data-page]').forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-page') === page) {
                item.classList.add('active');
            }
        });

        // 2. Switch Halaman (Sembunyikan semua, munculkan satu)
        const allPages = document.querySelectorAll('.page');
        allPages.forEach(p => {
            p.classList.remove('active');
            p.style.display = 'none'; // Paksa sembunyi
        });

        const target = document.getElementById(`page-${page}`);
        if (target) {
            target.classList.add('active');
            target.style.display = 'block'; // Paksa muncul
            
            this.currentPage = page;
            localStorage.setItem('currentPage', page);
            
            // Update Title di Header
            const titleEl = document.getElementById('page-title');
            if (titleEl) {
                // Ubah 'payroll-reports' jadi 'PAYROLL REPORTS'
                titleEl.textContent = page.replace(/-/g, ' ').toUpperCase();
            }
            
            // 3. JALANKAN INIT SPESIFIK HALAMAN
            this.triggerPageInit(page);
        } else {
            console.error("Router: ID halaman tidak ditemukan -> page-" + page);
        }
    },

    triggerPageInit(page) {
        try {
            console.log("Router: Menjalankan init untuk script ->", page);

            // Mapping halaman ke script yang sesuai
            switch (page) {
                case 'dashboard':
                    if (window.dashboard) window.dashboard.init();
                    break;
                case 'absensi':
                    if (window.absensi) window.absensi.init();
                    break;
                case 'employees':
                    if (window.adminEmployees) window.adminEmployees.init();
                    break;
                case 'attendance-reports':
                    // PASTIKAN NAMA OBJECTNYA adminReports
                    if (window.adminReports) {
                        window.adminReports.init();
                    } else {
                        console.warn("Router: Script adminReports belum ter-load!");
                    }
                    break;
                case 'payroll-reports':
                    if (window.payroll) window.payroll.init();
                    break;
                case 'settings':
                    if (window.settings) window.settings.init();
                    break;
            }
        } catch (e) {
            console.error("Router: Gagal init halaman " + page, e);
        }
    }
};

// Jalankan router saat halaman siap
document.addEventListener('DOMContentLoaded', () => {
    // Beri jeda sedikit agar script lain (api.js, auth.js) siap dulu
    setTimeout(() => {
        router.init();
    }, 300);
});
