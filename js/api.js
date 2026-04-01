/**
 * Portal Karyawan - API PT. BISATANI (Fixed & Stabil)
 */
const api = {
    // Pastikan URL ini tidak ada spasi di ujungnya
    BASE_URL: 'https://script.google.com/macros/s/AKfycbwwsfNreGYoQMs3S3qOTHWvnH5F2bbKMlEFcMeLdBlH8NYy5rbOI1BCMfcOE_k8mX3u/exec',

    async post(data) {
        try {
            // Gunakan URLSearchParams untuk merapikan data ke URL
            const params = new URLSearchParams(data).toString();
            const finalUrl = `${this.BASE_URL}?${params}`;

            const response = await fetch(finalUrl, {
                method: 'GET', // Pakai GET agar lolos dari blokade CORS Google
                mode: 'cors',
                cache: 'no-cache'
            });

            if (!response.ok) throw new Error('Network response was not ok');

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('API Error:', error);
            // Trik: Jika login gagal tapi menu lain jalan, biasanya masalah di response JSON
            return { success: false, error: 'Koneksi ke server terputus/ditolak' };
        }
    },

    async login(email, password) {
        // Kita panggil fungsi post di atas
        return await this.post({ 
            action: 'login', 
            email: email, 
            password: password 
        });
    }
};

window.api = api;
