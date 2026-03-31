const adminReports = {
    attendanceData: [],
    filters: { employee: '', type: '' },

    async init() {
        await this.loadData();
        this.bindEvents();
    },

    async loadData() {
        const tbody = document.getElementById('attendance-reports-body');
        if (tbody) tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; padding:20px;"><i class="fas fa-sync fa-spin"></i> Loading Data...</td></tr>';

        try {
            const res = await api.post({ action: 'getAllAttendanceData' });
            if (res.success && res.data) {
                this.attendanceData = res.data;
                console.table(this.attendanceData); // <--- CEK DATA DI CONSOLE F12
                this.populateEmployeeFilter();
                this.renderTable();
            }
        } catch (e) { console.error(e); }
    },

    bindEvents() {
        const nameFilter = document.getElementById('report-employee-filter');
        if (nameFilter) nameFilter.onchange = (e) => { this.filters.employee = e.target.value; this.renderTable(); };
        const typeFilter = document.getElementById('report-type-filter');
        if (typeFilter) typeFilter.onchange = (e) => { this.filters.type = e.target.value; this.renderTable(); };
    },

    populateEmployeeFilter() {
        const select = document.getElementById('report-employee-filter');
        if (!select) return;
        const names = [...new Set(this.attendanceData.map(r => r.nama || r.userName || r.username))].filter(Boolean).sort();
        select.innerHTML = '<option value="">Semua Karyawan</option>' + names.map(n => `<option value="${n}">${n}</option>`).join('');
    },

    renderTable() {
        const tbody = document.getElementById('attendance-reports-body');
        if (!tbody) return;

        const filtered = this.attendanceData.filter(row => {
            const rowName = row.nama || row.userName || row.username || '';
            const rowTipe = String(row.tipe || row.type || '').toUpperCase();
            return (!this.filters.employee || rowName === this.filters.employee) && 
                   (!this.filters.type || rowTipe === this.filters.type);
        });

        tbody.innerHTML = filtered.map((row, index) => {
            // MAPPING DINAMIS: Mencari properti tanpa peduli spasi atau huruf besar/kecil
            const getVal = (keys) => {
                for (let key of keys) {
                    if (row[key] !== undefined && row[key] !== null) return row[key];
                }
                return '-';
            };

            const ts = getVal(['timestamp', 'waktu', 'date']);
            const d = ts !== '-' ? new Date(ts) : null;
            const tgl = (d && !isNaN(d)) ? d.toLocaleDateString('id-ID') : '-';
            const jam = (d && !isNaN(d)) ? d.toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'}) : '-';

            const nama = getVal(['nama', 'username', 'userName']);
            const tipe = String(getVal(['tipe', 'type'])).toUpperCase();
            const lokasi = getVal(['lokasi', 'location']);
            const foto = getVal(['foto', 'image', 'photo']);
            const ket = getVal(['statustelat', 'statusTelat', 'keterangan']);
            const mulai = getVal(['mulailembur', 'mulaiLembur']);
            const selesai = getVal(['selesailembur', 'selesaiLembur']);
            const total = getVal(['totaljam', 'totalJam']);

            return `
                <tr>
                    <td style="text-align:center;">${index + 1}</td>
                    <td>${tgl}<br><small>${jam}</small></td>
                    <td><strong>${nama}</strong></td>
                    <td style="text-align:center;"><span style="padding:4px 8px; border-radius:10px; font-size:10px; font-weight:bold; background:#eee;">${tipe}</span></td>
                    <td style="font-size:10px; max-width:120px; overflow:hidden;">${lokasi}</td>
                    <td style="text-align:center;">${foto !== '-' ? `<img src="${foto}" style="width:30px; border-radius:4px;">` : '-'}</td>
                    <td><small>${ket}</small></td>
                    <td style="text-align:center;">${mulai}</td>
                    <td style="text-align:center;">${selesai}</td>
                    <td style="text-align:center; background:#fffbeb; font-weight:bold;">${total}</td>
                </tr>
            `;
        }).join('');
    }
};

window.initAttendanceReports = () => adminReports.init();
window.adminReports = adminReports;
