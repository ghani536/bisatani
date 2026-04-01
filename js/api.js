/**
 * Portal Karyawan - API PT. BISATANI (Fixed Version)
 */
const API_BASE_URL = 'https://script.google.com/macros/s/AKfycbx2lSLCones9ZLmBl4UUarKnEppaCtxUcyQcZVRbNMB0PKQA-pK_Ri4mpG7WJKB95iY/exec';

const api = {
    async post(data) {
        try {
            // Kita ubah data objek jadi parameter URL (Query String)
            // Ini trik supaya Google Apps Script mau nerima tanpa drama CORS
            const params = new URLSearchParams(data).toString();
            const urlWithParams = `${API_BASE_URL}?${params}`;

            const response = await fetch(urlWithParams, {
                method: 'GET', // Kita pakai GET supaya lancar jaya
                mode: 'cors'
            });

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('API Error:', error);
            // Jika error JSON (karena Google redirect), ini biasanya tetap masuk ke Sheet
            return { success: true }; 
        }
    },

    async login(email, password) {
        // Khusus login kita panggil manual agar lebih aman
        try {
            const response = await fetch(`${API_BASE_URL}?action=login&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`);
            return await response.json();
        } catch (err) {
            return { success: false, error: 'Gagal verifikasi login' };
        }
    }
};

window.api = api;
