/**
 * Portal Karyawan - API Service PT. BISATANI
 * Jembatan antara Website (Vercel) dan Google Sheets
 */

const API_BASE_URL = 'https://script.google.com/macros/s/AKfycbymcBagYkPlrTZAynzyNSHPGbU7avIecovZvPSSfREJKDtI932RBat7mDZtx0olL9L7/exec';
const api = {
    /**
     * Fungsi inti untuk memanggil Google Apps Script
     * Digunakan oleh semua file (auth.js, payroll.js, admin-employees.js, dll)
     */
    async post(data) {
        try {
            // Kita gunakan data.action jika post menerima objek tunggal
            // atau gunakan parameter action jika dikirim terpisah
            const action = data.action;
            
            const response = await fetch(API_BASE_URL, {
                method: 'POST',
                mode: 'cors', // Kita coba mode cors agar bisa membaca response JSON
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('API Error:', error);
            return { success: false, error: 'Gagal terhubung ke server Google Sheets' };
        }
    },

    // Fungsi-fungsi pembantu agar kompatibel dengan kode lama
    async login(email, password) {
        return this.post({ action: 'login', email, password });
    },

    async getEmployees() {
        return this.post({ action: 'getEmployees' });
    },

    async addEmployee(data) {
        return this.post({ action: 'addEmployee', ...data });
    },

    async deleteEmployee(id) {
        return this.post({ action: 'deleteEmployee', id });
    },

    async saveAttendance(data) {
        return this.post({ action: 'saveAttendance', ...data });
    }
};

// Global Helper untuk Avatar (agar tidak error jika data kosong)
window.getAvatarUrl = function (emp) {
    const name = (emp && emp.name) ? emp.name : 'User';
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=10B981&color=fff`;
};

// Ekspos ke global agar bisa dipanggil file lain
window.api = api;
