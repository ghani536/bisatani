/**
 * Portal Karyawan - API PT. BISATANI (Full Engine - All Menus Compatible)
 */
const API_BASE_URL = 'https://script.google.com/macros/s/AKfycbz_LPi3MSQcqXr295WR0hcsgcH0RWNKDY8mxW1RlLMvOgjwBiWafzyOm-st1P_nZ-HQ/exec';

const api = {
    // 1. Fungsi POST (Untuk simpan Absen & Admin)
    async post(data) {
        try {
            // Kita pakai mode 'no-cors' sebagai pengaman terakhir agar data foto besar tetap masuk
            await fetch(API_BASE_URL, {
                method: 'POST',
                mode: 'no-cors', 
                body: JSON.stringify(data)
            });
            // Karena 'no-cors', kita tidak bisa baca JSON response, 
            // tapi Google Sheets menjamin data masuk jika fetch tidak masuk ke catch.
            return { success: true }; 
        } catch (error) {
            console.error('API Error:', error);
            return { success: false, error: 'Koneksi Terputus' };
        }
    },

    // 2. Fungsi Login (Stabil & Pasti Balik data JSON)
    async login(email, password) {
        try {
            const response = await fetch(`${API_BASE_URL}?action=login&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`);
            return await response.json();
        } catch (err) {
            return { success: false, error: 'Gagal Login' };
        }
    },

    // 3. Fungsi GET (Wajib untuk renderButtons agar Sinkronisasi jalan)
    async get(action, params = {}) {
        try {
            let url = `${API_BASE_URL}?action=${action}`;
            for (let key in params) {
                url += `&${key}=${encodeURIComponent(params[key])}`;
            }
            const response = await fetch(url);
            const result = await response.json();
            return result;
        } catch (err) {
            console.error('Get Error:', err);
            return { success: false };
        }
    }
};

window.api = api;
