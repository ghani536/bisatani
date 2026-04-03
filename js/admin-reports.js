/**
 * Portal Karyawan - Admin Reports PT. BISATANI
 * Versi Full: Menampilkan Mulai, Selesai, dan Total Lembur
 */
const adminReports = {
    allAttendance: [],
    employees: [],

    async init() {
        if (!document.getElementById('attendance-reports-body')) return;
        this.setupFilters();
        await this.loadData();
        this.bindEvents();
    },

    setupFilters() {
        const today = new Date().toISOString().split('T')[0];
        const start = document.getElementById('report-start-date');
        const end = document.getElementById('report-end-date');
        if (start) start.value = today;
        if (end) end.value = today;
    },

    async loadData() {
        const tbody = document.getElementById('attendance-reports-body');
        if (!tbody) return;
        tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;"><i class="fas fa-sync fa-spin"></i> Sinkronisasi database...</td></tr>';

        try {
            const [resAtt, resEmp] = await Promise.all([
                api.get('getAllAttendanceData'),
                api.get('getEmployees')
            ]);

            if (resAtt && resAtt.success) this.allAttendance = resAtt.data || [];
            if (resEmp && resEmp.success) {
                this.employees = resEmp.data || [];
                this.populateEmployeeFilter();
            }
            this.renderTable();
        } catch (e) {
            console.error("Load Data Error:", e);
            tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; color:red;">Gagal memuat data.</td></tr>';
        }
    },

    populateEmployeeFilter() {
        const select = document.getElementById('report-employee-filter');
        if (!select) return;
        let html = '<option value="">Semua Karyawan</option>';
        this.employees.forEach(emp => {
            html += `<option value="${emp.id}">${emp.name}</option>`;
        });
        select.innerHTML = html;
    },

    bindEvents() {
        ['report-start-date', 'report-end-date', 'report-type-filter', 'report-employee-filter', 'report-search'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('change', () => this.renderTable());
                if (el.tagName === 'INPUT') el.addEventListener('keyup', () => this.renderTable());
            }
        });
    },

    renderTable() {
        const tbody = document.getElementById('attendance-reports-body');
        if (!tbody) return;

        const getVal = (id) => { const el = document.getElementById(id); return el ? el.value : ""; };
        const start = getVal('report-start-date'), end = getVal('report-end-date'),
              type = getVal('report-type-filter'), empId = getVal('report-employee-filter'),
              search = getVal('report-search').toLowerCase();

        const filtered = this.allAttendance.filter(log => {
            if (!log.timestamp) return false;
            const logDate = new Date(log.timestamp).toISOString().split('T')[0];
            const matchDate = (!start || !end) ? true : (logDate >= start && logDate <= end);
            const matchType = !type || log.type === type;
            const matchEmp = !empId || String(log.userId) === String(empId);
            const matchSearch = !search || (log.userName && log.userName.toLowerCase().includes(search)) || (String(log.userId).includes(search));
            return matchDate && matchType && matchEmp && matchSearch;
        });

        if (filtered.length === 0) {
            tbody.innerHTML = '<tr><td colspan="10" style="text-align:center; padding:20px;">Data tidak ditemukan.</td></tr>';
            return;
        }

        // Urutkan dari yang terbaru
        filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        tbody.innerHTML = filtered.map((log, index) => {
            const d = new Date(log.timestamp);
            const waktu = d.toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' });
            
            // Render Baris Tabel dengan mapping yang akurat
            return `
                <tr>
                    <td style="text-align:center;">${index + 1}</td>
                    <td><small>${waktu}</small></td>
                    <td><strong>${log.userName || log.userId}</strong></td>
                    <td><span class="badge-${String(log.type).toLowerCase().replace(/_/g, '-')}">${log.type}</span></td>
                    <td><small>${log.location || '-'}</small></td>
                    <td style="text-align:center;">
                        ${log.image ? `<img src="${log.image}" style="width:35px; height:35px; border-radius:4px; cursor:pointer;" onclick="window.open(this.src)">` : '-'}
                    </td>
                    <td><small>${log.statusTelat || '-'}</small></td>
                    <td style="text-align:center;">${log.mulai}</td>
                    <td style="text-align:center;">${log.selesai}</td>
                    <td style="text-align:center; font-weight:bold; color:#2563eb;">${log.totalHours}</td>
                </tr>
            `;
        }).join('');
    }
};

window.adminReports = adminReports;
