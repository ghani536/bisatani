/**
 * Portal Karyawan - API Service PT. BISATANI
 * Jembatan antara Website (Vercel) dan Google Sheets
 */

const API_BASE_URL = 'https://script.google.com/macros/s/AKfycbxiYpnlQjl8rkLxw33WX0bC6a1bHbZN5SXk0Ln1tcL2EVXoDXTHNTpM5XfPIxDwm4Mt/exec';

const api = {
    async post(data) {
        try {
            // Gunakan fetch sederhana tanpa mode:cors manual agar tidak diblokir Google
            const response = await fetch(API_BASE_URL, {
                method: 'POST',
                body: JSON.stringify(data)
            });

            // Google Apps Script akan memberikan response JSON
            const result = await response.json();
            return result;
        } catch (error) {
            console.error('API Error:', error);
            return { success: false, error: 'Gagal terhubung ke server Google Sheets' };
        }
    },

    // Fungsi-fungsi pembantu
    async login(email, password) {
        return this.post({ action: 'login', email: email, password: password });
    },

    async getEmployees() {
        return this.post({ action: 'getEmployees' });
    },

    async addEmployee(data) {
        return this.post({ action: 'addEmployee', ...data });
    },

    async deleteEmployee(id) {
        return this.post({ action: 'deleteEmployee', id: id });
    },

    async saveAttendance(data) {
        return this.post({ action: 'saveAttendance', ...data });
    },
    
    async getEmployeeProfile(userId) {
        return this.post({ action: 'getEmployeeProfile', userId: userId });
    }
};

// Global Helper untuk Avatar
window.getAvatarUrl = function (emp) {
    const name = (emp && emp.name) ? emp.name : 'User';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=10B981&color=fff`;
};

window.api = api;
