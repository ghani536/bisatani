/**
 * Portal Karyawan - Admin Reports PT. BISATANI
 */
const adminReports = {
    attendanceData: [],
    filters: { employee: '', startDate: '', endDate: '' },

    async init() {
        // Set Default: Tanggal 26 s/d 25
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 26);
        const end = new Date(now.getFullYear(), now.getMonth(), 25);
        
        const startIn = document.getElementById('report-start-date');
        const endIn = document.getElementById('report-end-date');
        
        if (startIn && !startIn.value) startIn.value = start.toISOString().split('T')[0];
        if (endIn && !endIn.value) endIn.value = end.toISOString().split('T')[0];

        this.filters.startDate = startIn.value;
        this.filters.endDate = endIn.value;

        await this.loadData();
        this.bindEvents();
    },

    async loadData() {
        const tbody = document.getElementById('attendance-reports-body');
        if (tbody) tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;">Memuat data...</td></tr>';
        
        try {
            const res = await api.post({ action: 'getAllAttendanceData' });
            if (res.success) {
                this.attendanceData = res.data || [];
                this.populateEmployeeFilter();
                this.renderTable();
            }
        } catch (e) { console.error(e); }
    },

    bindEvents() {
        const ids = ['report-employee-filter', 'report-start-date', 'report-end-date'];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.onchange = () => {
                    if (id === 'report-employee-filter') this.filters.employee = el.value;
                    if (id === 'report-start-date') this.filters.startDate = el.value;
                    if (id === 'report-end-date') this.filters.endDate = el.value;
                    this.renderTable();
                };
            }
        });
    },

    populateEmployeeFilter() {
        const select = document.getElementById('report-employee-filter');
        if (!select) return;
        const names = [...new Set(this.attendanceData.map(r => r.nama))].filter(Boolean).sort();
        select.innerHTML = '<option value="">Semua Karyawan</option>' + 
                          names.map(n => `<option value="${n}">${n}</option>`).join('');
    },

    renderTable() {
        const tbody = document.getElementById('attendance-reports-body');
        if (!tbody) return;

        let totalMenit = 0;
        const filtered = this.attendanceData.filter(row => {
            const rowDate = (row.timestamp && typeof row.timestamp === 'string') ? row.timestamp.split('T')[0] : '';
            const matchName = !this.filters.employee || row.nama === this.filters.employee;
            const matchStart = !this.filters.startDate || rowDate >= this.filters.startDate;
            const matchEnd = !this.filters.endDate || rowDate <= this.filters.endDate;
            return matchName && matchStart && matchEnd;
        });

        filtered.forEach(row => {
            if (row.totaljam && row.totaljam !== '-') totalMenit += parseFloat(row.totaljam) * 60;
        });

        // Update Ringkasan
        const sumCard = document.getElementById('overtime-summary-card');
        if (this.filters.employee && sumCard) {
            sumCard.style.display = 'flex';
            document.getElementById('total-overtime-hours').innerText = `${Math.floor(totalMenit/60)} Jam ${Math.round(totalMenit%60)} Menit`;
        } else if (sumCard) {
            sumCard.style.display = 'none';
        }

        const formatJam = (v) => {
            if (!v || v === '-') return '-';
            return String(v).includes('T') ? String(v).split('T')[1].substring(0, 5) : String(v);
        };

        tbody.innerHTML = filtered.map((row, index) => {
            const d = row.timestamp ? new Date(row.timestamp) : null;
            return `<tr>
                <td style="text-align:center;">${index + 1}</td>
                <td>${d ? d.toLocaleDateString('id-ID') : '-'}<br><small>${d ? d.toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'}) : '-'}</small></td>
                <td><strong>${row.nama || '-'}</strong></td>
                <td><span style="padding:4px 8px; border-radius:12px; font-size:10px; background:#eee;">${String(row.tipe).toUpperCase()}</span></td>
                <td style="font-size:10px;">${row.lokasi || '-'}</td>
                <td style="text-align:center;">${row.foto ? `<img src="${row.foto}" style="width:30px;height:30px;object-fit:cover;border-radius:4px;" onclick="window.open('${row.foto}')">` : '-'}</td>
                <td><small>${row.statustelat || '-'}</small></td>
                <td style="text-align:center;">${formatJam(row.mulailembur)}</td>
                <td style="text-align:center;">${formatJam(row.selesailembur)}</td>
                <td style="text-align:center; background:#fffbeb; font-weight:bold;">${row.totaljam || '-'}</td>
            </tr>`;
        }).join('');
    }
};

window.adminReports = adminReports;
