const settings = {
    data: {},

    async init() {
        console.log("Settings: Init...");
        await this.loadSettings();
        this.bindEvents(); // Kita pastikan event simpan terpasang
    },

    async loadSettings() {
        const tbody = document.getElementById('page-settings');
        try {
            // Gunakan GET agar sinkron dengan doGet di Apps Script
            const res = await api.get('getSettings');
            console.log("Data Settings dari Server:", res);

            if (res.success && res.data) {
                this.data = res.data;
                this.fillForm();
            }
        } catch (e) {
            console.error("Gagal load setting:", e);
        }
    },

    fillForm() {
        const fields = {
            'set-jam-masuk': 'jam_masuk',
            'set-jam-pulang': 'jam_pulang',
            'set-jam-lembur-min': 'jam_lembur_min',
            'set-overtime-rate': 'overtime_rate',
            'set-late-rate': 'late_rate'
        };

        for (let id in fields) {
            const el = document.getElementById(id);
            if (el) {
                // Ambil nilai dari object data, jika kosong beri string kosong
                const val = this.data[fields[id]] || "";
                el.value = val;
                console.log(`Mengisi ${id} dengan nilai: ${val}`);
            }
        }
    },

    bindEvents() {
        // Cari tombol simpan secara spesifik
        const btnSave = document.getElementById('btn-save-settings');
        if (btnSave) {
            btnSave.onclick = () => this.saveWorkTime();
        }
    },

    async saveWorkTime() {
        console.log("Tombol Simpan diklik...");
        const btn = document.getElementById('btn-save-settings');
        const originalHTML = btn.innerHTML;

        try {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';

            const payload = {
                action: 'savePayrollSettings',
                jam_masuk: document.getElementById('set-jam-masuk').value,
                jam_pulang: document.getElementById('set-jam-pulang').value,
                jam_lembur_min: document.getElementById('set-jam-lembur-min').value,
                overtime_rate: document.getElementById('set-overtime-rate').value,
                late_rate: document.getElementById('set-late-rate').value
            };

            console.log("Kirim Payload:", payload);
            const res = await api.post(payload);
            
            if (res.success) {
                alert("✅ Pengaturan Berhasil Disimpan!");
                await this.loadSettings(); // Refresh data
            } else {
                alert("❌ Gagal menyimpan: " + (res.error || "Server ditolak"));
            }
        } catch (e) {
            console.error("Save Error:", e);
            alert("Terjadi kesalahan koneksi.");
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalHTML;
        }
    }
};

window.settings = settings;
