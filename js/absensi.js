const absensi = {
    stream: null,
    location: "Mencari lokasi...",

    async init() {
        this.updateClock();
        // 1. Munculkan tombol SECEPAT MUNGKIN
        await this.renderButtons(); 
        // 2. Jalankan kamera & GPS di background (tidak menghalangi tombol)
        this.setupCamera();
        this.getReadableLocation();
    },

    async renderButtons() {
        const btnContainer = document.getElementById('attendance-btns');
        const session = storage.get('session');
        if (!btnContainer || !session) return;

        // Cek status ke server
        const res = await api.post({ action: 'getTodayAttendance', userId: session.id });
        const logs = res.data || [];

        const hasMasuk = logs.some(l => l.tipe === 'MASUK');
        const hasPulang = logs.some(l => l.tipe === 'PULANG');
        const isLembur = logs.some(l => l.tipe === 'MULAI_LEMBUR') && !logs.some(l => l.tipe === 'SELESAI_LEMBUR');

        let html = '';
        if (!hasMasuk) {
            html = `<button class="attendance-btn clock-in-btn" onclick="absensi.submit('MASUK')">MASUK KERJA</button>`;
        } else if (hasMasuk && !hasPulang && !isLembur) {
            html = `<button class="attendance-btn clock-out-btn" onclick="absensi.submit('PULANG')">PULANG KERJA</button>
                    <button class="attendance-btn" style="background:#f59e0b; margin-top:10px" onclick="absensi.submit('MULAI_LEMBUR')">MULAI LEMBUR</button>`;
        } else if (isLembur) {
            html = `<button class="attendance-btn" style="background:#d97706" onclick="absensi.submit('SELESAI_LEMBUR')">SELESAI LEMBUR</button>`;
        } else {
            html = `<div style="color:green; font-weight:bold; text-align:center">ANDA SUDAH PULANG</div>`;
        }
        btnContainer.innerHTML = html;
    },

    async submit(tipe) {
        // Logika submit tetap sama seperti sebelumnya...
        // Gunakan Base64 dari kamera dan lokasi yang sudah didapat di background
    }
    // ... sisa fungsi kamera & lokasi
};
window.initAbsensi = () => absensi.init();
