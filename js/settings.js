const settings = {
    data: {},

    async init() {
        console.log("Settings: Mengambil konfigurasi...");
        await this.loadSettings();
    },

    async loadSettings() {
        try {
            const res = await api.post({ action: 'getSettings' });
            if (res.success) {
                this.data = res.data || {};
                this.fillForm();
            }
        } catch (e) { console.error("Settings Load Error:", e); }
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
            if (el && this.data[fields[id]]) el.value = this.data[fields[id]];
        }
    },

    async saveWorkTime() {
        const btn = document.querySelector('button[onclick="settings.saveWorkTime()"]');
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

            const res = await api.post(payload);
            if (res.success) {
                alert("Pengaturan Berhasil Disimpan!");
                this.data = { ...this.data, ...payload };
            }
        } catch (e) { alert("Gagal menyimpan!"); }
        finally { btn.disabled = false; btn.innerHTML = '<i class="fas fa-save"></i> SIMPAN PENGATURAN SISTEM'; }
    }
};
window.settings = settings;
