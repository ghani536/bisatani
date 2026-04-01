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
        // Pakai 'await' agar bindEvents dan renderTable tidak mendahului loadData
        await this.loadData();
        this.bindEvents();
    },

    setupFilters() {
        const today = new Date().toISOString().split('T')[0];
        const startInput = document.getElementById('report-start-date');
        const endInput = document.getElementById('report-end-date');
        
        // Hanya set jika input masih kosong
        if (startInput && !startInput.value) startInput.value = today;
        if (endInput && !endInput.value) endInput.value = today;
    },

    async loadData() {
        const tbody = document.getElementById('attendance-reports-body');
        if (tbody) tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;"><i class="fas fa-sync fa-spin"></i> Memuat data dari database...</td></tr>';

        try {
            const [resAtt, resEmp] = await Promise.all([
                api.post({ action: 'getAllAttendanceData' }),
                api.post({ action: 'getEmployees' })
            ]);

            if (resAtt.success) {
                this.allAttendance = resAtt.data || [];
                console.log("AdminReports: Data Absensi dimuat ->", this.allAttendance.length);
            }

            if (resEmp.success) {
                this.employees = resEmp.data || [];
                this.populateEmployeeFilter();
            }

            // Jalankan render setelah data dipastikan masuk
            this.renderTable();

        } catch (e) {
            console.error("AdminReports Error:", e);
            if (tbody) tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; color:red;">Koneksi ke server terputus.</td></tr>';
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
            // Gunakan arrow function agar 'this' tetap merujuk ke adminReports
            if (el) el.onchange = () => this.renderTable();
        });

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

        console.log(`Filtering: ${start} s/d ${end}`);

        const filtered = this.allAttendance.filter(log => {
            // Bersihkan timestamp untuk perbandingan tanggal saja
            const logDate = new Date(log.timestamp).toISOString().split('T')[0];
            const matchDate = logDate >= start && logDate <= end;
            const matchType = type === "" || log.type === type;
            const matchEmp = empId === "" || String(log.userId) === String(empId);
            return matchDate && matchType && matchEmp;
        });

        if (filtered.length === 0) {
            tbody.innerHTML = `<tr><td colspan="10" style="text-align:center; padding:30px; color:#64748b;">
                <i class="fas fa-info-circle"></i> Tidak ada absensi ditemukan.<br>
                <small>Coba cek range tanggal (Dari - Sampai) atau pastikan data sudah ada di Google Sheets.</small>
            </td></tr>`;
            return;
        }

        tbody.innerHTML = filtered.map((log, index) => {
            const d = new Date(log.timestamp);
            const waktu = d.toLocaleDateString('id-ID') + ' ' + d.toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'});
            
            return `
                <tr>
                    <td style="text-align:center;">${index + 1}</td>
                    <td>${waktu}</td>
                    <td><strong>${log.userName || log.userId}</strong></td>
                    <td><span class="badge-${log.type.toLowerCase()}">${log.type}</span></td>
                    <td><small>${log.location || '-'}</small></td>
                    <td style="text-align:center;">
                        ${log.image ? `<img src="${log.image}" style="width:35px; height:35px; border-radius:4px; object-fit:cover; cursor:pointer;" onclick="window.open(this.src)">` : '-'}
                    </td>
                    <td>${log.note || '-'}</td>
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
        let csv = "Waktu;Nama;Tipe;Lokasi;Catatan;Mulai;Selesai;Total Jam\n";
        this.allAttendance.forEach(log => {
            csv += `${log.timestamp};${log.userName || log.userId};${log.type};${log.location};${log.note};${log.startTime || ''};${log.endTime || ''};${log.totalHours || ''}\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `Rekap_Absensi_Bisatani_${new Date().toLocaleDateString()}.csv`;
        link.click();
    }
};

window.adminReports = adminReports;
