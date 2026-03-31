/**
 * Portal Karyawan - Absensi High Performance PT. BISATANI
 * Update: Fix Tombol Sinkronisasi & Cache Bypass
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

        // Beri tanda sedang memuat
        btnContainer.innerHTML = '<div style="text-align:center; padding:10px;"><i class="fas fa-sync fa-spin"></i> Mengecek status...</div>';

        try {
            // Cek status ke server dengan Cache Bypass (_ts)
            const res = await api.post({ 
                action: 'getTodayAttendance', 
                userId: String(session.id),
                _ts: new Date().getTime() 
            });
            
            const logs = res.data || [];
            // Normalisasi tipe ke Uppercase untuk pengecekan akurat
            const hasMasuk = logs.some(l => String(l.tipe).toUpperCase() === 'MASUK');
            const hasPulang = logs.some(l => String(l.tipe).toUpperCase() === 'PULANG');
            const isLembur = logs.some(l => String(l.tipe).toUpperCase() === 'MULAI_LEMBUR') && 
                             !logs.some(l => String(l.tipe).toUpperCase() === 'SELESAI_LEMBUR');

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
                html = `<div style="text-align:center; padding:15px; background:#f0fdf4; color:#166534; border-radius:10px; border:1px solid #bbf7d0;">
                            <i class="fas fa-check-circle"></i> Selesai untuk hari ini. Sampai jumpa besok!
                        </div>`;
            }
            btnContainer.innerHTML = html;
        } catch (e) {
            console.error("Render Buttons Error:", e);
            btnContainer.innerHTML = `<button class="attendance-btn" onclick="absensi.renderButtons()">Gagal Memuat. Klik untuk Coba Lagi</button>`;
        }
    },

async submit(tipe) {
    const session = storage.get('session');
    // Pastikan ID diambil dari session yang benar (id atau userId)
    const currentId = session.id || session.userId;

    if (!currentId || currentId === "Unknown") {
        alert("ID User tidak valid. Silakan LOGOUT dan LOGIN kembali.");
        return;
    }

    // ... (logika ambil foto & lokasi tetap sama) ...

    try {
        const response = await api.post({
            action: 'saveAttendance',
            userId: String(currentId), // Kirim ID asli (angka), bukan "Unknown"
            userName: session.name,
            tipe: tipe,
            location: this.locationName,
            image: photo
        });

        if (response.success) {
            alert(`Berhasil: ${tipe}`);
            // PENTING: Tunggu sebentar lalu refresh tombol
            setTimeout(() => this.renderButtons(), 1500);
        }
    } catch (e) { alert("Koneksi Error"); }
},

    updateClock() {
        setInterval(() => {
            const el = document.getElementById('live-clock');
            if (el) el.textContent = new Date().toLocaleTimeString('id-ID', { hour12: false });
        }, 1000);
    }
};

window.initAbsensi = () => absensi.init();
