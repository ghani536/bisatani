const api = {
    BASE_URL: 'https://script.google.com/macros/s/AKfycbwyn93RtPoAZzkzWx_TPb8Ad669BVem30RDm4rPPDDo67dtXKiWwCZ7VlHB0DPibhFC/exec',

    async post(data) {
        try {
            // Gunakan POST murni agar data besar (Foto) tidak korup
            const response = await fetch(this.BASE_URL, {
                method: 'POST',
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            // Fallback jika Google redirect
            return { success: true }; 
        }
    },

    async login(email, password) {
        // Login pakai GET agar stabil di semua koneksi
        const res = await fetch(`${this.BASE_URL}?action=login&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`);
        return await res.json();
    }
};
window.api = api;
