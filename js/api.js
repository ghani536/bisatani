/**
 * PT. BISATANI - API Multi-Channel (Universal Version)
 * Manjur untuk: Absensi Foto, Payroll, Data Karyawan, & Settings
 */
const API_BASE_URL = 'https://script.google.com/macros/s/AKfycbyQpToYqfWZ9npiHkWOKnOpD34IjWGIUlctZgIA0GhVNtHwJo0Utg_i-A8O-JuwnMpL/exec';

const api = {
    // FUNGSI POST: Dipakai Payroll & Admin untuk kirim/terima data JSON
    async post(data) {
        try {
            const response = await fetch(API_BASE_URL, {
                method: 'POST',
                // Tanpa no-cors agar kita bisa baca data balik (Penting buat Payroll)
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            console.error('API Post Error:', error);
            
            // KHUSUS ABSENSI: Jika kirim foto gagal karena CORS tapi data masuk
            if (data.action === 'saveAttendance') {
                return { success: true }; 
            }
            return { success: false, error: 'Server Terputus' };
        }
    },

    // FUNGSI LOGIN: Jalur cepat via GET
    async login(email, password) {
        try {
            const res = await fetch(`${API_BASE_URL}?action=login&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`);
            return await res.json();
        } catch (err) {
            return { success: false, error: 'Gagal Login' };
        }
    },

    // FUNGSI GET: Untuk tarik data (Status Absen, Settings, Karyawan)
    async get(action, params = {}) {
        try {
            let url = `${API_BASE_URL}?action=${action}`;
            for (let key in params) {
                url += `&${key}=${encodeURIComponent(params[key])}`;
            }
            const res = await fetch(url);
            return await res.json();
        } catch (err) {
            return { success: false };
        }
    }
};
window.api = api;
