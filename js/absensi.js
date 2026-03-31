/**
 * Portal Karyawan - Absensi PT. BISATANI
 * Versi Final: Fix Jam 1899, Logic Urutan Ketat, & Disabled Button
 */

const absensi = {
    stream: null,
    locationName: "Lokasi tidak terdeteksi",

    async init() {
        console.log("Absensi Initializing...");
        this.updateClock();
        
        // 1. Tampilkan tombol & status terbaru
        await this.renderButtons();

        // 2. Aktifkan fitur pendukung di background
        this.setupCamera();
        this.getReadableLocation();
    },

    async setupCamera() {
        const video = document.getElementById('webcam-preview');
        if (!video) return;
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ 
                video: { width: 320, height: 240, facingMode: "user" } 
            });
            video.srcObject = this.stream;
        } catch (err) {
            console.warn("Kamera tidak tersedia:", err);
        }
    },

    async getReadableLocation() {
        const locText = document.getElementById('location-text');
        try {
            const pos = await new Promise((res, rej) => {
                navigator.geolocation.getCurrentPosition(res, rej, { timeout: 4000 });
            });
            
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

        btnContainer.innerHTML = '<div style="text-align:center; padding:15px;"><i class="fas fa-sync fa-spin"></i> Sinkronisasi Data...</div>';

        try {
            const currentId = session.id || session.userId;
            const res = await api.post({ 
                action: 'getAttendanceStatus', 
                userId: String(currentId),
                _ts: new Date().getTime() 
            });
            
            if (!res.success) throw new Error(res.error);

            const logs = res.logs || [];
            const jamMulaiLembur = res.jamMulaiLembur || "17:00";
            const serverTime = res.serverTime || "00:00";

            // Status Aktivitas (Case Insensitive & Trim)
            const hasMasuk = logs.some(l => String(l.tipe).toUpperCase().trim() === 'MASUK');
            const hasPulang = logs.some(l => String(l.tipe).toUpperCase().trim() === 'PULANG');
            const hasMulaiLembur = logs.some(l => String(l.tipe).toUpperCase().trim() === 'MULAI_LEMBUR');
            const isLemburAktif = hasMulaiLembur && !logs.some(l => String(l.tipe).toUpperCase().trim() === 'SELESAI_LEMBUR');
            const hasSelesaiLembur = logs.some(l => String(l.tipe).toUpperCase().trim() === 'SELESAI_LEMBUR');

            // Logika Perbandingan Waktu (Menit Total)
            const [hServer, mServer] = serverTime.split(':').map(Number);
            const [hLimit, mLimit] = jamMulaiLembur.split(':').map(Number);
            
            const totalMenitSekarang = (hServer * 60) + mServer;
            const totalMenitLimit = (hLimit * 60) + mLimit;
            const sudahWaktunyaLembur = totalMenitSekarang >= totalMenitLimit;

            let html = '';

            // --- ALUR TOMBOL PT. BISATANI ---
            
            if (!hasMasuk) {
                // Tahap 1: Belum Absen Masuk
                html = `<button class="attendance-btn clock-in-btn" onclick="absensi.submit('MASUK')">MASUK KERJA</button>`;
            } 
            else if (hasMasuk && !hasPulang) {
                // Tahap 2: Sudah Masuk, Muncul Tombol Pulang
                html = `<button class="attendance-btn clock-out-btn" onclick="absensi.submit('PULANG')">PULANG KERJA</button>`;
            }
            else if (hasPulang && !hasMulaiLembur) {
                // Tahap 3: Sudah Pulang, Cek Tombol Lembur
                if (sudahWaktunyaLembur) {
                    html = `
                        <div style="text-align:center; margin-bottom:12px; color:#b45309; font-weight:bold;">
                            <i class="fas fa-clock"></i> Waktu Lembur Dimulai
                        </div>
                        <button class="attendance-btn" style="background:#f59e0b; color:white;" onclick="absensi.submit('MULAI_LEMBUR')">MULAI LEMBUR</button>
                    `;
                } else {
                    html = `
                        <div style="text-align:center; padding:15px; border:1px solid #ddd; border-radius:12px; background:#f9fafb;">
                            <p style="font-size:0.85rem; color:#6b7280; margin-bottom:10px;">
                                <i class="fas fa-lock"></i> Tombol lembur aktif jam <b>${jamMulaiLembur}</b>
                            </p>
                            <button class="attendance-btn" style="background:#d1d5db; color:#9ca3af; cursor:not-allowed;" disabled>MULAI LEMBUR</button>
                        </div>
                    `;
                }
            }
            else if (hasMulaiLembur && !hasSelesaiLembur) {
                // Tahap 4: Sedang Lembur
                html = `<button class="attendance-btn" style="background:#d97706; color:white" onclick="absensi.submit('SELESAI_LEMBUR')">SELESAI LEMBUR</button>`;
            }
            else {
                // Tahap 5: Selesai Total
                html = `
                    <div style="text-align:center; padding:25px; background:#f0fdf4; color:#166534; border-radius:15px; border:1px solid #bbf7d0;">
                        <i class="fas fa-check-circle" style="font-size:2.5rem; margin-bottom:12px;"></i>
                        <p style="font-weight:bold; font-size:1.1rem; margin-bottom:5px;">Selesai untuk hari ini</p>
                        <p style="font-size:0.9rem; opacity:0.8;">Selamat beristirahat.</p>
                    </div>
                `;
            }

            btnContainer.innerHTML = html;
        } catch (e) {
            console.error("Render Error:", e);
            btnContainer.innerHTML = `<button class="attendance-btn" onclick="absensi.renderButtons()">Gagal Sinkron. Klik untuk Coba Lagi</button>`;
        }
    },

    async submit(tipe) {
        const session = storage.get('session');
        const currentId = session.id || session.userId;

        if (!currentId || currentId === "Unknown") {
            alert("Sesi berakhir. Silakan LOGOUT dan LOGIN kembali.");
            return;
        }

        const video = document.getElementById('webcam-preview');
        let photo = "";
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 320; canvas.height = 240;
            canvas.getContext('2d').drawImage(video, 0, 0, 320, 240);
            photo = canvas.toDataURL('image/jpeg', 0.5);
        } catch (e) { console.warn("Gagal ambil foto"); }

        const btn = document.activeElement;
        if (btn && btn.tagName === "BUTTON") {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mencatat...';
        }

        try {
            const response = await api.post({
                action: 'saveAttendance',
                userId: String(currentId),
                userName: session.name,
                tipe: tipe,
                location: this.locationName,
                image: photo
            });

            if (response.success) {
                alert(`Absen ${tipe} Berhasil!`);
                // Delay sebentar agar data di Sheets stabil sebelum refresh tombol
                setTimeout(() => this.renderButtons(), 1500);
            } else {
                alert("Gagal: " + response.error);
                this.renderButtons();
            }
        } catch (error) {
            alert("Koneksi bermasalah. Pastikan internet stabil.");
            this.renderButtons();
        }
    },

    updateClock() {
        setInterval(() => {
            const el = document.getElementById('live-clock');
            if (el) el.textContent = new Date().toLocaleTimeString('id-ID', { hour12: false });
        }, 1000);
    }
};

window.initAbsensi = () => absensi.init();
