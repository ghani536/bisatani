const settings = {
    data: {},

    async init() {
        console.log("Settings: Memulai sinkronisasi...");
        await this.loadSettings();
        this.bindEvents();
    },

    async loadSettings() {
        try {
            const res = await api.get('getSettings');
            console.log("Data diterima dari server:", res);

            if (res && res.success && res.data) {
                this.data = res.data;
                this.fillForm();
            }
        } catch (e) {
            console.error("Gagal load setting:", e);
        }
    },

    fillForm() {
        // ID di HTML : Key di Spreadsheet
        const fields = {
            'set-jam-masuk': 'jam_masuk',
            'set-jam-pulang': 'jam_pulang',
            'set-jam-lembur-min': 'jam_lembur_min',
            'set-overtime-rate': 'overtime_rate',
            'set-late-rate': 'late_rate'
        };

        for (let id in fields) {
            const el = document.getElementById(id);
            const key = fields[id];
            const value = this.data[key];

            if (el) {
                // Bersihkan value jika ada (menghapus spasi atau karakter aneh)
                el.value = (value !== undefined && value !== null) ? String(value).trim() : "";
                console.log(`Berhasil mengisi ${id} dengan: ${el.value}`);
            }
        }
        
        // Khusus Checkbox
        const cbAnytime = document.getElementById('set-ot-anytime');
        if (cbAnytime) {
            cbAnytime.checked = (this.data.allow_overtime_anytime === "true" || this.data.allow_overtime_anytime === true);
        }
    },

    bindEvents() {
        const btnSave = document.getElementById('btn-save-settings');
        if (btnSave) {
            btnSave.onclick = async () => {
                await this.saveWorkTime();
            };
        }
    },

    async saveWorkTime() {
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
                late_rate: document.getElementById('set-late-rate').value,
                allow_overtime_anytime: document.getElementById('set-ot-anytime').checked
            };

            const res = await api.post(payload);
            alert("✅ Pengaturan PT. BISATANI Berhasil Disimpan!");
            await this.loadSettings(); // Tarik ulang data terbaru
        } catch (e) {
            console.error("Save Error:", e);
            alert("Terjadi gangguan koneksi.");
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalHTML;
        }
    }
};

window.settings = settings;
