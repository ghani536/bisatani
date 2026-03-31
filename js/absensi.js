/**
 * Portal Karyawan - Absensi PT. BISATANI
 * Versi Final: Fix Sinkronisasi & Priority Buttons
 */
const absensi = {
    stream: null,
    locationName: "Lokasi tidak terdeteksi",

    async init() {
        this.updateClock();
        await this.renderButtons();
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
        } catch (err) { console.warn("Camera error"); }
    },

    async getReadableLocation() {
        const locText = document.getElementById('location-text');
        try {
            const pos = await new Promise((res, rej) => {
                navigator.geolocation.getCurrentPosition(res, rej, { timeout: 4000 });
            });
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
            const data = await res.json();
            this.locationName = data.display_name.split(',').slice(0, 3).join(',');
            if (locText) locText.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${this.locationName}`;
        } catch (e) { if (locText) locText.innerHTML = "GPS Mati"; }
    },

   async renderButtons() {
        const btnContainer = document.getElementById('attendance-btns');
        const session = storage.get('session');
        if (!btnContainer || !session) return;

        btnContainer.innerHTML = '<div style="text-align:center; padding:10px;"><i class="fas fa-sync fa-spin"></i> Sinkronisasi...</div>';

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

            // Status Kehadiran
            const hasMasuk = logs.some(l => String(l.tipe).toUpperCase().trim() === 'MASUK');
            const hasPulang = logs.some(l => String(l.tipe).toUpperCase().trim() === 'PULANG');
            const hasMulaiLembur = logs.some(l => String(l.tipe).toUpperCase().trim() === 'MULAI_LEMBUR');
            const hasSelesaiLembur = logs.some(l => String(l.tipe).toUpperCase().trim() === 'SELESAI_LEMBUR');

            // Logika Waktu Lembur
            const [h, m] = serverTime.split(':').map(Number);
            const [lh, lm] = jamMulaiLembur.split(':').map(Number);
            const sudahWaktunyaLembur = (h > lh) || (h === lh && m >= lm);

            let html = '';

            // --- LOGIKA URUTAN TOMBOL PT. BISATANI ---

            if (!hasMasuk) {
                // 1. HANYA TOMBOL MASUK
                html = `<button class="attendance-btn clock-in-btn" onclick="absensi.submit('MASUK')">MASUK KERJA</button>`;
            } 
            else if (hasMasuk && !hasPulang) {
                // 2. SETELAH MASUK, HANYA TOMBOL PULANG
                html = `<button class="attendance-btn clock-out-btn" onclick="absensi.submit('PULANG')">PULANG KERJA</button>`;
            }
            else if (hasPulang && !hasMulaiLembur) {
                // 3. SETELAH PULANG, MUNCUL TOMBOL LEMBUR (Cek Jam)
                if (sudahWaktunyaLembur) {
                    html = `
                        <div style="text-align:center; margin-bottom:10px; color:#b45309; font-weight:bold;">Waktu Lembur Dimulai</div>
                        <button class="attendance-btn" style="background:#f59e0b; color:white;" onclick="absensi.submit('MULAI_LEMBUR')">MULAI LEMBUR</button>
                    `;
                } else {
                    // Tombol muncul tapi tidak bisa diklik (Disabled)
                    html = `
                        <div style="text-align:center; padding:10px; border:1px solid #ddd; border-radius:10px; background:#f9fafb;">
                            <p style="font-size:0.8rem; color:#6b7280; margin-bottom:8px;">Tombol lembur aktif jam ${jamMulaiLembur}</p>
                            <button class="attendance-btn" style="background:#d1d5db; color:#9ca3af; cursor:not-allowed;" disabled>MULAI LEMBUR</button>
                        </div>
                    `;
                }
            }
            else if (hasMulaiLembur && !hasSelesaiLembur) {
                // 4. SEDANG LEMBUR, HANYA TOMBOL SELESAI LEMBUR
                html = `<button class="attendance-btn" style="background:#d97706; color:white" onclick="absensi.submit('SELESAI_LEMBUR')">SELESAI LEMBUR</button>`;
            }
            else {
                // 5. SEMUA SELESAI
                html = `
                    <div style="text-align:center; padding:20px; background:#f0fdf4; color:#166534; border-radius:12px; border:1px solid #bbf7d0;">
                        <i class="fas fa-check-circle" style="font-size:2rem; margin-bottom:10px;"></i>
                        <p style="font-weight:bold; margin-bottom:5px;">Selesai untuk hari ini</p>
                        <p style="font-size:0.9rem;">Selamat beristirahat.</p>
                    </div>
                `;
            }

            btnContainer.innerHTML = html;
        } catch (e) {
            btnContainer.innerHTML = `<button class="attendance-btn" onclick="absensi.renderButtons()">Gagal Sinkron. Coba Lagi</button>`;
        }
    },

    async submit(tipe) {
        const session = storage.get('session');
        const currentId = session.id || session.userId;
        const video = document.getElementById('webcam-preview');
        
        let photo = "";
        try {
            const canvas = document.createElement('canvas');
            canvas.width = 320; canvas.height = 240;
            canvas.getContext('2d').drawImage(video, 0, 0, 320, 240);
            photo = canvas.toDataURL('image/jpeg', 0.5);
        } catch (e) {}

        const btn = document.activeElement;
        if (btn) { btn.disabled = true; btn.innerHTML = 'Mencatat...'; }

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
                setTimeout(() => this.renderButtons(), 1500);
            } else {
                alert("Error: " + response.error);
                this.renderButtons();
            }
        } catch (error) {
            alert("Koneksi bermasalah.");
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
