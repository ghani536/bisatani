/**
 * Portal Karyawan - Absensi & Lembur PT. BISATANI
 * Handle Clock In, Clock Out, and Overtime
 */

const absensi = {
    async init() {
        this.bindEvents();
        this.updateClock();
        setInterval(() => this.updateClock(), 1000);
    },

    bindEvents() {
        // Tombol Masuk
        const btnIn = document.getElementById('btn-clock-in');
        if (btnIn) btnIn.onclick = () => this.submit('MASUK');

        // Tombol Pulang
        const btnOut = document.getElementById('btn-clock-out');
        if (btnOut) btnOut.onclick = () => this.submit('PULANG');

        // Tombol Mulai Lembur
        const btnStartOt = document.getElementById('btn-start-overtime');
        if (btnStartOt) btnStartOt.onclick = () => this.submit('MULAI_LEMBUR');

        // Tombol Selesai Lembur
        const btnEndOt = document.getElementById('btn-end-overtime');
        if (btnEndOt) btnEndOt.onclick = () => this.submit('SELESAI_LEMBUR');
    },

    updateClock() {
        const clockEl = document.getElementById('live-clock');
        if (clockEl) {
            const now = new Date();
            clockEl.textContent = now.toLocaleTimeString('id-ID', { hour12: false });
        }
    },

    async submit(tipe) {
        // 1. Ambil Data User dari Session Auth (SESUAI DENGAN auth.js ANDA)
        const session = storage.get('session');
        
        if (!session) {
            toast.error("Sesi habis, silakan login ulang");
            return;
        }

        const userId = session.id || "Unknown";
        const userName = session.name || "Unknown";

        toast.info(`Memproses ${tipe}...`);

        try {
            // 2. Ambil Lokasi (Opsional)
            let koordinat = "Lokasi Mati";
            try {
                const pos = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 4000 });
                });
                koordinat = `${pos.coords.latitude}, ${pos.coords.longitude}`;
            } catch (e) { console.warn("GPS Gagal"); }

            // 3. Kirim ke API (Google Sheets)
            const payload = {
                action: 'saveAttendance',
                userId: userId,
                userName: userName,
                tipe: tipe,
                location: koordinat,
                image: "" 
            };

            const response = await api.post(payload);

            if (response.success) {
                toast.success(`Berhasil! ${userName} tercatat ${tipe}`);
                this.updateButtonStates(tipe);
            } else {
                toast.error("Gagal: " + response.error);
            }
        } catch (error) {
            toast.error("Terjadi kesalahan koneksi");
            console.error(error);
        }
    },

    updateButtonStates(tipe) {
        // Logika sederhana untuk mengaktifkan/matikan tombol setelah klik
        if (tipe === 'MASUK') {
            document.getElementById('btn-clock-in').disabled = true;
            document.getElementById('btn-clock-out').disabled = false;
        } else if (tipe === 'PULANG') {
            document.getElementById('btn-clock-out').disabled = true;
        } else if (tipe === 'MULAI_LEMBUR') {
            document.getElementById('btn-start-overtime').disabled = true;
            document.getElementById('btn-end-overtime').disabled = false;
        } else if (tipe === 'SELESAI_LEMBUR') {
            document.getElementById('btn-end-overtime').disabled = true;
            document.getElementById('btn-start-overtime').disabled = false;
        }
    }
};

// Inisialisasi saat halaman absensi dibuka
window.initAbsensi = () => absensi.init();
