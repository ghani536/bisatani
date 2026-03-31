/**
 * Portal Karyawan - Settings PT. BISATANI
 */
const settings = {
    async init() {
        console.log("Settings: Loading config...");
        await this.loadConfig();
    },

    async loadConfig() {
        try {
            const res = await api.post({ action: 'getConfig' });
            if (res.success && res.data) {
                const cfg = res.data;
                if(document.getElementById('set-jam-masuk')) document.getElementById('set-jam-masuk').value = cfg.jam_masuk || '08:00';
                if(document.getElementById('set-jam-pulang')) document.getElementById('set-jam-pulang').value = cfg.jam_pulang || '17:00';
                if(document.getElementById('set-overtime-rate')) document.getElementById('set-overtime-rate').value = cfg.tarif_lembur || 0;
            }
        } catch (e) { console.error(e); }
    },

    async saveWorkTime() {
        const payload = {
            action: 'saveConfig',
            jam_masuk: document.getElementById('set-jam-masuk').value,
            jam_pulang: document.getElementById('set-jam-pulang').value
        };
        const res = await api.post(payload);
        if (res.success) alert("Jam kerja diperbarui!");
    }
};
window.settings = settings;
