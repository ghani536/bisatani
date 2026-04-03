/**
 * PT. BISATANI - Settings Engine (Optimized)
 */
const settings = {
    data: {},

    async init() {
        console.log("Settings: Mengambil konfigurasi...");
        await this.loadSettings();
    },

    async loadSettings() {
        try {
            // GUNAKAN api.get agar sinkron dengan data di Google Sheets
            const res = await api.get('getSettings');
            
            if (res && res.success) {
                this.data = res.data || {};
                console.log("Settings Data Loaded:", this.data);
                this.fillForm();
            }
        } catch (e) { 
            console.error("Settings Load Error:", e); 
        }
    },

    fillForm() {
        // Daftar ID di HTML dan Key di Google Sheets
        const fields = {
            'set-jam-masuk': 'jam_masuk',
            'set-jam-pulang': 'jam_pulang',
            'set-jam-lembur-min': 'jam_lembur_min',
            'set-overtime-rate': 'overtime_rate',
            'set-late-rate': 'late_rate' // Tambahkan ini agar sinkron
        };

        for (let id in fields) {
            const el = document.getElementById(id);
            const value = this.data[fields[id]];
            
            if (el && value !== undefined && value !== null) {
                el.value = value;
            }
        }
    },

    async saveWorkTime() {
        const btn = document.querySelector('button[onclick="settings.saveWorkTime()"]');
        if (!btn) return;

        try {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';

            // Ambil data dari input
            const payload = {
                action: 'savePayrollSettings',
                jam_masuk: document.getElementById('set-jam-masuk')?.value || "08:00",
                jam_pulang: document.getElementById('set-jam-pulang')?.value || "17:00",
                jam_lembur_min: document.getElementById('set-jam-lembur-min')?.value || "17:30",
                overtime_rate: document.getElementById('set-overtime-rate')?.value || "0",
                late_rate: document.getElementById('set-late-rate')?.value || "0"
            };

            const res = await api.post(payload);
            
            if (res && res.success) {
                alert("✅ Pengaturan Berhasil Disimpan!");
                this.data = { ...this.data, ...payload };
            } else {
                // Failsafe jika Google Script merespon tapi lambat (CORS)
                alert("Proses simpan sedang berjalan di server. Silakan refresh halaman nanti.");
            }
        } catch (e) { 
            console.error("Save Error:", e);
            alert("Terjadi gangguan jaringan saat menyimpan."); 
        } finally { 
            btn.disabled = false; 
            btn.innerHTML = '<i class="fas fa-save"></i> SIMPAN PENGATURAN SISTEM'; 
        }
    }
};

window.settings = settings;
