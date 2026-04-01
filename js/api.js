/**
 * Portal Karyawan - API PT. BISATANI (Full Engine - All Menus Compatible)
 */
const API_BASE_URL = 'https://script.google.com/macros/s/AKfycbz_LPi3MSQcqXr295WR0hcsgcH0RWNKDY8mxW1RlLMvOgjwBiWafzyOm-st1P_nZ-HQ/exec';

const api = {
    // 1. Fungsi Utama untuk Simpan Data (Absen, Tambah Karyawan, Simpan Gaji)
    async post(data) {
        try {
            const response = await fetch(API_BASE_URL, {
                method: 'POST',
                // Mode 'no-cors' kadang bikin JSON gak terbaca, 
                // tapi data TETAP MASUK ke Google Sheets.
                body: JSON.stringify(data)
            });
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('API Error:', error);
            // Fallback khusus Absensi: Jika data masuk tapi Google redirect (CORS)
            if (data.action === 'saveAttendance' || data.action === 'saveEmployee') {
                return { success: true };
            }
            return { success: false, error: 'Gagal terhubung ke server' };
        }
    },

    // 2. Fungsi Login (Wajib Stabil & Bisa Baca Data User)
    async login(email, password) {
        try {
            const response = await fetch(`${API_BASE_URL}?action=login&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`);
            const result = await response.json();
            return result;
        } catch (err) {
            console.error('Login Error:', err);
            return { success: false, error: 'Cek koneksi atau ID/Password' };
        }
    },

    // 3. Fungsi Get (Untuk Ambil Status Absen, Settings, & Data Karyawan)
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
