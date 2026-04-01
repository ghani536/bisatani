/**
 * Portal Karyawan - API PT. BISATANI
 */
const API_BASE_URL = 'https://script.google.com/macros/s/AKfycbzHCO1Qthua_n63tnpshuzH0jpzWz8HdJ-z4RWcSe9rJqWTZ75tc44ZsHkdiI_JAEYD/exec';

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
            return { success: false, error: 'Gagal terhubung ke Google Sheets' };
        }
    },

    async login(email, password) {
        return await this.post({ action: 'login', email: email, password: password });
    }
};

window.api = api;
