const API_BASE_URL = 'https://script.google.com/macros/s/AKfycbxkuZsV7VGiaDhlgRyqKIUNTyMoz-1MfMpdjIC4vIFwWdTNxktnHwrHu_3hMMJ8Ziol/exec';

const api = {
    async post(data) {
        try {
            const response = await fetch(API_BASE_URL, {
                method: 'POST',
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            // Jika absen foto gagal dibaca browser tapi masuk ke Sheets
            if (data.action === 'saveAttendance') return { success: true };
            return { success: false, error: 'Server Terputus' };
        }
    },

    async login(email, password) {
        return await this.post({ action: 'login', email, password });
    },

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
