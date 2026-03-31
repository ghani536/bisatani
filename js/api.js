const API_BASE_URL = 'https://script.google.com/macros/s/AKfycbxiYpnlQjl8rkLxw33WX0bC6a1bHbZN5SXk0Ln1tcL2EVXoDXTHNTpM5XfPIxDwm4Mt/exec';

const api = {
    async post(data) {
        try {
            const response = await fetch(API_BASE_URL, {
                method: 'POST',
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return { success: false, error: 'Koneksi ke Google Sheets Gagal' };
        }
    },
    async login(email, password) {
        return await this.post({ action: 'login', email, password });
    }
};
window.api = api;
