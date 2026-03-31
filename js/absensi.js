/**
 * Portal Karyawan - Absensi PT. BISATANI
 * Perbaikan Navigasi & Logika Tombol Pintar
 */

const absensi = {
    stream: null,
    currentLocationName: "Mencari lokasi...",

    async init() {
        console.log("Absensi Initializing...");
        this.updateClock();
        await this.setupCamera();
        await this.getReadableLocation();
        await this.renderButtons(); // Cek status ke Google Sheets
    },

    async setupCamera() {
        const video = document.getElementById('webcam-preview');
        if (!video) return;
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ video: { width: 400, height: 300 } });
            video.srcObject = this.stream;
        } catch (err) {
            console.error("Kamera gagal:", err);
            toast.error("Gagal akses kamera.");
        }
    },

    async getReadableLocation() {
        const locText = document.getElementById('location-text');
        try {
            const pos = await new Promise((res, rej) => {
                navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 });
            });
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
            const data = await response.json();
            this.currentLocationName = data.display_name.split(',').slice(0, 3).join(',');
            if (locText) locText.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${this.currentLocationName}`;
        } catch (e) {
            if (locText) locText.textContent = "GPS tidak aktif";
        }
    },

    async renderButtons() {
        const btnContainer = document.getElementById('attendance-btns');
        if (!btnContainer) return;

        const session = storage.get('session');
        if (!session) return;

        btnContainer.innerHTML = '<div style="text-align:center"><i class="fas fa-spinner fa-spin"></i> Mengecek status...</div>';

        try {
            const res = await api.post({ action: 'getTodayAttendance', userId: session.id });
            const logs = res.data || [];

            const hasMasuk = logs.some(l => l.tipe === 'MASUK');
            const hasPulang = logs.some(l => l.tipe === 'PULANG');
            const isLembur = logs.some(l => l.tipe === 'MULAI_LEMBUR') && !logs.some(l => l.tipe === 'SELESAI_LEMBUR');

            let html = '';
            if (!hasMasuk) {
                html = `<button class="attendance-btn clock-in-btn" onclick="absensi.submit('MASUK')"><i class="fas fa-sign-in-alt"></i><span>Masuk Kerja</span></button>`;
            } else if (hasMasuk && !hasPulang && !isLembur) {
                html = `
                    <button class="attendance-btn clock-out-btn" onclick="absensi.submit('PULANG')"><i class="fas fa-sign-out-alt"></i><span>Pulang Kerja</span></button>
                    <button class="attendance-btn" style="background:#f59e0b; color:white; margin-top:10px" onclick="absensi.submit('MULAI_LEMBUR')"><i class="fas fa-play"></i><span>Mulai Lembur</span></button>
                `;
            } else if (isLembur) {
                html = `<button class="attendance-btn" style="background:#d97706; color:white" onclick="absensi.submit('SELESAI_LEMBUR')"><i class="fas fa-stop"></i><span>Selesai Lembur</span></button>`;
            } else {
                html = `<div style="padding:20px; background:#f0fdf4; color:#166534; border-radius:10px; text-align:center">
                            <i class="fas fa-check-circle"></i><br>Tugas hari ini selesai. Sampai jumpa besok!
                        </div>`;
            }
            btnContainer.innerHTML = html;
        } catch (e) {
            btnContainer.innerHTML = '<button class="attendance-btn" onclick="absensi.renderButtons()">Gagal memuat. Coba lagi?</button>';
        }
    },

    async submit(tipe) {
        const session = storage.get('session');
        const video = document.getElementById('webcam-preview');
        const canvas = document.createElement('canvas');
        canvas.width = 320; canvas.height = 240;
        canvas.getContext('2d').drawImage(video, 0, 0, 320, 240);
        const photo = canvas.toDataURL('image/jpeg', 0.6);

        toast.info(`Mencatat ${tipe}...`);

        const payload = {
            action: 'saveAttendance',
            userId: session.id,
            userName: session.name,
            tipe: tipe,
            location: this.currentLocationName,
            image: photo
        };

        const response = await api.post(payload);
        if (response.success) {
            toast.success("Berhasil dicatat!");
            setTimeout(() => this.renderButtons(), 1000);
        } else {
            toast.error("Gagal: " + response.error);
        }
    },

    updateClock() {
        setInterval(() => {
            const clockEl = document.getElementById('live-clock');
            if (clockEl) clockEl.textContent = new Date().toLocaleTimeString('id-ID');
        }, 1000);
    }
};

window.initAbsensi = () => absensi.init();
