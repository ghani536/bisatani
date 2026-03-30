const absensi = {
    // Fungsi untuk mengambil lokasi GPS
    getLocation: function() {
        return new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
                (pos) => resolve(`${pos.coords.latitude}, ${pos.coords.longitude}`),
                () => resolve("Lokasi tidak diizinkan")
            );
        });
    },

    // Fungsi utama kirim absen
    kirim: async function(tipe) {
        const userId = localStorage.getItem('userId'); // Asumsi ID disimpan saat login
        const nama = localStorage.getItem('userName');
        const lokasi = await this.getLocation();
        
        // Menampilkan loading sederhana
        alert(`Sedang memproses ${tipe}...`);

        try {
            const res = await api.post({
                action: 'saveAttendance',
                userId: userId,
                nama: nama,
                tipe: tipe,
                lokasi: lokasi,
                timestamp: new Date()
            });

            if (res.success) {
                alert(`${tipe} Berhasil dicatat!`);
                this.updateButtonStatus(tipe);
            }
        } catch (err) {
            alert("Gagal terhubung ke server.");
        }
    },

    updateButtonStatus: function(tipe) {
        if (tipe === 'MASUK') {
            document.getElementById('btn-clock-in').disabled = true;
            document.getElementById('btn-clock-out').disabled = false;
            document.getElementById('btn-start-overtime').disabled = false;
        } else if (tipe === 'MULAI_LEMBUR') {
            document.getElementById('btn-start-overtime').disabled = true;
            document.getElementById('btn-end-overtime').disabled = false;
        } else if (tipe === 'SELESAI_LEMBUR') {
            document.getElementById('btn-end-overtime').disabled = true;
        } else if (tipe === 'PULANG') {
            document.getElementById('btn-clock-out').disabled = true;
            document.getElementById('btn-start-overtime').disabled = true;
        }
    }
};

// Event Listeners untuk tombol di index.html
document.getElementById('btn-clock-in')?.addEventListener('click', () => absensi.kirim('MASUK'));
document.getElementById('btn-clock-out')?.addEventListener('click', () => absensi.kirim('PULANG'));
document.getElementById('btn-start-overtime')?.addEventListener('click', () => absensi.kirim('MULAI_LEMBUR'));
document.getElementById('btn-end-overtime')?.addEventListener('click', () => absensi.kirim('SELESAI_LEMBUR'));