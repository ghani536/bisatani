/**
 * Portal Karyawan - Admin Reports PT. BISATANI
 * Versi Update: Support 10 Kolom Attendance & Real-time Sync
 */

const adminReports = {
    attendanceData: [], // Sekarang akan berisi log mentah 10 kolom
    jurnalData: [],
    leaveData: [],
    filters: {
        attendance: { month: '', employee: '', type: '' }
    },

    async initAttendanceReports() {
        if (!auth.isAdmin()) {
            toast.error('Akses ditolak!');
            router.navigate('dashboard');
            return;
        }
        await this.loadData();
        this.bindAttendanceEvents();
        this.renderAttendanceReports();
    },

    async loadData() {
        try {
            // Kita panggil getAllAttendance yang mengambil data mentah dari Spreadsheet
            const attResult = await api.post({ action: 'getAllAttendance' });
            this.attendanceData = attResult.data || [];
            
            // Data pendukung lainnya tetap dimuat
            const [empResult, jurnalResult, leaveResult] = await Promise.all([
                api.getEmployees(),
                api.getAllJournals(),
                api.getAllLeaves()
            ]);
            
            this.rawEmployees = empResult.data || [];
            this.jurnalData = jurnalResult.data || [];
            this.leaveData = leaveResult.data || [];
            
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Gagal memuat data dari server');
        }
    },

    bindAttendanceEvents() {
        // Tombol Export & Print
        const exportBtn = document.getElementById('btn-export-attendance');
        if (exportBtn) exportBtn.onclick = () => this.exportToExcel('attendance');

        // Filter Nama (Sangat penting untuk PT. Bisatani)
        const nameFilter = document.getElementById('report-employee-filter');
        if (nameFilter) {
            nameFilter.onchange = (e) => {
                this.filters.attendance.employee = e.target.value;
                this.renderAttendanceReports();
            };
        }

        // Filter Tipe (Masuk/Pulang/Lembur)
        const typeFilter = document.getElementById('report-type-filter');
        if (typeFilter) {
            typeFilter.onchange = (e) => {
                this.filters.attendance.type = e.target.value;
                this.renderAttendanceReports();
            };
        }
    },

    renderAttendanceReports() {
        const tbody = document.getElementById('attendance-reports-body');
        if (!tbody) return;

        // Terapkan Filter
        const filtered = this.attendanceData.filter(row => {
            const matchName = !this.filters.attendance.employee || row.userName === this.filters.attendance.employee;
            const matchType = !this.filters.attendance.type || row.tipe === this.filters.attendance.type;
            return matchName && matchType;
        });

        tbody.innerHTML = filtered.map((row, index) => {
            const date = new Date(row.timestamp);
            const tgl = date.toLocaleDateString('id-ID');
            const jam = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
            
            // Badge Warna Tipe
            const tipe = String(row.tipe).toUpperCase();
            let badgeStyle = "background: #e2e8f0; color: #475569;";
            if (tipe === 'MASUK') badgeStyle = "background: #dcfce7; color: #166534;";
            if (tipe === 'PULANG') badgeStyle = "background: #fee2e2; color: #991b1b;";
            if (tipe.includes('LEMBUR')) badgeStyle = "background: #fef3c7; color: #92400e;";

            return `
                <tr>
                    <td>${index + 1}</td>
                    <td>${tgl}<br><small>${jam}</small></td>
                    <td><strong>${row.userName}</strong></td>
                    <td><span class="status-badge" style="${badgeStyle} padding: 4px 8px; border-radius: 6px; font-size: 0.7rem;">${tipe}</span></td>
                    <td style="font-size: 0.75rem; max-width: 150px;">${row.location || '-'}</td>
                    <td>
                        ${row.image ? `<img src="${row.image}" style="width:35px; height:35px; object-fit:cover; border-radius:4px; cursor:pointer;" onclick="adminReports.viewPhoto('${row.image}')">` : '-'}
                    </td>
                    <td><small>${row.keterangan || '-'}</small></td>
                    <td style="color: #92400e; font-weight: 600;">${row.mulaiLembur || '-'}</td>
                    <td style="color: #92400e; font-weight: 600;">${row.selesaiLembur || '-'}</td>
                    <td style="background: #fffbeb; font-weight: bold; text-align: center; color: #b45309;">${row.totalJam || '-'}</td>
                </tr>
            `;
        }).join('');
    },

    // Fungsi helper lainnya (viewPhoto, convertToCSV, dkk) tetap dipertahankan dari file lama Anda
    viewPhoto(photoUrl) {
        if (!photoUrl) return;
        modal.show('Bukti Foto Absensi', `
            <div style="text-align:center">
                <img src="${photoUrl}" style="max-width:100%; border-radius:8px;">
            </div>
        `, [{ label: 'Tutup', class: 'btn-secondary', onClick: () => modal.close() }]);
    },

    exportToExcel(type) {
        const data = this.attendanceData;
        if (!data.length) return toast.error('Tidak ada data untuk diexport');
        
        const headers = "No,Tanggal,Nama,Tipe,Lokasi,Keterangan,Mulai Lembur,Selesai Lembur,Total Jam\n";
        const rows = data.map((r, i) => {
            return `${i+1},"${r.timestamp}","${r.userName}","${r.tipe}","${r.location}","${r.keterangan}","${r.mulaiLembur}","${r.selesaiLembur}","${r.totalJam}"`;
        }).join("\n");

        this.downloadFile(headers + rows, 'Rekap_Absensi_Bisatani.csv', 'text/csv');
    },

    downloadFile(content, filename, contentType) {
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
    }
};

window.adminReports = adminReports;
window.initAttendanceReports = () => adminReports.initAttendanceReports();
