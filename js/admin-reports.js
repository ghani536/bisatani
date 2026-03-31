const adminReports = {
    attendanceData: [],
    filters: { 
        employee: '', 
        type: '',
        startDate: '',
        endDate: ''
    },

    async init() {
        // Set default tanggal ke siklus gaji (26 bulan lalu - 25 bulan ini)
        this.setDefaultDateRange();
        await this.loadData();
        this.bindEvents();
    },

    setDefaultDateRange() {
        const now = new Date();
        let start = new Date(now.getFullYear(), now.getMonth() - 1, 26);
        let end = new Date(now.getFullYear(), now.getMonth(), 25);
        
        document.getElementById('report-start-date').value = start.toISOString().split('T')[0];
        document.getElementById('report-end-date').value = end.toISOString().split('T')[0];
        
        this.filters.startDate = document.getElementById('report-start-date').value;
        this.filters.endDate = document.getElementById('report-end-date').value;
    },

    async loadData() {
        const tbody = document.getElementById('attendance-reports-body');
        if (tbody) tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;">Memuat Data...</td></tr>';
        
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
        document.getElementById('report-employee-filter').onchange = (e) => { this.filters.employee = e.target.value; this.renderTable(); };
        document.getElementById('report-start-date').onchange = (e) => { this.filters.startDate = e.target.value; this.renderTable(); };
        document.getElementById('report-end-date').onchange = (e) => { this.filters.endDate = e.target.value; this.renderTable(); };
    },

    renderTable() {
        const tbody = document.getElementById('attendance-reports-body');
        let totalLemburMenit = 0;

        const filtered = this.attendanceData.filter(row => {
            const rowDate = row.timestamp ? row.timestamp.split('T')[0] : '';
            
            const matchName = !this.filters.employee || row.nama === this.filters.employee;
            const matchStart = !this.filters.startDate || rowDate >= this.filters.startDate;
            const matchEnd = !this.filters.endDate || rowDate <= this.filters.endDate;
            
            return matchName && matchStart && matchEnd;
        });

        // Hitung Total Jam Lembur (Asumsi format Total Jam di Sheets adalah "02:30" atau angka jam)
        filtered.forEach(row => {
            if (row.totaljam && row.totaljam !== '-') {
                const parts = String(row.totaljam).split(':');
                if (parts.length === 2) {
                    totalLemburMenit += (parseInt(parts[0]) * 60) + parseInt(parts[1]);
                } else if (!isNaN(row.totaljam)) {
                    totalLemburMenit += parseFloat(row.totaljam) * 60;
                }
            }
        });

        // Tampilkan Ringkasan Jika ada filter nama
        const summaryCard = document.getElementById('overtime-summary-card');
        if (this.filters.employee && summaryCard) {
            summaryCard.style.display = 'block';
            const jam = Math.floor(totalLemburMenit / 60);
            const menit = totalLemburMenit % 60;
            document.getElementById('total-overtime-hours').innerText = `${jam} Jam ${menit} Menit`;
        } else if (summaryCard) {
            summaryCard.style.display = 'none';
        }

        // Render Baris Tabel (Gunakan formatJam yang kemarin)
        const formatJam = (val) => {
            if (!val || val === '-') return '-';
            const str = String(val);
            return str.includes('T') ? str.split('T')[1].substring(0, 5) : str;
        };

        tbody.innerHTML = filtered.map((row, index) => {
            const d = row.timestamp ? new Date(row.timestamp) : null;
            return `
                <tr>
                    <td style="text-align:center;">${index + 1}</td>
                    <td>${d ? d.toLocaleDateString('id-ID') : '-'}<br><small>${d ? d.toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'}) : '-'}</small></td>
                    <td><strong>${row.nama || '-'}</strong></td>
                    <td><span style="padding:4px 8px; border-radius:12px; font-size:10px; background:#eee;">${String(row.tipe).toUpperCase()}</span></td>
                    <td style="font-size:10px;">${row.lokasi || '-'}</td>
                    <td style="text-align:center;">${row.foto ? `<img src="${row.foto}" style="width:30px;height:30px;object-fit:cover;border-radius:4px;" onclick="adminReports.viewPhoto('${row.foto}')">` : '-'}</td>
                    <td><small>${row.statustelat || '-'}</small></td>
                    <td style="text-align:center;">${formatJam(row.mulailembur)}</td>
                    <td style="text-align:center;">${formatJam(row.selesailembur)}</td>
                    <td style="text-align:center; background:#fffbeb; font-weight:bold;">${row.totaljam || '-'}</td>
                </tr>`;
        }).join('');
    },
    // ... (viewPhoto dan exportCSV tetap sama)
};
