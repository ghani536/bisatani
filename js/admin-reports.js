/**
 * Portal Karyawan - Admin Reports PT. BISATANI
 * Menangani tampilan rekap absensi seluruh karyawan
 */
const adminReports = {
    allAttendance: [],
    employees: [],

    init() {
        console.log("AdminReports: Inisialisasi...");
        this.setupFilters();
        this.loadData();
        this.bindEvents();
    },

    setupFilters() {
        // Set default tanggal hari ini
        const today = new Date().toISOString().split('T')[0];
        const startInput = document.getElementById('report-start-date');
        const endInput = document.getElementById('report-end-date');
        
        if (startInput) startInput.value = today;
        if (endInput) endInput.value = today;
    },

    async loadData() {
        const tbody = document.getElementById('attendance-reports-body');
        if (tbody) tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;"><i class="fas fa-sync fa-spin"></i> Memuat data absensi...</td></tr>';

        try {
            // Kita panggil getAllAttendanceData (sesuai yang ada di Kode.gs)
            const [resAtt, resEmp] = await Promise.all([
                api.post({ action: 'getAllAttendanceData' }),
                api.post({ action: 'getEmployees' })
            ]);

            if (resAtt.success) {
                this.allAttendance = resAtt.data || [];
                console.log("Data Absensi Berhasil Dimuat:", this.allAttendance.length);
            }

            if (resEmp.success) {
                this.employees = resEmp.data || [];
                this.populateEmployeeFilter();
            }

            this.renderTable();
        } catch (e) {
            console.error("Gagal load reports:", e);
            if (tbody) tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; color:red;">Gagal memuat data.</td></tr>';
        }
    },

    populateEmployeeFilter() {
        const select = document.getElementById('report-employee-filter');
        if (!select) return;
        
        // Simpan "Semua" lalu tambah list karyawan
        select.innerHTML = '<option value="">Semua Karyawan</option>';
        this.employees.forEach(emp => {
            select.innerHTML += `<option value="${emp.id}">${emp.name} (${emp.id})</option>`;
        });
    },

    bindEvents() {
        // Filter otomatis saat input berubah
        const filters = ['report-start-date', 'report-end-date', 'report-type-filter', 'report-employee-filter'];
        filters.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.onchange = () => this.renderTable();
        });

        // Tombol Export di menu Rekap
        const btnExport = document.getElementById('btn-export-attendance');
        if (btnExport) {
            btnExport.onclick = () => this.exportToExcel();
        }
    },

    renderTable() {
        const tbody = document.getElementById('attendance-reports-body');
        if (!tbody) return;

        const start = document.getElementById('report-start-date').value;
        const end = document.getElementById('report-end-date').value;
        const type = document.getElementById('report-type-filter').value;
        const empId = document.getElementById('report-employee-filter').value;

        // Logika Filter
        const filtered = this.allAttendance.filter(log => {
            const logDate = log.timestamp.split('T')[0];
            const matchDate = logDate >= start && logDate <= end;
            const matchType = type === "" || log.type === type;
            const matchEmp = empId === "" || String(log.userId) === String(empId);
            return matchDate && matchType && matchEmp;
        });

        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; padding:20px;">Tidak ada data untuk filter ini.</td></tr>';
            return;
        }

        tbody.innerHTML = filtered.map((log, index) => {
            const d = new Date(log.timestamp);
            const waktu = d.toLocaleDateString('id-ID') + ' ' + d.toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'});
            
            return `
                <tr>
                    <td>${index + 1}</td>
                    <td>${waktu}</td>
                    <td><strong>${log.userName || log.userId}</strong></td>
                    <td><span class="badge-${log.type.toLowerCase()}">${log.type}</span></td>
                    <td><small>${log.location || '-'}</small></td>
                    <td>${log.image ? `<img src="${log.image}" style="width:40px; height:40px; border-radius:4px; cursor:pointer;" onclick="window.open(this.src)">` : '-'}</td>
                    <td>${log.note || '-'}</td>
                    <td>${log.startTime || '-'}</td>
                    <td>${log.endTime || '-'}</td>
                    <td style="background:#fffbeb; font-weight:bold;">${log.totalHours ? log.totalHours + ' j' : '-'}</td>
                </tr>
            `;
        }).join('');
    },

    exportToExcel() {
        // Logika export sederhana untuk rekap absensi
        let csv = "Waktu;Nama;Tipe;Lokasi;Catatan;Mulai;Selesai;Total Jam\n";
        this.allAttendance.forEach(log => {
            csv += `${log.timestamp};${log.userName};${log.type};${log.location};${log.note};${log.startTime || ''};${log.endTime || ''};${log.totalHours || ''}\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `Rekap_Absensi_Bisatani_${new Date().toLocaleDateString()}.csv`;
        link.click();
    }
};

window.adminReports = adminReports;
