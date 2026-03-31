/**
 * Portal Karyawan - Admin Reports PT. BISATANI
 * Versi Final: Fix Mapping Spasi & Case Sensitive
 */

const adminReports = {
    attendanceData: [],
    filters: { employee: '', type: '' },

    async init() {
        console.log("Menghubungkan ke Laporan PT. Bisatani...");
        await this.loadData();
        this.bindEvents();
    },

    async loadData() {
        const tbody = document.getElementById('attendance-reports-body');
        if (tbody) tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; padding:20px;"><i class="fas fa-sync fa-spin"></i> Sinkronisasi Data...</td></tr>';

        try {
            const res = await api.post({ action: 'getAllAttendanceData' });
            
            if (res.success) {
                this.attendanceData = res.data || [];
                this.populateEmployeeFilter();
                this.renderTable();
            } else {
                if (tbody) tbody.innerHTML = `<tr><td colspan="10" style="color:red; text-align:center;">Error: ${res.error}</td></tr>`;
            }
        } catch (error) {
            if (tbody) tbody.innerHTML = '<tr><td colspan="10" style="color:red; text-align:center;">Gagal memuat data. Periksa New Deployment.</td></tr>';
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
        
        // Sesuai kolom "Nama" (huruf kecil jadi 'nama')
        const names = [...new Set(this.attendanceData.map(row => row.nama))].filter(Boolean).sort();
        select.innerHTML = '<option value="">Semua Karyawan</option>' + names.map(n => `<option value="${n}">${n}</option>`).join('');
    },

    renderTable() {
        const tbody = document.getElementById('attendance-reports-body');
        if (!tbody) return;

        const filteredData = this.attendanceData.filter(row => {
            const matchName = !this.filters.employee || row.nama === this.filters.employee;
            const matchType = !this.filters.type || String(row.tipe).toUpperCase() === this.filters.type;
            return matchName && matchType;
        });

        tbody.innerHTML = filteredData.map((row, index) => {
            // --- PEMETAAN KOLOM (Sesuai Spasi yang dihapus Google) ---
            
            const ts = row.timestamp; // Kolom "Timestamp"
            const d = ts ? new Date(ts) : null;
            const tgl = (d && !isNaN(d)) ? d.toLocaleDateString('id-ID') : '-';
            const jam = (d && !isNaN(d)) ? d.toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'}) : '-';
            
            const nama = row.nama || '-'; // Kolom "Nama"
            const tipe = String(row.tipe || '-').toUpperCase(); // Kolom "Tipe"
            const lokasi = row.lokasi || '-'; // Kolom "Lokasi"
            const foto = row.foto || ''; // Kolom "Foto"
            const ket = row.statustelat || row.keterangan || '-'; // Kolom "Status Telat"
            
            // Kolom dengan spasi (Google menghapus spasi & huruf kecil semua)
            const mulai = row.mulailembur || '-'; // Kolom "Mulai Lembur"
            const selesai = row.selesailembur || '-'; // Kolom "Selesai Lembur"
            const total = row.totaljam || '-'; // Kolom "Total Jam"

            let badgeStyle = "background: #e2e8f0; color: #475569;";
            if (tipe === 'MASUK') badgeStyle = "background: #dcfce7; color: #166534;";
            if (tipe === 'PULANG') badgeStyle = "background: #fee2e2; color: #991b1b;";
            if (tipe.includes('LEMBUR')) badgeStyle = "background: #fef3c7; color: #92400e;";

            return `
                <tr>
                    <td style="text-align:center;">${index + 1}</td>
                    <td>${tgl}<br><small style="color:#64748b">${jam}</small></td>
                    <td><strong>${nama}</strong></td>
                    <td><span style="${badgeStyle} padding: 4px 10px; border-radius: 20px; font-size: 0.65rem; font-weight: 600; display:inline-block;">${tipe}</span></td>
                    <td style="font-size: 0.7rem; color: #475569; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${lokasi}</td>
                    <td style="text-align:center;">
                        ${foto ? `<img src="${foto}" style="width:35px; height:35px; border-radius:6px; object-fit:cover; cursor:pointer;" onclick="adminReports.viewPhoto('${foto}')">` : '-'}
                    </td>
                    <td><small style="color: #64748b;">${ket}</small></td>
                    <td style="color: #b45309; font-weight: 600; text-align:center;">${mulai}</td>
                    <td style="color: #b45309; font-weight: 600; text-align:center;">${selesai}</td>
                    <td style="background: #fffbeb; color: #b45309; font-weight: bold; text-align:center;">${total}</td>
                </tr>
            `;
        }).join('');
    },

    viewPhoto(url) {
        if (typeof modal !== 'undefined') {
            modal.show('Bukti Foto', `<div style="text-align:center"><img src="${url}" style="max-width:100%; border-radius:12px;"></div>`, 
            [{ label: 'Tutup', class: 'btn-secondary', onClick: () => modal.close() }]);
        } else { window.open(url, '_blank'); }
    },

    exportCSV() {
        if (!this.attendanceData.length) return alert("Data tidak tersedia");
        const csv = this.attendanceData.map(r => Object.values(r).join(",")).join("\n");
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'Laporan_PT_Bisatani.csv'; a.click();
    }
};

window.initAttendanceReports = () => adminReports.init();
window.adminReports = adminReports;
