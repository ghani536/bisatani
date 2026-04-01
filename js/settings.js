/**
 * Portal Karyawan - Settings Engine PT. BISATANI
 * Menangani Jam Kerja, Tarif Lembur, dan Denda Telat
 */
const settings = {
    data: {},

    async init() {
        console.log("Settings: Mengambil konfigurasi...");
        await this.loadSettings();
    },

    async loadSettings() {
        const container = document.getElementById('page-settings');
        if (!container) return;

        try {
            // Ambil data settings dari Google Apps Script
            const res = await api.post({ action: 'getSettings' });
            
            if (res.success) {
                // Normalisasi data (Array to Object)
                this.data = {};
                if (Array.isArray(res.data)) {
                    res.data.forEach(item => {
                        this.data[item.key] = item.value;
                    });
                } else {
                    this.data = res.data;
                }

                // Masukkan data ke Input Form di HTML
                this.fillForm();
            }
        } catch (e) {
            console.error("Settings: Gagal load data", e);
        }
    },

    fillForm() {
        // Mapping ID Input ke Key di Database
        const fields = {
            'set-jam-masuk': 'jam_masuk',
            'set-jam-pulang': 'jam_pulang',
            'set-overtime-rate': 'overtime_rate',
            'set-late-rate': 'late_rate'
        };

        for (let id in fields) {
            const el = document.getElementById(id);
            const val = this.data[fields[id]];
            if (el && val !== undefined) {
                el.value = val;
            }
        }
    },

    async saveWorkTime() {
        const btn = document.querySelector('button[onclick="settings.saveWorkTime()"]');
        const originalText = btn.innerHTML;

        try {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';

            // Ambil nilai dari input
            const payload = {
                action: 'savePayrollSettings', // Sesuai case di Kode.gs
                jam_masuk: document.getElementById('set-jam-masuk').value,
                jam_pulang: document.getElementById('set-jam-pulang').value,
                overtime_rate: document.getElementById('set-overtime-rate').value,
                late_rate: document.getElementById('set-late-rate').value
            };

            const res = await api.post(payload);

            if (res.success) {
                alert("Pengaturan Berhasil Disimpan! \nSekarang kalkulasi Payroll akan menggunakan tarif terbaru ini.");
                // Update data lokal
                this.data = { ...this.data, ...payload };
            } else {
                alert("Gagal menyimpan: " + res.error);
            }
        } catch (e) {
            console.error(e);
            alert("Terjadi kesalahan saat menghubungi server.");
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }
};

window.settings = settings;
