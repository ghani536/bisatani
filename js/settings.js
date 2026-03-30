/**
 * Portal Karyawan - Settings PT. BISATANI
 * Mengatur parameter Gaji, Info Perusahaan, dan Hari Kerja
 */

const settings = {
    async init() {
        // Cek apakah user adalah admin
        const role = localStorage.getItem('userRole');
        if (role !== 'admin') {
            alert('Anda tidak memiliki akses ke halaman ini!');
            window.location.hash = '#dashboard';
            return;
        }

        await this.loadSettings();
        this.initForms();
    },

    async loadSettings() {
        try {
            // Mengambil semua setting dari Google Sheets
            const response = await api.post({ action: 'getSettings' });
            const allSettings = response.data || {};

            // 1. Load Info Perusahaan
            const companyName = document.getElementById('company-name');
            if (companyName) companyName.value = allSettings.company_name || 'PT. BISATANI';

            // 2. Load Hari Kerja
            const workdays = allSettings.working_days ? JSON.parse(allSettings.working_days) : null;
            if (workdays) {
                const days = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu'];
                days.forEach(day => {
                    const el = document.getElementById(`day-${day}`);
                    if (el) el.checked = workdays[day] !== false;
                });
            }

            // 3. Load Parameter Gaji (Fitur Baru Bisatani)
            const otRate = document.getElementById('set-overtime-rate');
            const lateRate = document.getElementById('set-late-rate');
            const bpjsRate = document.getElementById('set-bpjs-rate');

            if (otRate) otRate.value = allSettings.overtime_rate || 15000;
            if (lateRate) lateRate.value = allSettings.late_rate || 1000;
            if (bpjsRate) bpjsRate.value = allSettings.bpjs_rate || 150000;

        } catch (error) {
            console.error('Gagal memuat pengaturan:', error);
        }
    },

    initForms() {
        // Tombol Simpan Info Perusahaan
        const companyForm = document.getElementById('company-form');
        if (companyForm) {
            companyForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const name = document.getElementById('company-name').value;
                await api.post({ action: 'saveSetting', key: 'company_name', value: name });
                alert('Nama perusahaan berhasil diupdate!');
            });
        }

        // Tombol Simpan Hari Kerja
        const saveWorkdaysBtn = document.getElementById('btn-save-workdays');
        if (saveWorkdaysBtn) {
            saveWorkdaysBtn.addEventListener('click', () => this.saveWorkdays());
        }
    },

    async saveWorkdays() {
        const days = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu', 'minggu'];
        const workdays = {};
        days.forEach(day => {
            const el = document.getElementById(`day-${day}`);
            workdays[day] = el ? el.checked : false;
        });

        try {
            await api.post({ action: 'saveSetting', key: 'working_days', value: JSON.stringify(workdays) });
            alert('Hari kerja berhasil disimpan!');
        } catch (error) {
            alert('Gagal menyimpan hari kerja');
        }
    },

    // FUNGSI UTAMA UNTUK PAYROLL BISATANI
    async savePayroll() {
        const otRate = document.getElementById('set-overtime-rate').value;
        const lateRate = document.getElementById('set-late-rate').value;
        const bpjsRate = document.getElementById('set-bpjs-rate').value;

        try {
            // Kita simpan satu per satu ke sheet Settings
            await Promise.all([
                api.post({ action: 'saveSetting', key: 'overtime_rate', value: otRate }),
                api.post({ action: 'saveSetting', key: 'late_rate', value: lateRate }),
                api.post({ action: 'saveSetting', key: 'bpjs_rate', value: bpjsRate })
            ]);
            alert('Tarif Gaji PT. Bisatani Berhasil Disimpan!');
        } catch (error) {
            alert('Gagal menyimpan tarif gaji');
        }
    }
};

// Inisialisasi saat halaman dimuat
window.settings = settings;