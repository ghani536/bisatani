/**
 * Portal Karyawan - Absensi High Performance PT. BISATANI
 * Update: Fix Koneksi, Fix ID Unknown, & Fast Sync
 */

const absensi = {
    stream: null,
    locationName: "Lokasi tidak terdeteksi",

    async init() {
        console.log("Absensi Initializing...");
        this.updateClock();
        
        // 1. TAMPILKAN TOMBOL SECEPAT MUNGKIN
        await this.renderButtons();

        // 2. JALANKAN KAMERA & GPS DI BACKGROUND
        this.setupCamera();
        this.getReadableLocation();
    },

    async setupCamera() {
        const video = document.getElementById('webcam-preview');
        if (!video) return;
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ 
                video: { width: { ideal: 320 }, height: { ideal: 240 }, facingMode: "user" } 
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

        btnContainer.innerHTML = '<div style="text-align:center; padding:10px;"><i class="fas fa-sync fa-spin"></i> Mengecek status...</div>';

        try {
            // Ambil data log hari ini DAN jam pulang dari settings
            const res = await api.post({ 
                action: 'getAttendanceStatus', // Kita gunakan fungsi baru yang lebih lengkap
                userId: String(session.id)
            });
            
            const logs = res.logs || [];
            const jamPulangSetting = res.jamPulang || "17:00"; // Default jam 5 sore

            const hasMasuk = logs.some(l => String(l.tipe).toUpperCase() === 'MASUK');
            const hasPulang = logs.some(l => String(l.tipe).toUpperCase() === 'PULANG');
            const isLembur = logs.some(l => String(l.tipe).toUpperCase() === 'MULAI_LEMBUR') && 
                             !logs.some(l => String(l.tipe).toUpperCase() === 'SELESAI_LEMBUR');

            // Cek apakah sekarang sudah melewati jam pulang
            const sekarang = new Date();
            const [jamP, menitP] = jamPulangSetting.split(':').map(Number);
            const waktuPulang = new Date();
            waktuPulang.setHours(jamP, menitP, 0);

            const sudahWaktunyaLembur = sekarang >= waktuPulang;

            let html = '';
            
            if (!hasMasuk) {
                html = `<button class="attendance-btn clock-in-btn" onclick="absensi.submit('MASUK')">MASUK KERJA</button>`;
            } 
            else if (isLembur) {
                html = `<button class="attendance-btn" style="background:#d97706; color:white" onclick="absensi.submit('SELESAI_LEMBUR')">SELESAI LEMBUR</button>`;
            }
            else if (hasMasuk && !hasPulang) {
                html = `<button class="attendance-btn clock-out-btn" onclick="absensi.submit('PULANG')">PULANG KERJA</button>`;
                
                // TOMBOL LEMBUR HANYA MUNCUL JIKA SUDAH JAM 17.00 (atau sesuai setting)
                if (sudahWaktunyaLembur) {
                    html += `
                        <div style="border-top: 1px solid #eee; margin: 15px 0; padding-top: 10px;">
                            <p style="font-size: 0.8rem; color: #f59e0b; font-weight:bold;">Sudah masuk waktu lembur</p>
                            <button class="attendance-btn" style="background:#f59e0b; color:white;" onclick="absensi.submit('MULAI_LEMBUR')">MULAI LEMBUR</button>
                        </div>
                    `;
                }
            } 
            else {
                html = `<div style="text-align:center; padding:15px; background:#f0fdf4; color:#166534; border-radius:10px;">Tugas Selesai</div>`;
            }
            
            btnContainer.innerHTML = html;
        } catch (e) {
            btnContainer.innerHTML = `<button class="attendance-btn" onclick="absensi.renderButtons()">Coba Lagi</button>`;
        }
    },,

    async submit(tipe) {
        const session = storage.get('session');
        const currentId = session.id || session.userId;

        if (!currentId || currentId === "Unknown") {
            alert("ID User tidak valid. Silakan LOGOUT dan LOGIN kembali.");
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
        if (btn) {
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
