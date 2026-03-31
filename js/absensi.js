/**
 * Portal Karyawan - Absensi PT. BISATANI
 * Fitur: Log-based, GPS, & Auto Photo Capture
 */

const absensi = {
    stream: null,

    async init() {
        console.log("Absensi Initializing...");
        this.updateClock();
        this.bindEvents();
        await this.setupCamera(); // Siapkan kamera saat halaman dibuka
    },

    async setupCamera() {
        try {
            // Kita tidak perlu menampilkan video di layar jika ingin praktis,
            // cukup minta izin akses kamera di awal.
            this.stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
        } catch (err) {
            console.warn("Kamera tidak diizinkan atau tidak tersedia.");
        }
    },

    updateClock() {
        if (window.clockInterval) clearInterval(window.clockInterval);
        window.clockInterval = setInterval(() => {
            const clockEl = document.getElementById('live-clock');
            if (clockEl) {
                const now = new Date();
                clockEl.textContent = now.toLocaleTimeString('id-ID', { hour12: false });
            }
        }, 1000);
    },

    bindEvents() {
        document.onclick = (e) => {
            const btn = e.target.closest('.attendance-btn');
            if (!btn) return;

            const id = btn.id;
            if (id === 'btn-clock-in') this.submit('MASUK');
            if (id === 'btn-clock-out') this.submit('PULANG');
            if (id === 'btn-start-overtime') this.submit('MULAI_LEMBUR');
            if (id === 'btn-end-overtime') this.submit('SELESAI_LEMBUR');
        };
    },

    async takeSnapshot() {
        if (!this.stream) return "";
        try {
            const video = document.createElement('video');
            video.srcObject = this.stream;
            await video.play();

            const canvas = document.createElement('canvas');
            canvas.width = 320;
            canvas.height = 240;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            return canvas.toDataURL('image/jpeg', 0.7); // Kembalikan string Base64
        } catch (e) {
            return "";
        }
    },

    async submit(tipe) {
        // Ambil session (Pastikan Logout & Login ulang agar id tidak Unknown)
        const session = storage.get('session');
        if (!session || !session.id) {
            alert("ID User tidak ditemukan. Silakan LOGOUT lalu LOGIN kembali.");
            return;
        }

        const btn = document.activeElement;
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';

        try {
            // 1. Ambil Foto (Proses di belakang layar)
            const photoBase64 = await this.takeSnapshot();

            // 2. Ambil GPS (Timeout 3 detik)
            let koordinat = "Lokasi Mati";
            try {
                const pos = await new Promise((res, rej) => {
                    navigator.geolocation.getCurrentPosition(res, rej, { timeout: 3000 });
                });
                koordinat = `${pos.coords.latitude}, ${pos.coords.longitude}`;
            } catch (err) { console.warn("GPS Skip"); }

            const payload = {
                action: 'saveAttendance',
                userId: session.id,
                userName: session.name,
                tipe: tipe,
                location: koordinat,
                image: photoBase64 // Foto terkirim dalam format teks base64
            };

            const response = await api.post(payload);

            if (response.success) {
                alert(`Absen ${tipe} Berhasil!\nStatus: ${response.message || 'Tercatat'}`);
                if (window.router) window.router.navigate('absensi');
            } else {
                alert("Gagal: " + response.error);
            }
        } catch (error) {
            alert("Terjadi kesalahan sistem.");
            console.error(error);
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }
};

window.initAbsensi = () => absensi.init();
