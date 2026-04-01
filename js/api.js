const api = {
    BASE_URL: 'https://script.google.com/macros/s/AKfycbwwsfNreGYoQMs3S3qOTHWvnH5F2bbKMlEFcMeLdBlH8NYy5rbOI1BCMfcOE_k8mX3u/exec',

    async post(data) {
        try {
            const params = new URLSearchParams(data).toString();
            // Kita tembak pake fetch biasa tanpa nunggu balasan JSON yang bikin error CORS
            fetch(`${this.BASE_URL}?${params}`, {
                method: 'GET',
                mode: 'no-cors',
                cache: 'no-cache'
            });
            
            // Karena no-cors gak bisa baca jawaban, kita asumsikan perintah terkirim
            // Ini trik supaya tombol di UI tetep berubah
            return { success: true }; 
        } catch (error) {
            console.error('API Error:', error);
            return { success: false, error: 'Jaringan bermasalah' };
        }
    },

    async login(email, password) {
        try {
            // Login HARUS bisa baca JSON, jadi kita pake fetch normal
            const response = await fetch(`${this.BASE_URL}?action=login&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`);
            return await response.json();
        } catch (err) {
            return { success: false, error: 'Gagal login, cek koneksi internet/URL API' };
        }
    }
};

window.api = api;
