const api = {
    // URL Web App hasil Deploy Terakhir
    BASE_URL: 'https://script.google.com/macros/s/AKfycbwwsfNreGYoQMs3S3qOTHWvnH5F2bbKMlEFcMeLdBlH8NYy5rbOI1BCMfcOE_k8mX3u/exec',

    async post(data) {
        try {
            const params = new URLSearchParams(data).toString();
            const response = await fetch(`${this.BASE_URL}?${params}`);
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return { success: false, error: 'Gagal terhubung ke server' };
        }
    },

    async login(email, password) {
        // Langsung tembak fungsi post di atas
        return await this.post({ action: 'login', email: email, password: password });
    }
};

window.api = api;
