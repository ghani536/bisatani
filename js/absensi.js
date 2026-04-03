/**
 * Portal Karyawan - Absensi Engine PT. BISATANI
 * Versi Final: Fix Alur Tombol & Kalkulasi Telat
 */
const absensi = {
    stream: null,
    location: null,
    locationName: "Mencari lokasi...",
    settingsCache: null,

    async init() {
        console.log("Absensi: Mengaktifkan kamera & GPS...");
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
            // Ambil status absensi terakhir dan pengaturan jam
            const [statusRes, settingsRes] = await Promise.all([
                api.get('getAttendanceStatus', { userId: auth.user.id }),
                api.get('getSettings')
            ]);

            if (settingsRes && settingsRes.success) this.settingsCache = settingsRes.data;

            const lastType = (statusRes && statusRes.success && statusRes.data) ? statusRes.data.type : null;
            const config = this.settingsCache || {};
            const now = new Date();
            const jamNow = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');
            
            let html = '';

            // --- LOGIKA NAVIGASI TOMBOL PT. BISATANI ---
            
            // 1. JIKA BELUM ABSEN SAMA SEKALI HARI INI
            if (!lastType) {
                html = `<button onclick="absensi.submit('MASUK')" class="btn-masuk" style="background:#10b981; color:white; width:100%; padding:15px; border:none; border-radius:12px; font-weight:bold; cursor:pointer;"><i class="fas fa-sign-in-alt"></i> ABSEN MASUK</button>`;
            } 
            
            // 2. JIKA SUDAH MASUK (Boleh PULANG atau MULAI LEMBUR)
            else if (lastType === 'MASUK' || lastType === 'SELESAI_LEMBUR') {
                html = `
                    <button onclick="absensi.submit('PULANG')" class="btn-pulang" style="background:#f43f5e; color:white; width:100%; padding:15px; border:none; border-radius:12px; font-weight:bold; cursor:pointer; margin-bottom:10px;"><i class="fas fa-sign-out-alt"></i> ABSEN PULANG</button>
                `;
                
                // Syarat tombol lembur muncul: sudah jam minimal lembur
                const jamMinLembur = config.jam_lembur_min || "17:00";
                if (jamNow >= jamMinLembur) {
                    html += `<button onclick="absensi.submit('MULAI_LEMBUR')" class="btn-lembur" style="background:#6366f1; color:white; width:100%; padding:15px; border:none; border-radius:12px; font-weight:bold; cursor:pointer;"><i class="fas fa-moon"></i> MULAI LEMBUR</button>`;
                } else {
                    html += `<div style="text-align:center; padding:10px; font-size:11px; color:#64748b; background:#f8fafc; border-radius:8px;"><i class="fas fa-lock"></i> Lembur aktif pukul ${jamMinLembur}</div>`;
                }
            } 
            
            // 3. JIKA SEDANG LEMBUR
            else if (lastType === 'MULAI_LEMBUR') {
                html = `<button onclick="absensi.submit('SELESAI_LEMBUR')" class="btn-selesai-lembur" style="background:#0ea5e9; color:white; width:100%; padding:15px; border:none; border-radius:12px; font-weight:bold; cursor:pointer;"><i class="fas fa-check-double"></i> SELESAI LEMBUR</button>`;
            } 
            
            // 4. JIKA SUDAH PULANG (Selesai untuk hari ini)
            else if (lastType === 'PULANG') {
                html = `
                    <div style="text-align:center; padding:20px; background:#dcfce7; color:#166534; border-radius:12px; font-weight:600;">
                        <i class="fas fa-check-circle" style="font-size:24px; margin-bottom:10px; display:block;"></i>
                        Tugas Selesai! Anda sudah absen pulang.
                    </div>
                `;
            }

            container.innerHTML = html;
        } catch (e) { 
            console.error("Render Error:", e);
            container.innerHTML = '<button onclick="location.reload()" class="btn-primary" style="width:100%; padding:15px; border-radius:12px;">Gagal Sinkron, Klik untuk Coba Lagi</button>'; 
        }
    },

    async submit(type) {
        if (!this.location) return alert("Tunggu GPS mendapatkan lokasi anda!");
        
        // Identifikasi tombol yang diklik
        const btn = event.currentTarget;
        const originalText = btn.innerHTML;
        
        // Kunci tombol agar tidak dobel klik
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';

        try {
            // Kalkulasi Telat di Sisi Client (Untuk Cadangan)
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
                statusTelat: statusTelat, // Dikirim ke kolom G
                lat: this.location.lat,
                lng: this.location.lng
            };

            // Kirim data ke API
            const res = await api.post(payload);
            
            if (res.success) {
                alert(`✅ Absen ${type} Berhasil!`);
                // Stop kamera sebelum reload
                if (this.stream) this.stream.getTracks().forEach(t => t.stop());
                location.reload(); 
            } else {
                alert("Gagal: " + (res.error || "Server sibuk"));
                btn.disabled = false;
                btn.innerHTML = originalText;
            }

        } catch (e) {
            console.error("Submit Error:", e);
            // Tetap kasih alert sukses jika post no-cors dianggap fail padahal data masuk
            alert("Proses selesai. Silakan periksa status anda.");
            location.reload();
        }
    },

    captureImage() {
        const video = document.getElementById('webcam-preview');
        if (!video) return "";
        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 240;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, 320, 240);
        // Kompresi kualitas ke 0.4 (40%) agar upload kencang
        return canvas.toDataURL('image/jpeg', 0.4);
    }
};

window.absensi = absensi;
