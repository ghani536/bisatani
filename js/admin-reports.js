/**
 * Portal Karyawan - Admin Reports PT. BISATANI
 * Fitur: Filter Karyawan, Tanggal, dan Tipe Absensi
 */
const adminReports = {
    attendanceData: [],
    filters: { 
        employee: '', 
        startDate: '', 
        endDate: '',
        type: '' // Tambahan filter tipe
    },

    async init() {
        console.log("AdminReports: Inisialisasi...");
        // Set Default: Tanggal 26 s/d 25
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 26);
        const end = new Date(now.getFullYear(), now.getMonth(), 25);
        
        const startIn = document.getElementById('report-start-date');
        const endIn = document.getElementById('report-end-date');
        const typeIn = document.getElementById('report-type-filter'); // Dropdown tipe
        
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
        if (tbody) tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;"><i class="fas fa-sync fa-spin"></i> Memuat data server...</td></tr>';
        
        try {
            const res = await api.post({ action: 'getAllAttendanceData' });
            if (res.success) {
                this.attendanceData = res.data || [];
                this.populateEmployeeFilter();
                this.renderTable();
            }
        } catch (e) { 
            console.error("Gagal load data rekap:", e); 
            if (tbody) tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; color:red;">Gagal mengambil data</td></tr>';
        }
    },

    bindEvents() {
        // Pantau semua input filter termasuk dropdown tipe
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

        // Tombol Export
        const btnExport = document.getElementById('btn-export-attendance');
        if (btnExport) {
            btnExport.onclick = () => alert("Fitur Export Excel segera hadir!");
        }
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
            
            // LOGIKA FILTER TIPE (MASUK, PULANG, MULAI_LEMBUR, SELESAI_LEMBUR)
            const matchType = !this.filters.type || String(row.tipe).toUpperCase().trim() === String(this.filters.type).toUpperCase().trim();
            
            return matchName && matchStart && matchEnd && matchType;
        });

        // Hitung total jam lembur hanya jika filter karyawan aktif
        filtered.forEach(row => {
            if (row.totaljam && row.totaljam !== '-') {
                const val = parseFloat(row.totaljam);
                if (!isNaN(val)) totalMenit += val * 60;
            }
        });

        // Update Ringkasan Lembur
        const sumCard = document.getElementById('overtime-summary-card');
        if (this.filters.employee && sumCard) {
            sumCard.style.display = 'flex';
            const jam = Math.floor(totalMenit/60);
            const menit = Math.round(totalMenit%60);
            document.getElementById('total-overtime-hours').innerText = `${jam} Jam ${menit} Menit`;
        } else if (sumCard) {
            sumCard.style.display = 'none';
        }

        const formatJam = (v) => {
            if (!v || v === '-') return '-';
            // Bersihkan jika ada format ISO Date
            return String(v).includes('T') ? String(v).split('T')[1].substring(0, 5) : String(v).substring(0, 5);
        };

        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; padding:20px; color:#999;">Tidak ada data yang cocok</td></tr>';
            return;
        }

        tbody.innerHTML = filtered.map((row, index) => {
            const d = row.timestamp ? new Date(row.timestamp) : null;
            const tipeLabel = String(row.tipe).toUpperCase().replace('_', ' ');
            
            // Warna label tipe
            let badgeColor = "#eee";
            if (tipeLabel.includes("MASUK")) badgeColor = "#dcfce7";
            if (tipeLabel.includes("PULANG")) badgeColor = "#fee2e2";
            if (tipeLabel.includes("LEMBUR")) badgeColor = "#fef3c7";

            return `<tr>
                <td style="text-align:center;">${index + 1}</td>
                <td>${d ? d.toLocaleDateString('id-ID') : '-'}<br><small>${d ? d.toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'}) : '-'}</small></td>
                <td><strong>${row.nama || '-'}</strong></td>
                <td><span style="padding:4px 8px; border-radius:12px; font-size:10px; background:${badgeColor}; font-weight:600;">${tipeLabel}</span></td>
                <td style="font-size:10px; max-width:150px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${row.lokasi || '-'}</td>
                <td style="text-align:center;">${row.foto ? `<img src="${row.foto}" style="width:30px;height:30px;object-fit:cover;border-radius:4px;cursor:pointer;" onclick="window.open('${row.foto}')">` : '-'}</td>
                <td><small>${row.statustelat || '-'}</small></td>
                <td style="text-align:center;">${formatJam(row.mulailembur)}</td>
                <td style="text-align:center;">${formatJam(row.selesailembur)}</td>
                <td style="text-align:center; background:#fffbeb; font-weight:bold;">${row.totaljam || '-'}</td>
            </tr>`;
        }).join('');
    }
};

window.adminReports = adminReports;
