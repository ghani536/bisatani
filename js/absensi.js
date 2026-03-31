const absensi = {
    stream: null,
    currentLocationName: "Mencari lokasi...",

    async init() {
        this.updateClock();
        await this.setupCamera();
        await this.getReadableLocation();
        await this.renderButtons();
    },

    async setupCamera() {
        const video = document.getElementById('webcam-preview');
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({ video: { width: 400, height: 300 } });
            if (video) video.srcObject = this.stream;
        } catch (err) {
            console.error("Kamera Error:", err);
            if(window.toast) toast.error("Kamera tidak aktif");
        }
    },

    async getReadableLocation() {
        try {
            const pos = await new Promise((res, rej) => {
                navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 });
            });
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
            const data = await response.json();
            this.currentLocationName = data.display_name.split(',').slice(0, 3).join(',');
            const locText = document.getElementById('location-text');
            if (locText) locText.innerHTML = `<i class="fas fa-map-marker-alt"></i> ${this.currentLocationName}`;
        } catch (e) { console.warn("GPS Skip"); }
    },

    async renderButtons() {
        const btnContainer = document.getElementById('attendance-btns');
        if (!btnContainer) return;

        const session = storage.get('session');
        if (!session || !session.id) return;

        btnContainer.innerHTML = '<div style="text-align:center">Mengecek status...</div>';

        try {
            // Kita gunakan API getTodayAttendance
            const res = await api.post({ action: 'getTodayAttendance', userId: session.id });
            const logs = res.data || [];

            const hasMasuk = logs.some(l => l.tipe === 'MASUK');
            const hasPulang = logs.some(l => l.tipe === 'PULANG');
            const isLembur = logs.some(l => l.tipe === 'MULAI_LEMBUR') && !logs.some(l => l.tipe === 'SELESAI_LEMBUR');

            let html = '';
            if (!hasMasuk) {
                html = `<button class="attendance-btn clock-in-btn" onclick="absensi.submit('MASUK')">Masuk Kerja</button>`;
            } else if (hasMasuk && !hasPulang && !isLembur) {
                html = `
                    <button class="attendance-btn clock-out-btn" onclick="absensi.submit('PULANG')">Pulang Kerja</button>
                    <button class="attendance-btn" style="background:#f59e0b; margin-top:10px" onclick="absensi.submit('MULAI_LEMBUR')">Mulai Lembur</button>
                `;
            } else if (isLembur) {
                html = `<button class="attendance-btn" style="background:#d97706" onclick="absensi.submit('SELESAI_LEMBUR')">Selesai Lembur</button>`;
            } else {
                html = `<div style="text-align:center; color:green; font-weight:bold;">Absen Hari Ini Selesai!</div>`;
            }
            btnContainer.innerHTML = html;
        } catch (e) {
            btnContainer.innerHTML = '<button onclick="absensi.renderButtons()">Muat Ulang Tombol</button>';
        }
    },

    async submit(tipe) {
        const session = storage.get('session');
        const video = document.getElementById('webcam-preview');
        
        // Ambil foto
        const canvas = document.createElement('canvas');
        canvas.width = 320; canvas.height = 240;
        if (video) canvas.getContext('2d').drawImage(video, 0, 0, 320, 240);
        const photo = canvas.toDataURL('image/jpeg', 0.5);

        if(window.toast) toast.info(`Sedang mencatat ${tipe}...`);

        try {
            const payload = {
                action: 'saveAttendance',
                userId: String(session.id), // Pastikan ID dikirim sebagai string
                userName: session.name,
                tipe: tipe,
                location: this.currentLocationName,
                image: photo
            };

            const response = await api.post(payload);
            
            if (response.success) {
                alert(`Berhasil: ${tipe}`);
                // PENTING: Refresh status tombol setelah sukses
                await this.renderButtons();
            } else {
                alert("Gagal: " + (response.error || "Server tidak merespon"));
            }
        } catch (error) {
            alert("Koneksi Error: Pastikan internet stabil.");
        }
    },

    updateClock() {
        setInterval(() => {
            const el = document.getElementById('live-clock');
            if (el) el.textContent = new Date().toLocaleTimeString('id-ID');
        }, 1000);
    }
};

window.initAbsensi = () => absensi.init();
