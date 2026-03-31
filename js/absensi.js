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

        btnContainer.innerHTML = '<div style="text-align:center"><i class="fas fa-sync fa-spin"></i> Cek Status...</div>';

        try {
            const currentId = session.id || session.userId;
            const res = await api.post({ 
                action: 'getAttendanceStatus', 
                userId: String(currentId)
            });
            
            const logs = res.logs || [];
            const jamSetting = res.jamMulaiLembur || "17:00";

            // Cek Waktu Sekarang vs Waktu di Setting
            const sekarang = new Date();
            const [jamSet, menitSet] = jamSetting.split(':').map(Number);
            const waktuBatasLembur = new Date();
            waktuBatasLembur.setHours(jamSet, menitSet, 0);

            const sudahBolehLembur = sekarang >= waktuBatasLembur;

            const hasMasuk = logs.some(l => l.tipe === 'MASUK');
            const hasPulang = logs.some(l => l.tipe === 'PULANG');
            const isLembur = logs.some(l => l.tipe === 'MULAI_LEMBUR') && !logs.some(l => l.tipe === 'SELESAI_LEMBUR');

            let html = '';
            
            if (!hasMasuk) {
                html = `<button class="attendance-btn clock-in-btn" onclick="absensi.submit('MASUK')">MASUK KERJA</button>`;
            } 
            else if (isLembur) {
                html = `<button class="attendance-btn" style="background:#d97706; color:white" onclick="absensi.submit('SELESAI_LEMBUR')">SELESAI LEMBUR</button>`;
            }
            else if (hasMasuk && !hasPulang) {
                // Tombol Pulang Utama
                html = `<button class="attendance-btn clock-out-btn" onclick="absensi.submit('PULANG')">PULANG KERJA</button>`;
                
                // Jika sudah melewati jam setting, munculkan tombol lembur
                if (sudahBolehLembur) {
                    html += `
                        <div style="margin-top:20px; padding:10px; border:1px dashed #f59e0b; border-radius:10px;">
                            <p style="font-size:0.75rem; color:#b45309; margin-bottom:8px;">* Sudah masuk waktu lembur</p>
                            <button class="attendance-btn" style="background:#f59e0b; color:white;" onclick="absensi.submit('MULAI_LEMBUR')">MULAI LEMBUR</button>
                        </div>
                    `;
                }
            } 
            else {
                html = `<div class="status-success">Absensi Selesai</div>`;
            }
            
            btnContainer.innerHTML = html;
        } catch (e) {
            btnContainer.innerHTML = `<button onclick="absensi.renderButtons()">Muat Ulang</button>`;
        }
    },
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
