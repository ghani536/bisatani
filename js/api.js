/**
 * PT. BISATANI - API Engine Universal (Final Version)
 */
const API_BASE_URL = 'https://script.google.com/macros/s/AKfycbyq6_3VSHBVP5P-Uj16YDWoyOd6VSSjnHO4lWMdbm8F9XwgJ5xEGAr1q5K9Mux4x7Yn/exec';

const api = {
    // POST: Untuk simpan data (Absen Foto, Settings, Tambah Karyawan)
    async post(data) {
        try {
            const response = await fetch(API_BASE_URL, {
                method: 'POST',
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            console.error('API Post Error:', error);
            // Fallback khusus absen agar HP karyawan tidak macet jika response tertahan
            if (data.action === 'saveAttendance') return { success: true };
            return { success: false, error: 'Koneksi Server Terputus' };
        }
    },

    // GET: Untuk ambil data (Login, Payroll, Status, List Karyawan)
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

    // LOGIN: Jalur cepat via GET
    async login(email, password) {
        return await this.get('login', { email, password });
    }
};

window.api = api;
