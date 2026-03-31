const adminReports = {
    attendanceData: [],
    filters: { employee: '', startDate: '', endDate: '' },

    async init() {
        console.log("Admin Reports: Memulai...");
        this.setDefaultDateRange();
        await this.loadData();
        this.bindEvents();
    },

    setDefaultDateRange() {
        const startInput = document.getElementById('report-start-date');
        const endInput = document.getElementById('report-end-date');
        if (!startInput || !endInput) return;

        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 26);
        const end = new Date(now.getFullYear(), now.getMonth(), 25);
        
        startInput.value = start.toISOString().split('T')[0];
        endInput.value = end.toISOString().split('T')[0];
        
        this.filters.startDate = startInput.value;
        this.filters.endDate = endInput.value;
    },

    async loadData() {
        const tbody = document.getElementById('attendance-reports-body');
        if (tbody) tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;">Memuat data...</td></tr>';
        
        try {
            const res = await api.post({ action: 'getAllAttendanceData' });
            if (res && res.success) {
                this.attendanceData = res.data || [];
                this.populateEmployeeFilter();
                this.renderTable();
            }
        } catch (e) { console.error("AdminReports: Gagal muat data", e); }
    },

    bindEvents() {
        const els = {
            emp: document.getElementById('report-employee-filter'),
            start: document.getElementById('report-start-date'),
            end: document.getElementById('report-end-date'),
            exp: document.getElementById('btn-export-attendance')
        };

        if (els.emp) els.emp.onchange = (e) => { this.filters.employee = e.target.value; this.renderTable(); };
        if (els.start) els.start.onchange = (e) => { this.filters.startDate = e.target.value; this.renderTable(); };
        if (els.end) els.end.onchange = (e) => { this.filters.endDate = e.target.value; this.renderTable(); };
        if (els.exp) els.exp.onclick = () => this.exportCSV();
    },

    populateEmployeeFilter() {
        const select = document.getElementById('report-employee-filter');
        if (!select || !this.attendanceData.length) return;
        const names = [...new Set(this.attendanceData.map(r => r.nama))].filter(Boolean).sort();
        select.innerHTML = '<option value="">Semua Karyawan</option>' + names.map(n => `<option value="${n}">${n}</option>`).join('');
    },

    renderTable() {
        const tbody = document.getElementById('attendance-reports-body');
        if (!tbody) return;

        let totalLemburMenit = 0;
        const filtered = this.attendanceData.filter(row => {
            const rowDate = row.timestamp ? row.timestamp.split('T')[0] : '';
            const matchName = !this.filters.employee || row.nama === this.filters.employee;
            const matchStart = !this.filters.startDate || rowDate >= this.filters.startDate;
            const matchEnd = !this.filters.endDate || rowDate <= this.filters.endDate;
            return matchName && matchStart && matchEnd;
        });

        filtered.forEach(row => {
            if (row.totaljam && row.totaljam !== '-') {
                totalLemburMenit += parseFloat(row.totaljam) * 60;
            }
        });

        const summary = document.getElementById('overtime-summary-card');
        const sumVal = document.getElementById('total-overtime-hours');
        if (this.filters.employee && summary && sumVal) {
            summary.style.display = 'flex';
            const j = Math.floor(totalLemburMenit / 60);
            const m = Math.round(totalLemburMenit % 60);
            sumVal.innerText = `${j} Jam ${m} Menit`;
        } else if (summary) {
            summary.style.display = 'none';
        }

        const formatJam = (v) => {
            if (!v || v === '-') return '-';
            return String(v).includes('T') ? String(v).split('T')[1].substring(0, 5) : String(v);
        };

        tbody.innerHTML = filtered.map((row, index) => {
            const d = row.timestamp ? new Date(row.timestamp) : null;
            const t = String(row.tipe || '-').toUpperCase();
            return `<tr>
                <td style="text-align:center;">${index + 1}</td>
                <td>${d ? d.toLocaleDateString('id-ID') : '-'}<br><small>${d ? d.toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'}) : '-'}</small></td>
                <td><strong>${row.nama || '-'}</strong></td>
                <td><span style="padding:4px 8px; border-radius:12px; font-size:10px; background:#eee;">${t}</span></td>
                <td style="font-size:10px;">${row.lokasi || '-'}</td>
                <td style="text-align:center;">${row.foto ? `<img src="${row.foto}" style="width:30px;height:30px;object-fit:cover;border-radius:4px;" onclick="adminReports.viewPhoto('${row.foto}')">` : '-'}</td>
                <td><small>${row.statustelat || '-'}</small></td>
                <td style="text-align:center;">${formatJam(row.mulailembur)}</td>
                <td style="text-align:center;">${formatJam(row.selesailembur)}</td>
                <td style="text-align:center; background:#fffbeb; font-weight:bold;">${row.totaljam || '-'}</td>
            </tr>`;
        }).join('');
    },

    viewPhoto(url) {
        if (typeof modal !== 'undefined') modal.show('Bukti Foto', `<img src="${url}" style="width:100%">`, [{label:'Tutup', onClick:()=>modal.close()}]);
    },

    exportCSV() {
        if (!this.attendanceData.length) return alert("Data kosong");
        const headers = ["No", "Waktu", "Nama", "Tipe", "Lokasi", "Status", "Mulai", "Selesai", "Total"];
        const rows = this.attendanceData.map((r, i) => [i + 1, r.timestamp, r.nama, r.tipe, r.lokasi, r.statustelat, r.mulailembur, r.selesailembur, r.totaljam]);
        const csv = [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'Rekap_Absensi_Bisatani.csv'; a.click();
    }
};

window.adminReports = adminReports;
window.initAttendanceReports = () => adminReports.init();
