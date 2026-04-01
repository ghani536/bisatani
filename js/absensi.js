/**
 * Portal Karyawan - Absensi Engine PT. BISATANI
 * Versi Final Fix: Tombol Lembur & Hitungan Telat
 */
const absensi = {
    stream: null,
    location: null,
    locationName: "Mencari lokasi...",
    settingsCache: null,

    async init() {
        console.log("Absensi: Memulai Jalur Cepat...");
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
            { enableHighAccuracy: false, timeout: 5000 }
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

        container.innerHTML = '<div style="text-align:center; padding:10px;"><i class="fas fa-sync fa-spin"></i> Sinkron...</div>';

        try {
            // Gunakan api.get agar tidak membebani server (Pastikan api.js sudah ada fungsi get)
            const statusRes = await api.get('getAttendanceStatus', { userId: auth.user.id });
            const settingsRes = await api.get('getSettings');

            if (settingsRes.success) this.settingsCache = settingsRes.data;

            const lastType = (statusRes.success && statusRes.data) ? statusRes.data.type : null;
            const config = this.settingsCache || {};
            
            const now = new Date();
            const jamNow = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');
            
            let html = '';

            // LOGIKA TOMBOL BERDASARKAN STATUS TERAKHIR
            if (lastType === 'MASUK') {
                html = `<button onclick="absensi.submit('PULANG')" class="btn-pulang" style="background:#f43f5e; color:white; width:100%; padding:15px; border:none; border-radius:12px; font-weight:bold; cursor:pointer;"><i class="fas fa-sign-out-alt"></i> ABSEN PULANG</button>`;
            } 
            else if (lastType === 'MULAI_LEMBUR') {
                html = `<button onclick="absensi.submit('SELESAI_LEMBUR')" class="btn-selesai-lembur" style="background:#0ea5e9; color:white; width:100%; padding:15px; border:none; border-radius:12px; font-weight:bold; cursor:pointer;"><i class="fas fa-check-double"></i> SELESAI LEMBUR</button>`;
            } 
            else {
                // Default: Tombol MASUK
                html = `<button onclick="absensi.submit('MASUK')" class="btn-masuk" style="background:#10b981; color:white; width:100%; padding:15px; border:none; border-radius:12px; font-weight:bold; margin-bottom:10px; cursor:pointer;"><i class="fas fa-sign-in-alt"></i> ABSEN MASUK</button>`;
                
                // Jika sudah PULANG, cek apakah boleh MULAI LEMBUR
                if (lastType === 'PULANG' && config.jam_lembur_min) {
                    if (jamNow >= config.jam_lembur_min) {
                        html += `<button onclick="absensi.submit('MULAI_LEMBUR')" class="btn-lembur" style="background:#6366f1; color:white; width:100%; padding:15px; border:none; border-radius:12px; font-weight:bold; cursor:pointer;"><i class="fas fa-moon"></i> MULAI LEMBUR</button>`;
                    } else {
                        html += `<div style="text-align:center; padding:10px; font-size:11px; color:#64748b; background:#f8fafc; border-radius:8px; border:1px dashed #cbd5e1;"><i class="fas fa-lock"></i> Lembur aktif pukul ${config.jam_lembur_min}</div>`;
                    }
                }
            }
            container.innerHTML = html;
        } catch (e) { 
            console.error(e);
            container.innerHTML = '<button onclick="location.reload()" class="btn-masuk" style="background:#64748b; color:white; width:100%; padding:15px; border:none; border-radius:12px; font-weight:bold;">REFRESH STATUS</button>'; 
        }
    },

    async submit(type) {
        if (!this.location) return alert("Sinyal GPS belum stabil!");
        
        const btn = event.currentTarget;
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Tunggu...';

        try {
            let statusTelat = "";
            
            // Hitung Telat hanya untuk MASUK
            if (type === 'MASUK' && this.settingsCache && this.settingsCache.jam_masuk) {
                const now = new Date();
                const [h, m] = this.settingsCache.jam_masuk.split(':');
                const jadwal = new Date();
                jadwal.setHours(parseInt(h), parseInt(m), 0);
                
                if (now > jadwal) {
                    const selisih = Math.floor((now - jadwal) / 60000);
                    statusTelat = selisih + " Menit";
                } else {
                    statusTelat = "Tepat Waktu";
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

            const res = await api.post(payload);
            
            // Karena kita pakai 'no-cors' di api.post, res.success mungkin tidak terbaca.
            // Kita asumsikan berhasil jika tidak masuk ke catch error.
            alert(`Absen ${type} Berhasil!`);
            
            // Refresh total agar state aplikasi bersih dan tombol terupdate
            location.reload();

        } catch (e) {
            console.error(e);
            alert("Terjadi gangguan jaringan, silakan coba lagi.");
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    },

    captureImage() {
        const video = document.getElementById('webcam-preview');
        if (!video) return "";
        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 240;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/jpeg', 0.5);
    }
};

window.absensi = absensi;
