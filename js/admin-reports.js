/**
 * Portal Karyawan - Admin Reports PT. BISATANI
 * Versi Final: Fix Mapping Kolom 10 Kolom
 */
const adminReports = {
    attendanceData: [],
    filters: { employee: '', type: '' },

    async init() {
        await this.loadData();
        this.bindEvents();
    },

    async loadData() {
        const tbody = document.getElementById('attendance-reports-body');
        if (tbody) tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:20px;">Menghubungkan ke database PT. BISATANI...</td></tr>';
        
        try {
            const res = await api.post({ action: 'getAllAttendanceData' });
            if (res.success) {
                this.attendanceData = res.data || [];
                this.populateEmployeeFilter();
                this.renderTable();
            }
        } catch (e) { console.error("Gagal load data admin:", e); }
    },

    bindEvents() {
        document.getElementById('report-employee-filter').onchange = (e) => { this.filters.employee = e.target.value; this.renderTable(); };
        document.getElementById('report-type-filter').onchange = (e) => { this.filters.type = e.target.value; this.renderTable(); };
        document.getElementById('btn-export-attendance').onclick = () => this.exportCSV();
    },

    populateEmployeeFilter() {
        const select = document.getElementById('report-employee-filter');
        const names = [...new Set(this.attendanceData.map(r => r.nama))].filter(Boolean).sort();
        select.innerHTML = '<option value="">Semua Karyawan</option>' + names.map(n => `<option value="${n}">${n}</option>`).join('');
    },

  renderTable() {
        const tbody = document.getElementById('attendance-reports-body');
        if (!tbody) return;

        const filtered = this.attendanceData.filter(row => {
            const rowName = row.nama || '-';
            const rowTipe = String(row.tipe || '').toUpperCase();
            return (!this.filters.employee || rowName === this.filters.employee) && 
                   (!this.filters.type || rowTipe === this.filters.type);
        });

        // Fungsi Helper untuk membersihkan format jam 1899
        const formatJam = (val) => {
            if (!val || val === '-') return '-';
            const str = String(val);
            // Jika formatnya ISO (ada huruf T), ambil jam:menit saja
            if (str.includes('T')) {
                const jamPart = str.split('T')[1]; // Ambil setelah T (05:40:48...)
                return jamPart.substring(0, 5);    // Ambil 5 karakter awal (05:40)
            }
            return str; // Jika sudah format biasa, biarkan
        };

        tbody.innerHTML = filtered.map((row, index) => {
            const d = row.timestamp ? new Date(row.timestamp) : null;
            const tgl = d ? d.toLocaleDateString('id-ID') : '-';
            const jamAbsen = d ? d.toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'}) : '-';
            
            const nama = row.nama || '-';
            const tipe = String(row.tipe || '-').toUpperCase();
            const lokasi = row.lokasi || '-';
            const foto = row.foto || '';
            const telat = row.statustelat || '-';
            
            // --- BERSIHKAN JAM DI SINI ---
            const mulai = formatJam(row.mulailembur);
            const selesai = formatJam(row.selesailembur);
            const total = row.totaljam || '-';

            let badgeStyle = "background: #eee; color: #444;";
            if (tipe === 'MASUK') badgeStyle = "background: #dcfce7; color: #166534;";
            if (tipe === 'PULANG') badgeStyle = "background: #fee2e2; color: #991b1b;";
            if (tipe.includes('LEMBUR')) badgeStyle = "background: #fef3c7; color: #92400e;";

            return `
                <tr>
                    <td style="text-align:center;">${index + 1}</td>
                    <td>${tgl}<br><small>${jamAbsen}</small></td>
                    <td><strong>${nama}</strong></td>
                    <td><span style="${badgeStyle} padding: 4px 8px; border-radius: 12px; font-size: 10px; font-weight: bold;">${tipe}</span></td>
                    <td style="font-size: 10px; max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${lokasi}</td>
                    <td style="text-align:center;">
                        ${foto ? `<img src="${foto}" style="width:30px;height:30px;object-fit:cover;border-radius:4px;cursor:pointer;" onclick="adminReports.viewPhoto('${foto}')">` : '-'}
                    </td>
                    <td><small>${telat}</small></td>
                    <td style="text-align:center; color: #b45309; font-weight: bold;">${mulai}</td>
                    <td style="text-align:center; color: #b45309; font-weight: bold;">${selesai}</td>
                    <td style="text-align:center; background:#fffbeb; font-weight:bold; color: #b45309;">${total}</td>
                </tr>`;
        }).join('');
    },

    viewPhoto(url) {
        modal.show('Bukti Foto', `<img src="${url}" style="width:100%; border-radius:8px;">`, [{label:'Tutup', onClick:()=>modal.close()}]);
    },

    exportCSV() {
        if (!this.attendanceData.length) return alert("Data kosong");
        const headers = ["No", "Tanggal", "Nama", "Tipe", "Lokasi", "Telat", "Mulai", "Selesai", "Total"];
        const rows = this.attendanceData.map((r, i) => [i + 1, r.timestamp, r.nama, r.tipe, r.lokasi, r.statustelat, r.mulailembur, r.selesailembur, r.totaljam]);
        const csv = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'Rekap_Absensi_Bisatani.csv'; a.click();
    }
};
window.initAttendanceReports = () => adminReports.init();
window.adminReports = adminReports;
