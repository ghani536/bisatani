/**
 * Portal Karyawan - Admin Reports PT. BISATANI
 * Menangani tampilan rekap absensi seluruh karyawan
 */
const adminReports = {
    allAttendance: [],
    employees: [],

    async init() {
        console.log("AdminReports: Inisialisasi...");
        this.setupFilters();
        await this.loadData();
        this.bindEvents();
    },

    setupFilters() {
        const today = new Date().toISOString().split('T')[0];
        const startInput = document.getElementById('report-start-date');
        const endInput = document.getElementById('report-end-date');
        
        if (startInput && !startInput.value) startInput.value = today;
        if (endInput && !endInput.value) endInput.value = today;
    },

    async loadData() {
        const tbody = document.getElementById('attendance-reports-body');
        if (tbody) tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;"><i class="fas fa-sync fa-spin"></i> Memuat data database...</td></tr>';

        try {
            // Gunakan api.get agar lebih stabil untuk penarikan data
            const resAtt = await api.get('getAllAttendanceData');
            const resEmp = await api.get('getEmployees');

            if (resAtt && resAtt.success) {
                this.allAttendance = resAtt.data || [];
            }

            if (resEmp && resEmp.success) {
                this.employees = resEmp.data || [];
                this.populateEmployeeFilter();
            }

            this.renderTable();

        } catch (e) {
            console.error("AdminReports Error:", e);
            if (tbody) tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; color:red;">Gagal memuat data laporan.</td></tr>';
        }
    },

    populateEmployeeFilter() {
        const select = document.getElementById('report-employee-filter');
        if (!select) return;
        
        let html = '<option value="">Semua Karyawan</option>';
        this.employees.forEach(emp => {
            html += `<option value="${emp.id}">${emp.name} (${emp.id})</option>`;
        });
        select.innerHTML = html;
    },

    bindEvents() {
        const filters = ['report-start-date', 'report-end-date', 'report-type-filter', 'report-employee-filter'];
        filters.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.onchange = () => this.renderTable();
        });

        // Tambahkan event untuk tombol cari/filter manual
        const btnFilter = document.querySelector('button[onclick="adminReports.loadData()"]');
        if(btnFilter) btnFilter.onclick = () => this.loadData();

        const btnExport = document.getElementById('btn-export-attendance');
        if (btnExport) {
            btnExport.onclick = () => this.exportToExcel();
        }
    },

    renderTable() {
        const tbody = document.getElementById('attendance-reports-body');
        if (!tbody) return;

        // --- SAFETY CHECK (MENCEGAH ERROR NULL READING VALUE) ---
        const start = document.getElementById('report-start-date')?.value || "";
        const end = document.getElementById('report-end-date')?.value || "";
        const type = document.getElementById('report-type-filter')?.value || "";
        const empId = document.getElementById('report-employee-filter')?.value || "";
        const search = document.getElementById('report-search')?.value?.toLowerCase() || "";

        const filtered = this.allAttendance.filter(log => {
            if (!log.timestamp) return false;
            
            const logDate = new Date(log.timestamp).toISOString().split('T')[0];
            const matchDate = (!start || !end) ? true : (logDate >= start && logDate <= end);
            const matchType = type === "" || log.type === type;
            const matchEmp = empId === "" || String(log.userId) === String(empId);
            const matchSearch = search === "" || 
                               (log.userName && log.userName.toLowerCase().includes(search)) || 
                               (String(log.userId).includes(search));

            return matchDate && matchType && matchEmp && matchSearch;
        });

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; padding:30px; color:#64748b;">
                <i class="fas fa-info-circle"></i> Tidak ada data ditemukan.
            </td></tr>`;
            return;
        }

        // Urutkan data terbaru di paling atas
        filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        tbody.innerHTML = filtered.map((log, index) => {
            const d = new Date(log.timestamp);
            const waktu = d.toLocaleDateString('id-ID') + ' ' + d.toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'});
            
            return `
                <tr>
                    <td style="text-align:center;">${index + 1}</td>
                    <td><small>${waktu}</small></td>
                    <td><strong>${log.userName || log.userId}</strong></td>
                    <td><span class="badge-${String(log.type).toLowerCase()}">${log.type}</span></td>
                    <td><small>${log.location || '-'}</small></td>
                    <td style="text-align:center;">
                        ${log.image ? `<img src="${log.image}" style="width:35px; height:35px; border-radius:4px; object-fit:cover; cursor:pointer;" onclick="window.open(this.src)">` : '-'}
                    </td>
                    <td><small>${log.statusTelat || '-'}</small></td>
                    <td style="text-align:center;">${log.startTime || '-'}</td>
                    <td style="text-align:center;">${log.endTime || '-'}</td>
                    <td style="background:#f0f9ff; font-weight:bold; text-align:center;">${log.totalHours ? log.totalHours + ' j' : '-'}</td>
                </tr>
            `;
        }).join('');
    },

    exportToExcel() {
        if (this.allAttendance.length === 0) {
            alert("Tidak ada data untuk diexport!");
            return;
        }
        // Gunakan separator koma agar lebih universal
        let csv = "Waktu,Nama,Tipe,Lokasi,Catatan,Mulai,Selesai,Total Jam\n";
        this.allAttendance.forEach(log => {
            csv += `"${log.timestamp}","${log.userName || log.userId}","${log.type}","${log.location}","${log.statusTelat || ''}","${log.startTime || ''}","${log.endTime || ''}","${log.totalHours || ''}"\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `Rekap_Absensi_Bisatani_${new Date().toLocaleDateString()}.csv`;
        link.click();
    }
};

window.adminReports = adminReports;
