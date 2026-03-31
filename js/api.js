/**
 * Portal Karyawan - API Service PT. BISATANI
 */
const API_BASE_URL = 'https://script.google.com/macros/s/AKfycbxiYpnlQjl8rkLxw33WX0bC6a1bHbZN5SXk0Ln1tcL2EVXoDXTHNTpM5XfPIxDwm4Mt/exec';

const api = {
    async post(data) {
        try {
            const response = await fetch(API_BASE_URL, {
                method: 'POST',
                body: JSON.stringify(data)
            });
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('API Error:', error);
            return { success: false, error: 'Gagal terhubung ke server Google Sheets' };
        }
    },

    async login(email, password) {
        return await this.post({ action: 'login', email: email, password: password });
    }
};

window.api = api;
