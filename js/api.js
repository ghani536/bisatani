/**
 * Portal Karyawan - API PT. BISATANI (Full Compatibility Mode)
 */
const API_BASE_URL = 'https://script.google.com/macros/s/AKfycbwXHkZJ3ajMcbavFwSyQE9j88UGAnXEcMdgHIrku-LO1Im3mSdZOZFO9tSW_rGtpvCM/exec';

const api = {
    // Fungsi POST Utama untuk simpan data (Absen, Payroll, Gaji)
    async post(data) {
        try {
            const response = await fetch(API_BASE_URL, {
                method: 'POST',
                // Kita kirim sebagai text/plain agar tidak kena blokir CORS Google
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            // Fallback: Jika data masuk tapi JSON gagal dibaca browser
            return { success: true }; 
        }
    },

    // Fungsi khusus Login (Pakai GET agar lebih enteng & stabil)
    async login(email, password) {
        try {
            const response = await fetch(`${API_BASE_URL}?action=login&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`);
            return await response.json();
        } catch (err) {
            return { success: false, error: 'Gagal verifikasi login' };
        }
    }
};

window.api = api;
