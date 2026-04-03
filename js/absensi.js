/**
 * Portal Karyawan - Absensi Engine PT. BISATANI
 * Versi: Tombol Lembur Terkunci (Locked) Sebelum Waktunya
 */
const absensi = {
    stream: null,
    location: null,
    locationName: "Mencari lokasi...",
    settingsCache: null,

    async init() {
        this.startCamera();
        this.getLocation();
        await this.renderButtons();
    },

    async startCamera() {
        const video = document.getElementById('webcam-preview');
        if (!video) return;
        try {
            if (this.stream) this.stream.getTracks().forEach(t => t.stop());
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user", width: { ideal: 480 } },
                audio: false
            });
            video.srcObject = this.stream;
        } catch (err) { console.error("Kamera error:", err); }
    },

    getLocation() {
        const locText = document.getElementById('location-text');
        if (!locText || !navigator.geolocation) return;

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                this.location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                await this.updateLocationName(this.location.lat, this.location.lng);
                locText.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${this.locationName}`;
            },
            (err) => { locText.innerHTML = '<i class="fas fa-times-circle"></i> GPS Off'; },
            { enableHighAccuracy: false, timeout: 8000 }
        );
    },

    async updateLocationName(lat, lng) {
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const data = await res.json();
            this.locationName = data.display_name || "Lokasi Terdeteksi";
        } catch (e) { this.locationName = `${lat.toFixed(4)}, ${lng.toFixed(4)}`; }
    },

    async renderButtons() {
        const container = document.getElementById('attendance-btns');
        if (!container) return;

        container.innerHTML = '<div style="text-align:center; padding:10px;"><i class="fas fa-sync fa-spin"></i> Memeriksa status...</div>';

        try {
            const [statusRes, settingsRes] = await Promise.all([
                api.get('getAttendanceStatus', { userId: auth.user.id }),
                api.get('getSettings')
            ]);

            if (settingsRes && settingsRes.success) this.settingsCache = settingsRes.data;

            const lastType = (statusRes && statusRes.success && statusRes.data) ? statusRes.data.type : null;
            const config = this.settingsCache || {};
            
            // Ambil Waktu Sekarang (Format HH:mm)
            const now = new Date();
            const jamNow = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');
            
            let html = '';

            // --- LOGIKA TOMBOL PT. BISATANI ---
            
            if (!lastType) {
                // BELUM ABSEN MASUK
                html = `<button onclick="absensi.submit('MASUK')" class="btn-masuk" style="background:#10b981; color:white; width:100%; padding:15px; border:none; border-radius:12px; font-weight:bold; cursor:pointer;"><i class="fas fa-sign-in-alt"></i> ABSEN MASUK</button>`;
            } 
            else if (lastType === 'MASUK' || lastType === 'SELESAI_LEMBUR' || lastType === 'PULANG') {
                // JIKA STATUS MASUK, SELESAI LEMBUR, ATAU PULANG
                
                // 1. Tampilkan status Pulang jika memang sudah klik pulang
                if (lastType === 'PULANG') {
                    html += `
                        <div style="text-align:center; padding:15px; background:#dcfce7; color:#166534; border-radius:12px; font-weight:600; margin-bottom:15px; border: 1px solid #bdfdc6;">
                            <i class="fas fa-check-circle"></i> Tugas Utama Selesai (Sudah Pulang)
                        </div>
                    `;
                } else {
                    // Jika belum pulang, tampilkan tombol pulang
                    html += `
                        <button onclick="absensi.submit('PULANG')" class="btn-pulang" style="background:#f43f5e; color:white; width:100%; padding:15px; border:none; border-radius:12px; font-weight:bold; cursor:pointer; margin-bottom:10px;"><i class="fas fa-sign-out-alt"></i> ABSEN PULANG</button>
                    `;
                }

                // 2. Tombol Mulai Lembur (Logika Kunci/Lock)
                const jamMinLembur = config.jam_lembur_min || "17:00";
                const isReadyLembur = (jamNow >= jamMinLembur);

                if (isReadyLembur) {
                    // Tombol Aktif
                    html += `<button onclick="absensi.submit('MULAI_LEMBUR')" class="btn-lembur" style="background:#6366f1; color:white; width:100%; padding:15px; border:none; border-radius:12px; font-weight:bold; cursor:pointer;"><i class="fas fa-moon"></i> MULAI LEMBUR</button>`;
                } else {
                    // Tombol Terkunci (Disabled)
                    html += `
                        <button disabled class="btn-lembur-locked" style="background:#cbd5e1; color:#94a3b8; width:100%; padding:15px; border:none; border-radius:12px; font-weight:bold; cursor:not-allowed;">
                            <i class="fas fa-lock"></i> MULAI LEMBUR (Aktif jam ${jamMinLembur})
                        </button>
                    `;
                }
            } 
            else if (lastType === 'MULAI_LEMBUR') {
                // Sedang Lembur
                html = `<button onclick="absensi.submit('SELESAI_LEMBUR')" class="btn-selesai-lembur" style="background:#0ea5e9; color:white; width:100%; padding:15px; border:none; border-radius:12px; font-weight:bold; cursor:pointer;"><i class="fas fa-check-double"></i> SELESAI LEMBUR</button>`;
            }

            container.innerHTML = html;
        } catch (e) { 
            console.error("Render Error:", e);
            container.innerHTML = '<button onclick="location.reload()" class="btn-primary" style="width:100%; padding:15px; border-radius:12px;">Gagal Sinkron, Klik untuk Coba Lagi</button>'; 
        }
    },

    async submit(type) {
        if (!this.location) return alert("Tunggu GPS mendapatkan lokasi anda!");
        const btn = event.currentTarget;
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';

        try {
            let statusTelat = "-";
            if (type === 'MASUK' && this.settingsCache && this.settingsCache.jam_masuk) {
                const now = new Date();
                const [h, m] = this.settingsCache.jam_masuk.split(':');
                const jadwal = new Date();
                jadwal.setHours(parseInt(h), parseInt(m), 0);
                if (now > jadwal) {
                    const selisih = Math.floor((now - jadwal) / 60000);
                    statusTelat = selisih + " Menit";
                } else {
                    statusTelat = "0";
                }
            }

            const payload = {
                action: 'saveAttendance',
                userId: auth.user.id,
                userName: auth.user.name,
                type: type,
                location: this.locationName,
                image: this.captureImage(),
                statusTelat: statusTelat,
                lat: this.location.lat,
                lng: this.location.lng
            };

            await api.post(payload);
            alert(`✅ Absen ${type} Berhasil!`);
            location.reload(); 

        } catch (e) {
            console.error("Submit Error:", e);
            location.reload();
        }
    },

    captureImage() {
        const video = document.getElementById('webcam-preview');
        if (!video) return "";
        const canvas = document.createElement('canvas');
        canvas.width = 320; canvas.height = 240;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, 320, 240);
        return canvas.toDataURL('image/jpeg', 0.4);
    }
};

window.absensi = absensi;
