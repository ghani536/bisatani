/**
 * Portal Karyawan - Admin Reports PT. BISATANI
 * Fitur: Filter Karyawan, Tanggal, dan Tipe Absensi (FIXED & OTOMATIS)
 */
const adminReports = {
    attendanceData: [],
    filters: { 
        employee: '', 
        startDate: '', 
        endDate: '',
        type: '' 
    },

    async init() {
        console.log("AdminReports: Mengatur periode cut-off 26-25...");
        
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth(); 
        const currentDate = now.getDate();

        let start, end;

        // LOGIKA CUT-OFF 26 s/d 25
        if (currentDate >= 26) {
            start = new Date(currentYear, currentMonth, 26, 12, 0, 0);
            end = new Date(currentYear, currentMonth + 1, 25, 12, 0, 0);
        } else {
            start = new Date(currentYear, currentMonth - 1, 26, 12, 0, 0);
            end = new Date(currentYear, currentMonth, 25, 12, 0, 0);
        }
        
        const startIn = document.getElementById('report-start-date');
        const endIn = document.getElementById('report-end-date');
        const typeIn = document.getElementById('report-type-filter');
        const empIn = document.getElementById('report-employee-filter');

        // Fungsi bantu format tanggal ke YYYY-MM-DD
        const formatDate = (date) => {
            const d = new Date(date);
            let m = '' + (d.getMonth() + 1);
            let day = '' + d.getDate();
            if (m.length < 2) m = '0' + m;
            if (day.length < 2) day = '0' + day;
            return [d.getFullYear(), m, day].join('-');
        };

        if (startIn) startIn.value = formatDate(start);
        if (endIn) endIn.value = formatDate(end);

        this.filters.startDate = startIn ? startIn.value : '';
        this.filters.endDate = endIn ? endIn.value : '';
        this.filters.type = typeIn ? typeIn.value : '';
        this.filters.employee = empIn ? empIn.value : '';

        await this.loadData();
        this.bindEvents();
    },

    async loadData() {
        const tbody = document.getElementById('attendance-reports-body');
        if (tbody) tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;"><i class="fas fa-sync fa-spin"></i> Memuat data...</td></tr>';
        
        try {
            const res = await api.post({ action: 'getAllAttendanceData' });
            if (res.success) {
                this.attendanceData = res.data || [];
                this.populateEmployeeFilter();
                this.renderTable();
            }
        } catch (e) { 
            console.error(e); 
            if (tbody) tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;color:red;">Gagal memuat data server</td></tr>';
        }
    },

    bindEvents() {
        // Pantau semua perubahan pada filter (Otomatis tanpa klik cari)
        const ids = ['report-employee-filter', 'report-start-date', 'report-end-date', 'report-type-filter'];
        ids.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                // Menggunakan 'input' agar langsung menyaring saat tanggal/opsi dipilih
                el.oninput = () => {
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

        let totalMenit = 0;
        
        const filtered = this.attendanceData.filter(row => {
            // Normalisasi Tanggal (Hanya ambil YYYY-MM-DD)
            const rowDate = (row.timestamp) ? String(row.timestamp).split('T')[0] : '';
            
            // Normalisasi Tipe
            const rowType = String(row.tipe || '').toUpperCase().trim();
            const filterType = String(this.filters.type || '').toUpperCase().trim();

            const matchName = !this.filters.employee || row.nama === this.filters.employee;
            const matchStart = !this.filters.startDate || rowDate >= this.filters.startDate;
            const matchEnd = !this.filters.endDate || rowDate <= this.filters.endDate;
            const matchType = !filterType || rowType === filterType;
            
            return matchName && matchStart && matchEnd && matchType;
        });

        // Hitung total jam lembur jika filter karyawan aktif
        filtered.forEach(row => {
            if (row.totaljam && row.totaljam !== '-') {
                const val = parseFloat(row.totaljam);
                if (!isNaN(val)) totalMenit += val * 60;
            }
        });

        // Update Ringkasan Lembur
        const sumCard = document.getElementById('overtime-summary-card');
        if (this.filters.employee && sumCard && filtered.length > 0) {
            sumCard.style.display = 'flex';
            const jam = Math.floor(totalMenit/60);
            const menit = Math.round(totalMenit%60);
            document.getElementById('total-overtime-hours').innerText = `${jam} Jam ${menit} Menit`;
        } else if (sumCard) {
            sumCard.style.display = 'none';
        }

        const formatJam = (v) => {
            if (!v || v === '-') return '-';
            return String(v).includes('T') ? String(v).split('T')[1].substring(0, 5) : String(v).substring(0, 5);
        };

        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; padding:30px; color:#999;">Tidak ada data yang cocok</td></tr>';
            return;
        }

        tbody.innerHTML = filtered.map((row, index) => {
            const d = row.timestamp ? new Date(row.timestamp) : null;
            return `<tr>
                <td style="text-align:center;">${index + 1}</td>
                <td>${d ? d.toLocaleDateString('id-ID') : '-'}<br><small>${d ? d.toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'}) : '-'}</small></td>
                <td><strong>${row.nama || '-'}</strong></td>
                <td><span style="padding:4px 8px; border-radius:12px; font-size:10px; background:#eee; font-weight:bold;">${String(row.tipe).toUpperCase().replace('_', ' ')}</span></td>
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
