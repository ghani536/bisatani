/**
 * Portal Karyawan - Admin Reports PT. BISATANI
 * Fix: Case-Insensitive Mapping untuk Google Sheets
 */

const adminReports = {
    attendanceData: [],
    filters: { employee: '', type: '' },

    async init() {
        console.log("Memulai Laporan Admin...");
        await this.loadData();
        this.bindEvents();
    },

    async loadData() {
        const tbody = document.getElementById('attendance-reports-body');
        if (tbody) tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; padding:20px;"><i class="fas fa-sync fa-spin"></i> Menghubungkan ke server...</td></tr>';

        try {
            // Memanggil aksi yang sudah kita daftarkan di Code.gs
            const res = await api.post({ action: 'getAllAttendanceData' });
            
            if (res.success) {
                this.attendanceData = res.data || [];
                console.log("Data diterima:", this.attendanceData); // Cek di console F12
                this.populateEmployeeFilter();
                this.renderTable();
            } else {
                if (tbody) tbody.innerHTML = `<tr><td colspan="10" style="color:red; text-align:center;">Error: ${res.error}</td></tr>`;
            }
        } catch (error) {
            if (tbody) tbody.innerHTML = '<tr><td colspan="10" style="color:red; text-align:center;">Gagal memuat data. Periksa koneksi internet.</td></tr>';
        }
    },

    bindEvents() {
        const nameFilter = document.getElementById('report-employee-filter');
        if (nameFilter) nameFilter.onchange = (e) => { this.filters.employee = e.target.value; this.renderTable(); };

        const typeFilter = document.getElementById('report-type-filter');
        if (typeFilter) typeFilter.onchange = (e) => { this.filters.type = e.target.value; this.renderTable(); };

        const exportBtn = document.getElementById('btn-export-attendance');
        if (exportBtn) exportBtn.onclick = () => this.exportCSV();
    },

    populateEmployeeFilter() {
        const select = document.getElementById('report-employee-filter');
        if (!select || !this.attendanceData.length) return;
        
        // Cek properti nama (bisa 'nama', 'username', atau 'userName')
        const names = [...new Set(this.attendanceData.map(row => row.nama || row.userName || row.username))].filter(Boolean).sort();
        select.innerHTML = '<option value="">Semua Karyawan</option>' + names.map(n => `<option value="${n}">${n}</option>`).join('');
    },

    renderTable() {
        const tbody = document.getElementById('attendance-reports-body');
        if (!tbody) return;

        const filteredData = this.attendanceData.filter(row => {
            const rowName = row.nama || row.userName || row.username || '';
            const rowTipe = String(row.tipe || row.type || '').toUpperCase();
            const matchName = !this.filters.employee || rowName === this.filters.employee;
            const matchType = !this.filters.type || rowTipe === this.filters.type;
            return matchName && matchType;
        });

        if (filteredData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; padding:20px;">Data tidak ditemukan.</td></tr>';
            return;
        }

        tbody.innerHTML = filteredData.map((row, index) => {
            // 1. Ambil Waktu (Cek properti 'timestamp' atau 'waktu')
            const ts = row.timestamp || row.waktu || row.date;
            const d = ts ? new Date(ts) : null;
            const tgl = (d && !isNaN(d)) ? d.toLocaleDateString('id-ID') : '-';
            const jam = (d && !isNaN(d)) ? d.toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'}) : '-';
            
            // 2. Ambil Data Dasar (Mapping Variabel agar tidak Undefined)
            const nama = row.nama || row.userName || row.username || '-';
            const tipe = String(row.tipe || row.type || '-').toUpperCase();
            const lokasi = row.lokasi || row.location || '-';
            const foto = row.foto || row.image || row.photo || '';
            const ket = row.keterangan || row.status || row.info || '-';
            
            // 3. Ambil Data Lembur (PENTING: Cek huruf kecil semua)
            const mulai = row.mulailembur || row.mulaiLembur || '-';
            const selesai = row.selesailembur || row.selesaiLembur || '-';
            const total = row.totaljam || row.totalJam || '-';

            // 4. Tentukan Warna Badge
            let style = "background: #e2e8f0; color: #475569;";
            if (tipe === 'MASUK') style = "background: #dcfce7; color: #166534;";
            if (tipe === 'PULANG') style = "background: #fee2e2; color: #991b1b;";
            if (tipe.includes('LEMBUR')) style = "background: #fef3c7; color: #92400e;";

            return `
                <tr>
                    <td style="text-align:center;">${index + 1}</td>
                    <td>${tgl}<br><small style="color:#64748b">${jam}</small></td>
                    <td><strong>${nama}</strong></td>
                    <td><span style="${style} padding: 4px 10px; border-radius: 20px; font-size: 0.65rem; font-weight: 600;">${tipe}</span></td>
                    <td style="font-size: 0.7rem; color: #475569; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${lokasi}">${lokasi}</td>
                    <td style="text-align:center;">
                        ${foto ? `<img src="${foto}" style="width:35px; height:35px; border-radius:6px; object-fit:cover; cursor:pointer;" onclick="adminReports.viewPhoto('${foto}')">` : '-'}
                    </td>
                    <td><small>${ket}</small></td>
                    <td style="color: #b45309; font-weight: 600; text-align:center;">${mulai}</td>
                    <td style="color: #b45309; font-weight: 600; text-align:center;">${selesai}</td>
                    <td style="background: #fffbeb; color: #b45309; font-weight: bold; text-align:center; border-left: 1px solid #fef3c7;">${total}</td>
                </tr>
            `;
        }).join('');
    },

    viewPhoto(url) {
        if (typeof modal !== 'undefined') {
            modal.show('Bukti Absensi', `<div style="text-align:center"><img src="${url}" style="max-width:100%; border-radius:12px;"></div>`, 
            [{ label: 'Tutup', class: 'btn-secondary', onClick: () => modal.close() }]);
        } else { window.open(url, '_blank'); }
    },

    exportCSV() {
        if (!this.attendanceData.length) return alert("Data tidak tersedia");
        const headers = ["No", "Waktu", "Nama", "Tipe", "Lokasi", "Keterangan", "Mulai Lembur", "Selesai Lembur", "Total Jam"];
        const rows = this.attendanceData.map((r, i) => [
            i + 1,
            `"${r.timestamp || r.waktu}"`,
            `"${r.nama || r.userName}"`,
            `"${r.tipe || r.type}"`,
            `"${r.lokasi || r.location}"`,
            `"${r.keterangan || r.status}"`,
            `"${r.mulailembur || r.mulaiLembur}"`,
            `"${r.selesailembur || r.selesaiLembur}"`,
            `"${r.totaljam || r.totalJam}"`
        ]);
        const csvContent = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'Laporan_PT_Bisatani.csv'; a.click();
    }
};

window.initAttendanceReports = () => adminReports.init();
window.adminReports = adminReports;
