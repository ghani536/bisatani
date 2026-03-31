const adminReports = {
    attendanceData: [],
    filters: { 
        employee: '', 
        startDate: '',
        endDate: ''
    },

    async init() {
        this.setDefaultDateRange();
        await this.loadData();
        this.bindEvents();
    },

    setDefaultDateRange() {
        const now = new Date();
        // Setup tgl 26 bulan lalu s/d tgl 25 bulan ini
        let start = new Date(now.getFullYear(), now.getMonth() - 1, 26);
        let end = new Date(now.getFullYear(), now.getMonth(), 25);
        
        const startInput = document.getElementById('report-start-date');
        const endInput = document.getElementById('report-end-date');
        
        if (startInput) startInput.value = start.toISOString().split('T')[0];
        if (endInput) endInput.value = end.toISOString().split('T')[0];
        
        this.filters.startDate = startInput ? startInput.value : '';
        this.filters.endDate = endInput ? endInput.value : '';
    },

    async loadData() {
        const tbody = document.getElementById('attendance-reports-body');
        if (tbody) tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;">Sinkronisasi...</td></tr>';
        
        try {
            const res = await api.post({ action: 'getAllAttendanceData' });
            if (res.success) {
                this.attendanceData = res.data || [];
                this.populateEmployeeFilter();
                this.renderTable();
            }
        } catch (e) { console.error("Error loading data:", e); }
    },

    bindEvents() {
        const empF = document.getElementById('report-employee-filter');
        const startF = document.getElementById('report-start-date');
        const endF = document.getElementById('report-end-date');
        const expBtn = document.getElementById('btn-export-attendance');

        if (empF) empF.onchange = (e) => { this.filters.employee = e.target.value; this.renderTable(); };
        if (startF) startF.onchange = (e) => { this.filters.startDate = e.target.value; this.renderTable(); };
        if (endF) endF.onchange = (e) => { this.filters.endDate = e.target.value; this.renderTable(); };
        if (expBtn) expBtn.onclick = () => this.exportCSV();
    },

    populateEmployeeFilter() {
        const select = document.getElementById('report-employee-filter');
        if (!select) return;
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

        // Hitung total menit lembur
        filtered.forEach(row => {
            if (row.totaljam && row.totaljam !== '-') {
                totalLemburMenit += parseFloat(row.totaljam) * 60;
            }
        });

        // Update Ringkasan
        const summary = document.getElementById('overtime-summary-card');
        if (this.filters.employee && summary) {
            summary.style.display = 'flex';
            const jam = Math.floor(totalLemburMenit / 60);
            const mnt = Math.round(totalLemburMenit % 60);
            document.getElementById('total-overtime-hours').innerText = `${jam} Jam ${mnt} Menit`;
        } else if (summary) {
            summary.style.display = 'none';
        }

        const formatJam = (val) => {
            if (!val || val === '-') return '-';
            const str = String(val);
            return str.includes('T') ? str.split('T')[1].substring(0, 5) : str;
        };

        tbody.innerHTML = filtered.map((row, index) => {
            const d = row.timestamp ? new Date(row.timestamp) : null;
            const tgl = d ? d.toLocaleDateString('id-ID') : '-';
            const jamAbsen = d ? d.toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'}) : '-';
            
            const tipe = String(row.tipe || '-').toUpperCase();
            let style = "background: #eee; color: #444;";
            if (tipe === 'MASUK') style = "background: #dcfce7; color: #166534;";
            if (tipe === 'PULANG') style = "background: #fee2e2; color: #991b1b;";
            if (tipe.includes('LEMBUR')) style = "background: #fef3c7; color: #92400e;";

            return `
                <tr>
                    <td style="text-align:center;">${index + 1}</td>
                    <td>${tgl}<br><small>${jamAbsen}</small></td>
                    <td><strong>${row.nama || '-'}</strong></td>
                    <td><span style="${style} padding: 4px 8px; border-radius: 12px; font-size: 10px; font-weight: bold;">${tipe}</span></td>
                    <td style="font-size: 10px; max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${row.lokasi || '-'}</td>
                    <td style="text-align:center;">
                        ${row.foto ? `<img src="${row.foto}" style="width:30px;height:30px;object-fit:cover;border-radius:4px;cursor:pointer;" onclick="adminReports.viewPhoto('${row.foto}')">` : '-'}
                    </td>
                    <td><small>${row.statustelat || '-'}</small></td>
                    <td style="text-align:center; font-weight: bold;">${formatJam(row.mulailembur)}</td>
                    <td style="text-align:center; font-weight: bold;">${formatJam(row.selesailembur)}</td>
                    <td style="text-align:center; background:#fffbeb; font-weight:bold; color: #b45309;">${row.totaljam || '-'}</td>
                </tr>`;
        }).join('');
    },

    viewPhoto(url) {
        if (typeof modal !== 'undefined') {
            modal.show('Bukti Foto', `<img src="${url}" style="width:100%;
