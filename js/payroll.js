/**
 * Portal Karyawan - Payroll Engine PT. BISATANI
 * Periode: 26 (Bulan Lalu) - 25 (Bulan Ini)
 */
const payroll = {
    config: {},
    employees: [],
    attendance: [],

    init() {
        console.log("Payroll: Engine Aktif...");
        // Set tahun default ke tahun sekarang
        const yearInput = document.getElementById('payroll-year');
        if (yearInput) yearInput.value = new Date().getFullYear();
        
        // Set bulan default ke bulan sekarang
        const monthInput = document.getElementById('payroll-month');
        if (monthInput) monthInput.value = new Date().getMonth();
    },

    async calculate() {
        const btn = document.querySelector('button[onclick="payroll.calculate()"]');
        const tbody = document.getElementById('payroll-table-body');
        
        try {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
            tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding:30px;"><i class="fas fa-sync fa-spin"></i> Menghitung data kehadiran & gaji...</td></tr>';

            const month = parseInt(document.getElementById('payroll-month').value);
            const year = parseInt(document.getElementById('payroll-year').value);

            // 1. Ambil Data Dasar (Karyawan, Settings, & Semua Absensi)
            const [resEmp, resCfg, resAtt] = await Promise.all([
                api.post({ action: 'getEmployees' }),
                api.post({ action: 'getSettings' }),
                api.post({ action: 'getAllAttendanceData' })
            ]);

            if (!resEmp.success || !resCfg.success || !resAtt.success) {
                throw new Error("Gagal mengambil data dari server");
            }

            this.employees = resEmp.data;
            this.config = this.processConfig(resCfg.data);
            this.attendance = resAtt.data;

            // 2. Tentukan Range Tanggal (26 Bulan Lalu - 25 Bulan Ini)
            const startDate = new Date(year, month - 1, 26);
            const endDate = new Date(year, month, 25, 23, 59, 59);

            // 3. Hitung Gaji per Karyawan
            const payrollData = this.employees.map(emp => {
                return this.calculateSingleEmployee(emp, startDate, endDate);
            });

            this.renderTable(payrollData);

        } catch (e) {
            console.error(e);
            alert("Gagal menghitung payroll: " + e.message);
            tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; color:red;">Terjadi kesalahan sistem.</td></tr>';
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-calculator"></i> Hitung';
        }
    },

    processConfig(data) {
        const cfg = {};
        data.forEach(item => { cfg[item.key] = item.value; });
        return cfg;
    },

    calculateSingleEmployee(emp, start, end) {
        // Filter absensi karyawan ini di range tanggal terpilih
        const logs = this.attendance.filter(a => {
            const date = new Date(a.timestamp);
            return a.userId === emp.id && date >= start && date <= end;
        });

        let totalHadir = 0;
        let totalLemburJam = 0;
        let kaliTelat = 0;

        // Ambil aturan dari settings
        const jamMasukKantor = this.config.jam_masuk || "08:00";
        const tarifLembur = parseInt(this.config.overtime_rate || 0);
        const dendaTelat = parseInt(this.config.late_rate || 0);

        // Logika Hitung per hari
        // Kita cari data MASUK dan PULANG
        const masuks = logs.filter(l => l.type === 'MASUK');
        totalHadir = masuks.length;

        masuks.forEach(m => {
            // Hitung Telat
            const jamMasukUser = new Date(m.timestamp).toLocaleTimeString('id-ID', { hour12: false, hour: '2-digit', minute: '2-digit' });
            if (jamMasukUser > jamMasukKantor) {
                kaliTelat++;
            }
        });

        // Hitung Lembur (Dari data SELESAI_LEMBUR jika ada kolom total di attendance)
        logs.forEach(l => {
            if (l.type === 'SELESAI_LEMBUR' && l.totalHours) {
                totalLemburJam += parseFloat(l.totalHours);
            }
        });

        const gajiPokok = parseInt(emp.gaji_pokok || 0);
        const potonganBpjs = parseInt(emp.bpjs || 0);
        const bonusLembur = totalLemburJam * tarifLembur;
        const totalDendaTelat = kaliTelat * dendaTelat;
        
        const gajiBersih = (gajiPokok + bonusLembur) - (potonganBpjs + totalDendaTelat);

        return {
            ...emp,
            totalHadir,
            totalLemburJam,
            bonusLembur,
            totalDendaTelat,
            gajiBersih
        };
    },

    renderTable(data) {
        const tbody = document.getElementById('payroll-table-body');
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;">Tidak ada data karyawan.</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(p => `
            <tr>
                <td style="padding:12px;"><strong>${p.name}</strong><br><small>${p.id}</small></td>
                <td>Rp ${parseInt(p.gaji_pokok).toLocaleString('id-ID')}</td>
                <td style="text-align:center;">${p.totalHadir} Hari</td>
                <td style="text-align:center;">${p.totalLemburJam.toFixed(1)} Jam</td>
                <td style="color:#10b981; font-weight:600;">+ Rp ${p.bonusLembur.toLocaleString('id-ID')}</td>
                <td style="color:#ef4444;">- Rp ${p.totalDendaTelat.toLocaleString('id-ID')}</td>
                <td style="color:#ef4444;">- Rp ${parseInt(p.bpjs).toLocaleString('id-ID')}</td>
                <td style="background:#f0fdf4; font-weight:700; color:#166534;">Rp ${p.gaji_bersih.toLocaleString('id-ID')}</td>
                <td style="text-align:center;">
                    <button onclick="payroll.showSlip('${p.id}')" style="background:#6366f1; color:white; border:none; padding:5px 10px; border-radius:6px; cursor:pointer;">
                        <i class="fas fa-file-invoice"></i> Slip
                    </button>
                </td>
            </tr>
        `).join('');
    },

    showSlip(id) {
        const p = this.employees.find(e => e.id === id); // Ini perlu data hasil kalkulasi, tapi untuk simulasi:
        alert("Fitur cetak slip untuk " + id + " sedang disiapkan!");
        // Kamu bisa kembangkan modal-slip di sini
    }
};

window.payroll = payroll;
