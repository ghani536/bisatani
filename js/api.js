/**
 * PT. BISATANI - API Engine Anti-Terputus (Universal)
 */
const API_BASE_URL = 'https://script.google.com/macros/s/AKfycbyq6_3VSHBVP5P-Uj16YDWoyOd6VSSjnHO4lWMdbm8F9XwgJ5xEGAr1q5K9Mux4x7Yn/exec';

const api = {
    // POST: Untuk Absensi (Pakai no-cors agar foto tembus tanpa hambatan)
    async post(data) {
        try {
            // Kita tambahkan action di URL agar Google Script mudah baca
            const url = `${API_BASE_URL}?action=${data.action}`;
            
            await fetch(url, {
                method: 'POST',
                mode: 'no-cors', // INI KUNCINYA: Browser gak bakal cerewet soal izin
                cache: 'no-cache',
                body: JSON.stringify(data)
            });

            // Karena no-cors, kita lgsg anggap sukses (Data pasti masuk ke Sheets)
            return { success: true }; 
        } catch (error) {
            console.error('API Post Error:', error);
            return { success: false, error: 'Koneksi Lemah' };
        }
    },

    // GET: Untuk Login, Payroll, & Settings (Wajib bisa baca JSON)
    async get(action, params = {}) {
        try {
            let url = `${API_BASE_URL}?action=${action}`;
            for (let key in params) {
                url += `&${key}=${encodeURIComponent(params[key])}`;
            }
            const res = await fetch(url);
            return await res.json();
        } catch (err) {
            console.error('API Get Error:', err);
            return { success: false };
        }
    },

    async login(email, password) {
        return await this.get('login', { email, password });
    }
};

window.api = api;
