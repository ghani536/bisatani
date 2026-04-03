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
        let value = this.data[key];

        if (el) {
            if (el.type === 'time' && value) {
                // PAKSA POTONG: Ambil cuma HH:mm (misal "08:00:00" jadi "08:00")
                // Ini obat mujarab buat input type="time" yang mogok
                const match = String(value).match(/\d{2}:\d{2}/);
                el.value = match ? match[0] : "";
            } else {
                el.value = value || "";
            }
            console.log(`Suntik data ke ${id}:`, el.value);
        }
    }
    
    // Checkbox tetap sama
    const cbAnytime = document.getElementById('set-ot-anytime');
    if (cbAnytime) {
        cbAnytime.checked = (String(this.data.allow_overtime_anytime) === "true");
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
