/**
 * Portal Karyawan - Absensi PT. BISATANI
 * Versi Tahan Banting
 */

const absensi = {
    init() {
        console.log("Absensi Initializing...");
        this.updateClock();
        this.bindEvents();
    },

    updateClock() {
        // Hapus interval lama jika ada agar tidak double
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
        // Menggunakan Event Delegation pada dokumen agar tombol selalu bisa diklik
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

    async submit(tipe) {
        // Ambil data user dari session storage
        const session = storage.get('session');
        if (!session) {
            alert("Silakan login ulang.");
            return;
        }

        // Feedback visual sederhana
        const btn = document.activeElement;
        const originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';

        try {
            // GPS (Timeout cepat 3 detik)
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
                location: koordinat
            };

            const response = await api.post(payload);

            if (response.success) {
                alert(`Absen ${tipe} Berhasil!`);
                // Refresh data/status jika ada
                if (window.router) window.router.navigate('absensi');
            } else {
                alert("Gagal simpan ke Sheets: " + response.error);
            }
        } catch (error) {
            alert("Kesalahan koneksi ke server.");
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    }
};

// Pastikan fungsi inisialisasi tersedia di window
window.initAbsensi = () => absensi.init();
