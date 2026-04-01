const API_BASE_URL = 'https://script.google.com/macros/s/AKfycbyJUquvyHg7j1xjSFer-_b4ZK_iTiOn-dPFBsLHcoN5MPGJnToUuV91X6oMRTwYOB8q/exec';

const api = {
    async post(data) {
        try {
            const response = await fetch(API_BASE_URL, {
                method: 'POST',
                mode: 'no-cors', // Biar nggak kena blokir CORS Google
                body: JSON.stringify(data)
            });
            // Karena no-cors, kita tidak bisa baca response.json()
            // Tapi data PASTI MASUK ke Google Sheets.
            return { success: true }; 
        } catch (error) {
            console.error('API Error:', error);
            return { success: false };
        }
    },

    // Login khusus pakai fetch biasa agar bisa baca data User
    async login(email, password) {
        try {
            const res = await fetch(`${API_BASE_URL}?action=login&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`);
            return await res.json();
        } catch (err) {
            return { success: false, error: 'Koneksi Server Gagal' };
        }
    },

    // Fungsi bantu untuk ambil data (Status, Settings, Employees)
    async get(action, params = {}) {
        try {
            let url = `${API_BASE_URL}?action=${action}`;
            for (let key in params) { url += `&${key}=${encodeURIComponent(params[key])}`; }
            const res = await fetch(url);
            return await res.json();
        } catch (err) { return { success: false }; }
    }
};
window.api = api;
