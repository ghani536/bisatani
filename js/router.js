/**
 * Portal Karyawan - Router PT. BISATANI
 * Menangani navigasi antar halaman
 */
const router = {
    currentPage: 'dashboard',
    routes: ['dashboard', 'absensi', 'admin-dashboard', 'employees', 'attendance-reports', 'payroll-reports', 'settings'],
    
    init() {
        console.log("Router: Menginisialisasi navigasi...");
        
        // Pilih semua elemen menu
        const menuItems = document.querySelectorAll('.nav-item, .bottom-nav-item');
        
        menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                // Jangan cegah klik jika itu tombol logout (biarkan dihandle auth.js)
                if (item.id === 'btn-logout' || item.getAttribute('onclick')) return;
                
                e.preventDefault();
                const page = item.dataset.page;
                
                if (page) {
                    this.navigate(page);
                }
            });
        });
    },

    navigate(page) {
        // --- PROTEKSI UTAMA ---
        // Cek apakah objek auth ada dan fungsinya tersedia
        if (typeof auth === 'undefined' || typeof auth.isLoggedIn !== 'function') {
            console.error("Router: Sistem Auth belum siap.");
            return;
        }

        // Hanya pindah jika sudah login
        if (!auth.isLoggedIn()) {
            console.warn("Router: Akses ditolak, user belum login.");
            return;
        }

        console.log("Router: Berpindah ke halaman ->", page);

        // 1. Update Class Active di Menu (Sidebar & Bottom Nav)
        document.querySelectorAll('.nav-item, .bottom-nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.page === page) item.classList.add('active');
        });

        // 2. Tampilkan Halaman yang Sesuai
        const allPages = document.querySelectorAll('.page');
        allPages.forEach(p => p.classList.remove('active'));
        
        const target = document.getElementById(`page-${page}`);
        if (target) {
            target.classList.add('active');
            this.currentPage = page;
            
            // Simpan posisi halaman terakhir agar jika refresh tidak balik ke awal
            storage.set('currentPage', page);
        }

        // 3. Update Judul di Top Bar
        const titleEl = document.getElementById('page-title');
        if (titleEl) {
            titleEl.textContent = page.replace('-', ' ').toUpperCase();
        }

        // 4. Inisialisasi Data Spesifik Halaman
        this.triggerPageInit(page);
    },

    triggerPageInit(page) {
        try {
            if (page === 'attendance-reports' && window.adminReports) {
                window.adminReports.init();
            }
            // Anda bisa tambah init untuk halaman lain di sini
        } catch (e) { 
            console.error("Router: Gagal memuat data halaman " + page, e); 
        }
    }
};

// Gunakan timeout sedikit agar memastikan auth.js sudah window.auth = auth dulu
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        router.init();
        
        // Jika sudah login, buka halaman terakhir yang dibuka
        if (typeof auth !== 'undefined' && auth.isLoggedIn && auth.isLoggedIn()) {
            const lastPage = storage.get('currentPage') || 'dashboard';
            router.navigate(lastPage);
        }
    }, 150); 
});

window.router = router;
