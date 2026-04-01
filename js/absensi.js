/**
 * Portal Karyawan - Absensi PT. BISATANI
 * Versi Final: Jalur Cepat Hardware & Fix Syntax Error
 */

const absensi = {
    stream: null,
    locationName: "Lokasi tidak terdeteksi",

    async init() {
        console.log("Absensi: Memulai hardware & sinkronisasi...");
        this.updateClock();
        
        // JALUR CEPAT: Nyalakan hardware tanpa menunggu (Non-blocking)
        this.setupCamera(); 
        this.getReadableLocation();

        // JALUR DATA: Sinkronisasi tombol dengan server
        await this.renderButtons();
    },

    async setupCamera() {
        const video = document.getElementById('webcam-preview');
        if (!video) return;

        // Proteksi jika kamera sudah aktif
        if (this.stream && this.stream.active) {
            video.srcObject = this.stream;
            return;
        }

        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ 
                video: { width: 320, height: 240, facingMode: "user" } 
            });
            video.srcObject = this.stream;
        } catch (err) {
            console.warn("Kamera tidak tersedia:", err);
            if(video.parentElement) video.parentElement.style.background = "#333";
        }
    },

    async getReadableLocation() {
        const locText = document.getElementById('location-text');
        
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lon = pos.coords.longitude;
                
                // Simpan koordinat cadangan segera
                this.locationName = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
                if (locText) locText.innerHTML = `<i class="fas fa-crosshairs"></i> Lokasi Terkunci`;

                // Cari nama alamat di background
                fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
                    .then(r => r.json())
                    .then(data => {
                        if(data.display_name) {
                            this.locationName = data.display_name.split(',').slice(0, 3).join(',');
                            if (locText) locText.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${this.locationName}`;
                        }
                    }).catch(() => {});
            },
            (err) => {
                if (locText) locText.innerHTML = `<i class="fas fa-exclamation-triangle"></i> GPS tidak aktif`;
                this.locationName = "Lokasi tidak terdeteksi";
            },
            { enableHighAccuracy: false, timeout: 4000 }
        );
    },

 async renderButtons() {
        const container = document.getElementById('attendance-btns');
        if (!container) return;

        try {
            // Ambil Status Terakhir & Setting Jam
            const [statusRes, settingsRes] = await Promise.all([
                api.post({ action: 'getAttendanceStatus', userId: auth.user.id }),
                api.post({ action: 'getSettings' })
            ]);

            const lastType = statusRes.success && statusRes.data ? statusRes.data.type : null;
            const config = settingsRes.success ? settingsRes.data : {};
            
            const now = new Date();
            const jamSekarang = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');
            
            let html = '';

            // LOGIKA TAMPILAN TOMBOL
            if (!lastType || lastType === 'PULANG' || lastType === 'SELESAI_LEMBUR') {
                // Tombol MASUK (Utama)
                html += `<button onclick="absensi.submit('MASUK')" class="btn-masuk" style="background:#10b981; color:white; width:100%; padding:15px; border:none; border-radius:12px; font-weight:bold; margin-bottom:10px;"><i class="fas fa-sign-in-alt"></i> ABSEN MASUK</button>`;
                
                // Tombol MULAI LEMBUR (Hanya muncul jika sudah PULANG dan sudah masuk JAM MINIMAL LEMBUR)
                if (lastType === 'PULANG' && config.jam_lembur_min) {
                    if (jamSekarang >= config.jam_lembur_min) {
                        html += `<button onclick="absensi.submit('MULAI_LEMBUR')" class="btn-lembur" style="background:#6366f1; color:white; width:100%; padding:15px; border:none; border-radius:12px; font-weight:bold;"><i class="fas fa-moon"></i> MULAI LEMBUR</button>`;
                    } else {
                        html += `<div style="text-align:center; padding:10px; background:#fff1f2; border-radius:8px; color:#e11d48; font-size:12px; font-weight:bold;">
                            <i class="fas fa-lock"></i> Tombol Lembur Muncul Jam ${config.jam_lembur_min}
                        </div>`;
                    }
                }
            } else if (lastType === 'MASUK') {
                html += `<button onclick="absensi.submit('PULANG')" class="btn-pulang" style="background:#f43f5e; color:white; width:100%; padding:15px; border:none; border-radius:12px; font-weight:bold;"><i class="fas fa-sign-out-alt"></i> ABSEN PULANG</button>`;
            } else if (lastType === 'MULAI_LEMBUR') {
                html += `<button onclick="absensi.submit('SELESAI_LEMBUR')" class="btn-selesai-lembur" style="background:#0ea5e9; color:white; width:100%; padding:15px; border:none; border-radius:12px; font-weight:bold;"><i class="fas fa-check-double"></i> SELESAI LEMBUR</button>`;
            }

            container.innerHTML = html;

        } catch (e) {
            container.innerHTML = '<p style="color:red;">Gagal memuat tombol absensi.</p>';
        }
    },

    async submit(tipe) {
        const session = storage.get('session');
        const currentId = session.id || session.userId;

        if (!currentId) {
            alert("Sesi berakhir. Silakan LOGIN kembali.");
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
                setTimeout(() => this.renderButtons(), 1000);
            } else {
                alert("Gagal: " + response.error);
                this.renderButtons();
            }
        } catch (error) {
            alert("Koneksi bermasalah.");
            this.renderButtons();
        }
    },

    updateClock() {
        if (this.clockInterval) clearInterval(this.clockInterval);
        this.clockInterval = setInterval(() => {
            const el = document.getElementById('live-clock');
            if (el) el.textContent = new Date().toLocaleTimeString('id-ID', { hour12: false });
        }, 1000);
    }
};

window.initAbsensi = () => absensi.init();
