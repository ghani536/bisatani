/**
 * Portal Karyawan - Absensi Engine PT. BISATANI
 * Versi Turbo: Instant Camera & Nama Lokasi Otomatis
 */
const absensi = {
    stream: null,
    location: null,
    locationName: "Mencari alamat...",
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
                video: { facingMode: "user", width: { ideal: 640 } },
                audio: false
            });
            video.srcObject = this.stream;
        } catch (err) { alert("Izin kamera diperlukan!"); }
    },

    getLocation() {
        const locText = document.getElementById('location-text');
        if (!locText || !navigator.geolocation) return;

        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                this.location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                
                // JALANKAN PENERJEMAH KOORDINAT (Reverse Geocoding)
                await this.updateLocationName(this.location.lat, this.location.lng);
                
                locText.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${this.locationName}`;
                console.log("GPS Terdeteksi:", this.locationName);
            },
            (err) => { locText.innerHTML = '<i class="fas fa-times-circle"></i> Gagal ambil GPS'; },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    },

    // FUNGSI UNTUK MENGUBAH ANGKA JADI NAMA JALAN/DESA
    async updateLocationName(lat, lng) {
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const data = await res.json();
            // Ambil nama jalan/desa/kota, kalau gak ada balik ke koordinat
            this.locationName = data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        } catch (e) {
            this.locationName = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        }
    },

    async renderButtons() {
        const container = document.getElementById('attendance-btns');
        if (!container) return;

        container.innerHTML = '<div style="text-align:center; padding:10px;"><i class="fas fa-sync fa-spin"></i> Mengecek Status Terbaru...</div>';

        try {
            // Kita tambahkan Timestamp agar browser tidak mengambil data lama (Anti-Cache)
            const statusRes = await api.post({ 
                action: 'getAttendanceStatus', 
                userId: auth.user.id,
                _t: Date.now() 
            });
            
            const settingsRes = await api.post({ action: 'getSettings' });

            // LOGGING: Cek di Console (F12) status apa yang diterima dari server
            console.log("Status Terakhir User:", statusRes.data);

            const lastType = (statusRes.success && statusRes.data) ? statusRes.data.type : null;
            const config = settingsRes.success ? settingsRes.data : {};
            
            const now = new Date();
            const jamNow = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');
            
            let html = '';

            // --- LOGIKA PENENTUAN TOMBOL (Urutan Sangat Penting) ---
            
            if (lastType === 'MASUK') {
                // Jika sudah masuk, HANYA boleh PULANG
                html = `<button onclick="absensi.submit('PULANG')" class="btn-pulang" style="background:#f43f5e; color:white; width:100%; padding:15px; border:none; border-radius:12px; font-weight:bold; cursor:pointer;"><i class="fas fa-sign-out-alt"></i> ABSEN PULANG</button>`;
            } 
            else if (lastType === 'MULAI_LEMBUR') {
                // Jika sedang lembur, HANYA boleh SELESAI LEMBUR
                html = `<button onclick="absensi.submit('SELESAI_LEMBUR')" class="btn-selesai-lembur" style="background:#0ea5e9; color:white; width:100%; padding:15px; border:none; border-radius:12px; font-weight:bold; cursor:pointer;"><i class="fas fa-check-double"></i> SELESAI LEMBUR</button>`;
            }
            else {
                // Jika statusnya NULL, PULANG, atau SELESAI_LEMBUR -> Tampilkan tombol MASUK
                html = `<button onclick="absensi.submit('MASUK')" class="btn-masuk" style="background:#10b981; color:white; width:100%; padding:15px; border:none; border-radius:12px; font-weight:bold; margin-bottom:10px; cursor:pointer;"><i class="fas fa-sign-in-alt"></i> ABSEN MASUK</button>`;
                
                // Jika status terakhir adalah PULANG, cek apakah boleh muncul tombol LEMBUR?
                if (lastType === 'PULANG' && config.jam_lembur_min) {
                    if (jamNow >= config.jam_lembur_min) {
                        html += `<button onclick="absensi.submit('MULAI_LEMBUR')" class="btn-lembur" style="background:#6366f1; color:white; width:100%; padding:15px; border:none; border-radius:12px; font-weight:bold; cursor:pointer;"><i class="fas fa-moon"></i> MULAI LEMBUR</button>`;
                    } else {
                        html += `<div style="text-align:center; padding:10px; background:#f8fafc; border:1px dashed #cbd5e1; border-radius:8px; color:#64748b; font-size:11px;">
                            <i class="fas fa-lock"></i> Tombol Lembur aktif pukul ${config.jam_lembur_min}
                        </div>`;
                    }
                }
            }

            container.innerHTML = html;

        } catch (e) {
            console.error("Gagal Render Tombol:", e);
            container.innerHTML = '<p style="color:red; font-size:12px;">Koneksi terputus. Silakan refresh.</p>';
        }
    },

async submit(type) {
        if (!this.location) return alert("Tunggu GPS mengunci lokasi!");
        
        const btn = event.currentTarget;
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';

        try {
            // Hitung Status Telat jika absen MASUK
            let statusTelat = "";
            if (type === 'MASUK' && this.settingsCache && this.settingsCache.jam_masuk) {
                const now = new Date();
                const [h, m] = this.settingsCache.jam_masuk.split(':');
                const jadwalMasuk = new Date();
                jadwalMasuk.setHours(h, m, 0);
                
                if (now > jadwalMasuk) {
                    const selisih = Math.floor((now - jadwalMasuk) / (1000 * 60));
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
                image: this.stream ? this.captureImage() : "", // Jika ada fungsi capture
                statusTelat: statusTelat, // Kolom G
                lat: this.location.lat,    // Kolom H (Mulai Lembur diisi ini kalau di Kode.gs lama)
                lng: this.location.lng     // Kolom I
            };

            const res = await api.post(payload);
            if (res.success) {
                alert(`Absen ${type} Berhasil!`);
                await this.renderButtons();
            } else { alert("Gagal: " + res.error); }
        } catch (e) { alert("Koneksi Error"); }
        finally { btn.disabled = false; btn.innerHTML = originalText; }
    },

    // Tambahkan fungsi capture kalau belum ada
    captureImage() {
        const video = document.getElementById('webcam-preview');
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        return canvas.toDataURL('image/jpeg', 0.5);
    }
};

window.absensi = absensi;
