const adminReports = {
    attendanceData: [],
    filters: { employee: '', startDate: '', endDate: '', type: '' },

    async init() {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 26);
        const end = new Date(now.getFullYear(), now.getMonth(), 25);
        
        const startIn = document.getElementById('report-start-date');
        const endIn = document.getElementById('report-end-date');
        const typeIn = document.getElementById('report-type-filter');
        
        if (startIn && !startIn.value) startIn.value = start.toISOString().split('T')[0];
        if (endIn && !endIn.value) endIn.value = end.toISOString().split('T')[0];

        this.filters.startDate = startIn ? startIn.value : '';
        this.filters.endDate = endIn ? endIn.value : '';
        this.filters.type = typeIn ? typeIn.value : '';

        await this.loadData();
        this.bindEvents();
    },

    async loadData() {
        const tbody = document.getElementById('attendance-reports-body');
        if (tbody) tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;"><i class="fas fa-sync fa-spin"></i> Memuat...</td></tr>';
        
        try {
            const res = await api.post({ action: 'getAllAttendanceData' });
            if (res.success) {
                this.attendanceData = res.data || [];
                console.log("Data diterima dari server:", this.attendanceData); // Cek data di F12
                this.populateEmployeeFilter();
                this.renderTable();
            }
        } catch (e) { console.error(e); }
    },

    bindEvents() {
        const ids = ['report-employee-filter', 'report-start-date', 'report-end-date', 'report-type-filter'];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.onchange = () => {
                    this.filters.employee = document.getElementById('report-employee-filter').value;
                    this.filters.startDate = document.getElementById('report-start-date').value;
                    this.filters.endDate = document.getElementById('report-end-date').value;
                    this.filters.type = document.getElementById('report-type-filter').value;
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

        console.log("Filters aktif:", this.filters); // Cek filter di Console F12

        const filtered = this.attendanceData.filter(row => {
            // 1. NORMALISASI TANGGAL (Ambil YYYY-MM-DD saja)
            let rowDate = "";
            if (row.timestamp) {
                // Jika formatnya ISO (2026-03-31T...) atau string biasa
                rowDate = String(row.timestamp).split('T')[0].trim();
            }

            // 2. NORMALISASI TIPE (Hapus spasi, jadikan huruf besar)
            const rowType = String(row.tipe || '').toUpperCase().trim();
            const filterType = String(this.filters.type || '').toUpperCase().trim();

            // 3. LOGIKA PENYARINGAN
            const matchName = !this.filters.employee || row.nama === this.filters.employee;
            const matchStart = !this.filters.startDate || rowDate >= this.filters.startDate;
            const matchEnd = !this.filters.endDate || rowDate <= this.filters.endDate;
            const matchType = !filterType || rowType === filterType;
            
            return matchName && matchStart && matchEnd && matchType;
        });

        // Tampilkan pesan jika hasil filter kosong
        if (filtered.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="10" style="text-align:center; padding:50px; color:#94a3b8;">
                        <i class="fas fa-search" style="font-size:2rem; display:block; margin-bottom:10px;"></i>
                        Tidak ada data yang cocok dengan filter ini.<br>
                        <small>Coba ubah rentang tanggal atau pilih "Semua Tipe".</small>
                    </td>
                </tr>`;
            const sumCard = document.getElementById('overtime-summary-card');
            if (sumCard) sumCard.style.display = 'none';
            return;
        }

        // Jalankan fungsi render baris jika ada data
        this.displayData(filtered, tbody);
    },

    displayData(data, tbody) {
        const formatJam = (v) => {
            if (!v || v === '-') return '-';
            return String(v).includes('T') ? String(v).split('T')[1].substring(0, 5) : String(v).substring(0, 5);
        };

        tbody.innerHTML = data.map((row, index) => {
            const d = row.timestamp ? new Date(row.timestamp) : null;
            return `<tr>
                <td style="text-align:center;">${index + 1}</td>
                <td>${d ? d.toLocaleDateString('id-ID') : '-'}<br><small>${d ? d.toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'}) : '-'}</small></td>
                <td><strong>${row.nama || '-'}</strong></td>
                <td><span class="badge-tipe">${String(row.tipe).toUpperCase()}</span></td>
                <td style="font-size:10px; max-width:150px; overflow:hidden; text-overflow:ellipsis;">${row.lokasi || '-'}</td>
                <td style="text-align:center;">${row.foto ? `<img src="${row.foto}" class="img-preview" onclick="window.open('${row.foto}')">` : '-'}</td>
                <td><small>${row.statustelat || '-'}</small></td>
                <td style="text-align:center;">${formatJam(row.mulailembur)}</td>
                <td style="text-align:center;">${formatJam(row.selesailembur)}</td>
                <td style="text-align:center; background:#fffbeb; font-weight:bold;">${row.totaljam || '-'}</td>
            </tr>`;
        }).join('');
    }
};

window.adminReports = adminReports;
