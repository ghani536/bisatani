/**
 * Portal Karyawan - Absensi Engine PT. BISATANI
 * Versi Turbo: Instant Camera & GPS Load
 */
const absensi = {
    stream: null,
    location: null,
    settingsCache: null, // Cache agar tidak nunggu API tiap detik

    async init() {
        console.log("Absensi: Memulai Jalur Cepat...");
        
        // 1. LANGSUNG NYALAKAN HARDWARE (Tanpa Nunggu API)
        this.startCamera();
        this.getLocation();
        
        // 2. Render tombol (ini yang agak lama karena nunggu API)
        await this.renderButtons();
    },

    async startCamera() {
        const video = document.getElementById('webcam-preview');
        if (!video) return;

        try {
            if (this.stream) {
                this.stream.getTracks().forEach(track => track.stop());
            }

            this.stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
                audio: false
            });
            video.srcObject = this.stream;
            console.log("Kamera: OK!");
        } catch (err) {
            console.error("Kamera Gagal:", err);
            alert("Mohon izinkan akses kamera agar bisa absen.");
        }
    },

    getLocation() {
        const locText = document.getElementById('location-text');
        if (!locText) return;

        if (!navigator.geolocation) {
            locText.innerHTML = '<i class="fas fa-exclamation-triangle"></i> GPS tidak didukung';
            return;
        }

        // Gunakan watchPosition agar lokasi selalu update & instan saat dibutuhkan
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                this.location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                locText.innerHTML = `<i class="fas fa-map-marker-alt"></i> Lokasi Terkunci: ${this.location.lat.toFixed(4)}, ${this.location.lng.toFixed(4)}`;
                console.log("GPS: OK!");
            },
            (err) => {
                locText.innerHTML = '<i class="fas fa-times-circle"></i> GPS Error / Off';
            },
            { enableHighAccuracy: true, timeout: 5000 }
        );
    },

    async renderButtons() {
        const container = document.getElementById('attendance-btns');
        if (!container) return;

        // Tampilkan loading sebentar di area tombol saja
        container.innerHTML = '<div style="text-align:center; padding:10px;"><i class="fas fa-circle-notch fa-spin"></i> Memuat Tombol...</div>';

        try {
            // Ambil Status & Settings (Gunakan cache jika ada untuk speed)
            const [statusRes, settingsRes] = await Promise.all([
                api.post({ action: 'getAttendanceStatus', userId: auth.user.id }),
                this.settingsCache ? Promise.resolve({success: true, data: this.settingsCache}) : api.post({ action: 'getSettings' })
            ]);

            if (settingsRes.success) this.settingsCache = settingsRes.data;

            const lastType = statusRes.data ? statusRes.data.type : null;
            const config = this.settingsCache || {};
            
            const now = new Date();
            const jamNow = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');
            
            let html = '';

            // LOGIKA TOMBOL (Sama seperti sebelumnya tapi render lebih bersih)
            if (!lastType || lastType === 'PULANG' || lastType === 'SELESAI_LEMBUR') {
                html += `<button onclick="absensi.submit('MASUK')" class="btn-masuk" style="background:#10b981; color:white; width:100%; padding:15px; border:none; border-radius:12px; font-weight:bold; margin-bottom:10px; cursor:pointer;"><i class="fas fa-sign-in-alt"></i> ABSEN MASUK</button>`;
                
                if (lastType === 'PULANG' && config.jam_lembur_min) {
                    if (jamNow >= config.jam_lembur_min) {
                        html += `<button onclick="absensi.submit('MULAI_LEMBUR')" class="btn-lembur" style="background:#6366f1; color:white; width:100%; padding:15px; border:none; border-radius:12px; font-weight:bold; cursor:pointer;"><i class="fas fa-moon"></i> MULAI LEMBUR</button>`;
                    } else {
                        html += `<div style="text-align:center; padding:10px; background:#f8fafc; border:1px dashed #cbd5e1; border-radius:8px; color:#64748b; font-size:11px;">
                            <i class="fas fa-lock"></i> Tombol Lembur aktif pukul ${config.jam_lembur_min}
                        </div>`;
                    }
                }
            } else if (lastType === 'MASUK') {
                html += `<button onclick="absensi.submit('PULANG')" class="btn-pulang" style="background:#f43f5e; color:white; width:100%; padding:15px; border:none; border-radius:12px; font-weight:bold; cursor:pointer;"><i class="fas fa-sign-out-alt"></i> ABSEN PULANG</button>`;
            } else if (lastType === 'MULAI_LEMBUR') {
                html += `<button onclick="absensi.submit('SELESAI_LEMBUR')" class="btn-selesai-lembur" style="background:#0ea5e9; color:white; width:100%; padding:15px; border:none; border-radius:12px; font-weight:bold; cursor:pointer;"><i class="fas fa-check-double"></i> SELESAI LEMBUR</button>`;
            }

            container.innerHTML = html;
        } catch (e) {
            container.innerHTML = '<p style="color:red; font-size:12px;">Gagal sinkronisasi data.</p>';
        }
    }
};

window.absensi = absensi;
