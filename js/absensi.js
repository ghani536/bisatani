/**
 * Portal Karyawan - Absensi High Performance PT. BISATANI
 * Fokus: Kecepatan munculnya tombol dan kemudahan penggunaan di HP
 */

const absensi = {
    stream: null,
    locationName: "Lokasi tidak terdeteksi",

    async init() {
        this.updateClock();
        
        // 1. TAMPILKAN TOMBOL SECEPAT MUNGKIN (Tanpa nunggu kamera/GPS)
        this.renderButtons();

        // 2. JALANKAN KAMERA & GPS DI BACKGROUND (Paralel)
        this.setupCamera();
        this.getReadableLocation();
    },

    async setupCamera() {
        const video = document.getElementById('webcam-preview');
        if (!video) return;
        try {
            // Gunakan resolusi kecil agar load ringan di HP
            this.stream = await navigator.mediaDevices.getUserMedia({ 
                video: { width: { ideal: 320 }, height: { ideal: 240 }, facingMode: "user" } 
            });
            video.srcObject = this.stream;
        } catch (err) {
            console.warn("Kamera Skip:", err);
        }
    },

    async getReadableLocation() {
        const locText = document.getElementById('location-text');
        try {
            const pos = await new Promise((res, rej) => {
                navigator.geolocation.getCurrentPosition(res, rej, { timeout: 4000 });
            });
            // Reverse geocoding di background
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`)
                .then(r => r.json())
                .then(data => {
                    this.locationName = data.display_name.split(',').slice(0, 3).join(',');
                    if (locText) locText.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${this.locationName}`;
                }).catch(() => {});
        } catch (e) {
            if (locText) locText.innerHTML = `<i class="fas fa-exclamation-triangle"></i> GPS tidak aktif`;
        }
    },

    async renderButtons() {
        const btnContainer = document.getElementById('attendance-btns');
        const session = storage.get('session');
        if (!btnContainer || !session) return;

        try {
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
                html = `
                    <button class="attendance-btn clock-out-btn" onclick="absensi.submit('PULANG')">PULANG KERJA</button>
                    <button class="attendance-btn" style="background:#f59e0b; color:white; margin-top:10px" onclick="absensi.submit('MULAI_LEMBUR')">MULAI LEMBUR</button>
                `;
            } else if (isLembur) {
                html = `<button class="attendance-btn" style="background:#d97706; color:white" onclick="absensi.submit('SELESAI_LEMBUR')">SELESAI LEMBUR</button>`;
            } else {
                html = `<div style="text-align:center; padding:15px; background:#f0fdf4; color:#166534; border-radius:10px;">
                            <i class="fas fa-check-circle"></i> Selesai untuk hari ini
                        </div>`;
            }
            btnContainer.innerHTML = html;
        } catch (e) {
            btnContainer.innerHTML = `<button class="attendance-btn" onclick="absensi.renderButtons()">Gagal Memuat. Klik untuk Coba Lagi</button>`;
        }
    },

    async submit(tipe) {
        const session = storage.get('session');
        const video = document.getElementById('webcam-preview');
        
        // Ambil foto instan dari preview yang sudah jalan
        let photo = "";
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 320; canvas.height = 240;
            canvas.getContext('2d').drawImage(video, 0, 0, 320, 240);
            photo = canvas.toDataURL('image/jpeg', 0.5);
        } catch (e) {}

        const btn = document.activeElement;
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mencatat...';

        try {
            const response = await api.post({
                action: 'saveAttendance',
                userId: String(session.id),
                userName: session.name,
                tipe: tipe,
                location: this.locationName,
                image: photo
            });

            if (response.success) {
                alert(`Absen ${tipe} Berhasil!`);
                await this.renderButtons(); // Langsung ganti tombol tanpa reload halaman
            } else {
                alert("Error: " + response.error);
            }
        } catch (error) {
            alert("Koneksi bermasalah.");
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    },

    updateClock() {
        setInterval(() => {
            const el = document.getElementById('live-clock');
            if (el) el.textContent = new Date().toLocaleTimeString('id-ID');
        }, 1000);
    }
};

window.initAbsensi = () => absensi.init();
