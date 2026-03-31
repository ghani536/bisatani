/**
 * Portal Karyawan - Settings PT. BISATANI
 * Mengatur Konfigurasi Waktu & Parameter Gaji
 */

const settings = {
    data: {},

    async init() {
        console.log("Settings Initializing...");
        await this.loadSettings();
    },

    async loadSettings() {
        try {
            const res = await api.post({ action: 'getSettings' });
            if (res.success) {
                // Mapping data dari format array ke object agar mudah diakses
                res.data.forEach(item => {
                    this.data[item.key] = item.value;
                });
                this.renderSettings();
            }
        } catch (error) {
            console.error("Gagal memuat pengaturan:", error);
        }
    },

    renderSettings() {
        // --- 1. Waktu Kerja ---
        const jamMasuk = document.getElementById('set-jam-masuk');
        const jamPulang = document.getElementById('set-jam-pulang');
        
        if (jamMasuk) jamMasuk.value = this.data['jam_masuk'] || '08:00';
        if (jamPulang) jamPulang.value = this.data['jam_pulang'] || '17:00';

        // --- 2. Parameter Gaji & Denda ---
        const overtimeRate = document.getElementById('set-overtime-rate');
        const lateRate = document.getElementById('set-late-rate');
        
        if (overtimeRate) overtimeRate.value = this.data['overtime_rate'] || 15000;
        if (lateRate) lateRate.value = this.data['late_rate'] || 1000;
    },

    async saveWorkTime() {
        const jamMasuk = document.getElementById('set-jam-masuk').value;
        const jamPulang = document.getElementById('set-jam-pulang').value;
        
        // Kita hitung otomatis jam mulai lembur (biasanya sama dengan jam pulang)
        const jamMulaiLembur = jamPulang; 

        toast.info("Menyimpan waktu kerja...");
        
        try {
            const res = await api.post({
                action: 'savePayrollSettings',
                jam_masuk: jamMasuk,
                jam_pulang: jamPulang,
                jam_mulai_lembur: jamMulaiLembur
            });

            if (res.success) {
                toast.success("Jam kerja PT. Bisatani berhasil diperbarui!");
            } else {
                toast.error("Gagal menyimpan: " + res.error);
            }
        } catch (e) {
            toast.error("Gangguan koneksi server.");
        }
    },

    async savePayroll() {
        const overtimeRate = document.getElementById('set-overtime-rate').value;
        const lateRate = document.getElementById('set-late-rate').value;
        const bpjsRate = 150000; // Default atau ambil dari input jika ada

        toast.info("Menyimpan parameter gaji...");

        try {
            const res = await api.post({
                action: 'savePayrollSettings',
                overtime_rate: overtimeRate,
                late_rate: lateRate,
                bpjs_rate: bpjsRate
            });

            if (res.success) {
                toast.success("Parameter gaji berhasil disimpan!");
            } else {
                toast.error("Gagal: " + res.error);
            }
        } catch (e) {
            toast.error("Koneksi bermasalah.");
        }
    }
};

// Global init untuk router
window.initSettings = () => settings.init();
window.settings = settings;
