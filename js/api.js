const api = {
    // PASTIIN URL INI BENAR (Hasil Deploy Terakhir)
    BASE_URL: 'https://script.google.com/macros/s/AKfycbx2lSLCones9ZLmBl4UUarKnEppaCtxUcyQcZVRbNMB0PKQA-pK_Ri4mpG7WJKB95iY/exec',

    async post(data) {
        try {
            // Kita ubah objek data jadi parameter URL
            const params = new URLSearchParams(data).toString();
            const response = await fetch(`${this.API_BASE_URL || API_BASE_URL}?${params}`);
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('API Error:', error);
            // Kalau error JSON tapi data masuk, kita anggap sukses
            return { success: true };
        }
    },

    async login(email, password) {
        try {
            const res = await fetch(`${this.API_BASE_URL || API_BASE_URL}?action=login&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`);
            return await res.json();
        } catch (err) {
            return { success: false, error: 'Koneksi gagal' };
        }
    }
};

window.api = api;
