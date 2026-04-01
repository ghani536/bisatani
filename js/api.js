const api = {
    BASE_URL: 'https://script.google.com/macros/s/AKfycbxOCGDeAjT10Y4ehXTFDRA8i0zyXHgzwIqnF71u6bRt0ahqNsoyryF1_g8LHndxc0pS/exec',

    async call(data) {
        try {
            // Kita pakai GET untuk ambil data, dan POST untuk simpan data
            // Tapi untuk amannya, kita buat URL parameters untuk semua action
            const params = new URLSearchParams({ action: data.action });
            if (data.action === 'login') {
                params.append('email', data.email);
                params.append('password', data.password);
            } else if (data.userId) {
                params.append('userId', data.userId);
            }

            const response = await fetch(`${this.BASE_URL}?${params.toString()}`, {
                method: data.method || 'POST',
                body: data.method === 'GET' ? null : JSON.stringify(data),
                mode: 'cors'
            });
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return { success: false, error: 'Koneksi ke server gagal' };
        }
    },

    async login(email, password) {
        return await this.call({ action: 'login', email, password, method: 'GET' });
    },

    async post(data) {
        return await this.call({ ...data, method: 'POST' });
    },

    async get(action, params = {}) {
        return await this.call({ action, ...params, method: 'GET' });
    }
};
window.api = api;
