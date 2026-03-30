/**
 * Portal Karyawan - Payroll PT. BISATANI
 * Menghitung gaji periode 26 s/d 25
 */

const payroll = {
    async calculate() {
        const month = document.getElementById('payroll-month').value;
        const year = new Date().getFullYear(); // Bisa ditambah dropdown tahun di index.html jika perlu
        const tbody = document.getElementById('payroll-table-body');
        
        if (!tbody) return;

        // Tampilan loading yang lebih manis
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center" style="padding: 20px;">
                    <i class="fas fa-spinner fa-spin"></i> Sedang menghitung gaji periode 26 s/d 25...
                </td>
            </tr>`;
        
        try {
            const res = await api.post({ 
                action: 'getPayroll', 
                month: month, 
                year: year 
            });
            
            if (res.success) {
                this.render(res.data);
            } else {
                tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">${res.error || 'Gagal menghitung data.'}</td></tr>`;
            }
        } catch (e) {
            console.error(e);
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Gagal terhubung ke server. Periksa koneksi internet.</td></tr>';
        }
    },

    // Fungsi pembantu untuk format Rupiah agar tidak error jika data kosong
    formatIDR(number) {
        return new Intl.NumberFormat('id-ID', {
            style: 'decimal',
            minimumFractionDigits: 0
        }).format(number || 0);
    },

    render(data) {
        const tbody = document.getElementById('payroll-table-body');
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center">Tidak ada data absensi untuk periode ini.</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(row => `
            <tr>
                <td>
                    <div style="font-weight:600; color:var(--text-dark)">${row.nama}</div>
                    <div style="font-size:0.75rem; color:var(--text-light)">${row.jabatan || 'Karyawan'}</div>
                </td>
                <td>Rp ${this.formatIDR(row.gajiPokok)}</td>
                <td class="text-success" style="font-weight:500">+ Rp ${this.formatIDR(row.bonusLembur)}</td>
                <td class="text-danger">
                    - Rp ${this.formatIDR(row.dendaTelat)}
                    <div style="font-size:0.7rem; color:gray">(${row.totalTelat || 0} mnt telat)</div>
                </td>
                <td class="text-danger">- Rp ${this.formatIDR(row.bpjs)}</td>
                <td style="font-weight:bold; color:#10b981; background:rgba(16, 185, 129, 0.05)">
                    Rp ${this.formatIDR(row.gajiBersih)}
                </td>
            </tr>
        `).join('');
    },

    // Tambahan fungsi jika ingin print laporan (opsional)
    printReport() {
        window.print();
    }
};

// Pastikan fungsi ini bisa dipanggil secara global
window.payroll = payroll;