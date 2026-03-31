/**
 * Portal Karyawan - Absensi Pintar PT. BISATANI
 */

const absensi = {
    stream: null,
    currentLocationName: "Lokasi tidak diketahui",

    async init() {
        this.updateClock();
        await this.setupCamera();
        await this.getReadableLocation();
        await this.renderButtons(); // Atur tombol berdasarkan status terakhir
    },

    async setupCamera() {
        const video = document.getElementById('webcam-preview');
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
            if (video) video.srcObject = this.stream;
        } catch (err) {
            console.error("Kamera gagal:", err);
            alert("Mohon izinkan akses kamera.");
        }
    },

    async getReadableLocation() {
        const locText = document.getElementById('location-text');
        try {
            const pos = await new Promise((res, rej) => {
                navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 });
            });
            
            // Reverse Geocoding menggunakan API gratis Nominatim (OpenStreetMap)
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
            const data = await response.json();
            
            // Ambil nama jalan atau desa/kota
            this.currentLocationName = data.display_name.split(',').slice(0, 3).join(',');
            if (locText) locText.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${this.currentLocationName}`;
        } catch (e) {
            if (locText) locText.textContent = "GPS tidak terdeteksi";
        }
    },

    async renderButtons() {
        const btnContainer = document.getElementById('attendance-btns');
        const session = storage.get('session');
        
        // Ambil riwayat absen terakhir hari ini dari API
        const res = await api.post({ action: 'getTodayAttendance', userId: session.id });
        const logs = res.data || []; // Asumsi logs adalah array aktivitas hari ini

        let html = '';
        
        // LOGIKA FILTER TOMBOL (Alur Kerja Bisatani)
        const hasMasuk = logs.some(l => l.tipe === 'MASUK');
        const hasPulang = logs.some(l => l.tipe === 'PULANG');
        const isLembur = logs.some(l => l.tipe === 'MULAI_LEMBUR') && !logs.some(l => l.tipe === 'SELESAI_LEMBUR');

        if (!hasMasuk) {
            html = `<button class="attendance-btn clock-in-btn" onclick="absensi.submit('MASUK')"><i class="fas fa-sign-in-alt"></i><span>Masuk Kerja</span></button>`;
        } else if (hasMasuk && !hasPulang && !isLembur) {
            html = `
                <button class="attendance-btn clock-out-btn" onclick="absensi.submit('PULANG')"><i class="fas fa-sign-out-alt"></i><span>Pulang Kerja</span></button>
                <button class="attendance-btn" style="background:#f59e0b" onclick="absensi.submit('MULAI_LEMBUR')"><i class="fas fa-play"></i><span>Mulai Lembur</span></button>
            `;
        } else if (isLembur) {
            html = `<button class="attendance-btn" style="background:#d97706" onclick="absensi.submit('SELESAI_LEMBUR')"><i class="fas fa-stop"></i><span>Selesai Lembur</span></button>`;
        } else if (hasPulang) {
            html = `<div class="status-info">Tugas hari ini selesai. Sampai jumpa besok!</div>`;
        }

        btnContainer.innerHTML = html;
    },

    async submit(tipe) {
        const session = storage.get('session');
        if (!session) return alert("Login ulang!");

        // Ambil Foto dari Video element
        const video = document.getElementById('webcam-preview');
        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 240;
        canvas.getContext('2d').drawImage(video, 0, 0, 320, 240);
        const photo = canvas.toDataURL('image/jpeg', 0.6);

        toast.info(`Mencatat ${tipe}...`);

        const payload = {
            action: 'saveAttendance',
            userId: session.id,
            userName: session.name,
            tipe: tipe,
            location: this.currentLocationName,
            image: photo
        };

        const response = await api.post(payload);
        if (response.success) {
            toast.success("Berhasil!");
            this.renderButtons(); // Refresh tombol
        }
    },

    updateClock() {
        setInterval(() => {
            const clockEl = document.getElementById('live-clock');
            if (clockEl) clockEl.textContent = new Date().toLocaleTimeString('id-ID');
        }, 1000);
    }
};

window.initAbsensi = () => absensi.init();
