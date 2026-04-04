/**
 * Portal Karyawan - Payroll Engine PT. BISATANI
 * Update: Perhitungan Denda Berdasarkan Total Menit x Tarif per Menit (Gaji)
 * Periode Gaji: Tanggal 26 (Bulan Lalu) s/d 25 (Bulan Ini)
 */
const payroll = {
    config: {},
    employees: [],
    attendance: [],
    calculatedData: [],

    init() {
        console.log("Payroll: Engine Aktif...");
        const yearInput = document.getElementById('payroll-year');
        const monthInput = document.getElementById('payroll-month');
        if (yearInput) yearInput.value = new Date().getFullYear();
        if (monthInput) monthInput.value = new Date().getMonth(); 
    },

    async calculate() {
        const btn = document.querySelector('button[onclick="payroll.calculate()"]');
        const tbody = document.getElementById('payroll-table-body');
        
        try {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
            tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding:30px;"><i class="fas fa-sync fa-spin"></i> Sinkronisasi data absensi & aturan gaji...</td></tr>';

            const month = parseInt(document.getElementById('payroll-month').value);
            const year = parseInt(document.getElementById('payroll-year').value);

            // 1. Ambil Semua Data yang Dibutuhkan
            const [resEmp, resCfg, resAtt] = await Promise.all([
                api.post({ action: 'getEmployees' }),
                api.post({ action: 'getSettings' }),
                api.post({ action: 'getAllAttendanceData' })
            ]);

            if (!resEmp.success || !resAtt.success) {
                throw new Error("Gagal mengambil data karyawan/absensi dari server.");
            }

            this.employees = resEmp.data || [];
            this.attendance = resAtt.data || [];
            this.config = resCfg.data || {};

            // 2. Tentukan Range Tanggal (26 Bulan Lalu - 25 Bulan Ini)
            const startDate = new Date(year, month - 1, 26, 0, 0, 0);
            const endDate = new Date(year, month, 25, 23, 59, 59);

            // 3. Proses Hitung per Karyawan
            this.calculatedData = this.employees.map(emp => {
                return this.calculateSingleEmployee(emp, startDate, endDate);
            });

            // 4. Tampilkan ke Tabel
            this.renderTable(this.calculatedData);

        } catch (e) {
            console.error("Payroll Error:", e);
            alert("Terjadi kesalahan: " + e.message);
            tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; color:red;">Gagal memproses data payroll.</td></tr>';
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-calculator"></i> Hitung';
        }
    },

    calculateSingleEmployee(emp, start, end) {
        // Filter absensi milik karyawan ini di dalam range tanggal
        const userLogs = this.attendance.filter(a => {
            const tgl = new Date(a.timestamp);
            return String(a.userId) === String(emp.id) && tgl >= start && tgl <= end;
        });

        const tarifLembur = parseInt(this.config.overtime_rate || 0);
        const dendaPerMenit = parseFloat(emp.dendatelat || 0); // AMBIL DARI KOLOM M

        let hadirCount = 0;
        let jamLemburTotal = 0;
        let totalMenitTelat = 0;

        // Hitung Kehadiran & Total Menit Telat
        userLogs.filter(l => l.type === 'MASUK').forEach(log => {
            hadirCount++;
            // Ambil info telat dari kolom statusTelat (Format: "X Menit")
            if (log.statusTelat && log.statusTelat !== "0" && log.statusTelat !== "-") {
                const menit = parseInt(log.statusTelat) || 0;
                totalMenitTelat += menit;
            }
        });

        // Hitung Lembur
        userLogs.filter(l => l.type === 'SELESAI_LEMBUR').forEach(log => {
            jamLemburTotal += parseFloat(log.totalHours || 0);
        });

        // Kalkulasi Nominal
        const gapok = parseInt(emp.gaji_pokok || 0);
        const bpjs = parseInt(emp.bpjs || 0);
        const bonusLembur = Math.round(jamLemburTotal * tarifLembur);
        
        // REVISI LOGIKA: Total Menit x Tarif Denda per Menit
        const totalDendaTelat = Math.round(totalMenitTelat * dendaPerMenit);
        
        const takeHomePay = (gapok + bonusLembur) - (bpjs + totalDendaTelat);

        return {
            id: emp.id,
            name: emp.name,
            gapok: gapok,
            hadir: hadirCount,
            lemburJam: jamLemburTotal,
            bonusLembur: bonusLembur,
            menitTelat: totalMenitTelat, // Simpan info menit
            dendaTelat: totalDendaTelat,
            bpjs: bpjs,
            totalGaji: takeHomePay
        };
    },

    renderTable(data) {
        const tbody = document.getElementById('payroll-table-body');
        if (!tbody) return;

        tbody.innerHTML = data.map(p => `
            <tr>
                <td style="padding:12px;"><strong>${p.name}</strong><br><small>${p.id}</small></td>
                <td>Rp ${p.gapok.toLocaleString('id-ID')}</td>
                <td style="text-align:center;">${p.hadir} Hari</td>
                <td style="text-align:center;">${p.lemburJam.toFixed(1)} j</td>
                <td style="color:#10b981; font-weight:600;">+${p.bonusLembur.toLocaleString('id-ID')}</td>
                <td style="color:#ef4444;">
                    -${p.dendaTelat.toLocaleString('id-ID')}
                    <br><small style="font-size:10px;">(${p.menitTelat} mnt)</small>
                </td>
                <td style="color:#ef4444;">-${p.bpjs.toLocaleString('id-ID')}</td>
                <td style="background:#f0fdf4; font-weight:700; color:#166534;">Rp ${p.totalGaji.toLocaleString('id-ID')}</td>
                <td style="text-align:center;">
                    <button onclick="payroll.showSlip('${p.id}')" style="background:#6366f1; color:white; border:none; padding:6px 10px; border-radius:6px; cursor:pointer;">
                        <i class="fas fa-file-invoice"></i> Slip
                    </button>
                </td>
            </tr>
        `).join('');
    },

    showSlip(id) {
        const data = this.calculatedData.find(d => String(d.id) === String(id));
        if (!data) return;

        const modal = document.getElementById('modal-slip');
        const content = document.getElementById('slip-content');
        const bulanSelect = document.getElementById('payroll-month');
        const bulanNama = bulanSelect.options[bulanSelect.selectedIndex].text;
        const tahun = document.getElementById('payroll-year').value;

        content.innerHTML = `
            <div style="text-align:center; border-bottom:2px dashed #eee; padding-bottom:10px; margin-bottom:15px;">
                <h3 style="margin:0; color:#10b981;">PT. BISATANI</h3>
                <small style="color:#64748b;">Slip Gaji: ${bulanNama} ${tahun}</small>
            </div>
            <table style="width:100%; border-collapse:collapse; font-size:13px; font-family:monospace;">
                <tr><td style="padding:4px 0;">NAMA</td><td>: <strong>${data.name}</strong></td></tr>
                <tr><td style="padding:4px 0;">ID KARYAWAN</td><td>: ${data.id}</td></tr>
                <tr><td colspan="2"><hr style="border:0; border-top:1px solid #eee; margin:10px 0;"></td></tr>
                <tr><td style="padding:4px 0;">GAJI POKOK</td><td style="text-align:right;">Rp ${data.gapok.toLocaleString('id-ID')}</td></tr>
                <tr><td style="padding:4px 0; color:#10b981;">(+) LEMBUR (${data.lemburJam.toFixed(1)}j)</td><td style="text-align:right; color:#10b981;">+ Rp ${data.bonusLembur.toLocaleString('id-ID')}</td></tr>
                <tr><td style="padding:4px 0; color:#ef4444;">(-) DENDA TELAT (${data.menitTelat} Menit)</td><td style="text-align:right; color:#ef4444;">- Rp ${data.dendaTelat.toLocaleString('id-ID')}</td></tr>
                <tr><td style="padding:4px 0; color:#ef4444;">(-) POTONGAN BPJS</td><td style="text-align:right; color:#ef4444;">- Rp ${data.bpjs.toLocaleString('id-ID')}</td></tr>
                <tr><td colspan="2"><hr style="border:0; border-top:2px solid #334155; margin:10px 0;"></td></tr>
                <tr style="font-weight:bold; font-size:16px;">
                    <td style="color:#1e293b;">TOTAL GAJI</td>
                    <td style="text-align:right; color:#166534;">Rp ${data.totalGaji.toLocaleString('id-ID')}</td>
                </tr>
            </table>
            <div style="margin-top:20px; text-align:center; font-size:9px; color:#94a3b8;">
                * Dicetak otomatis oleh Sistem Payroll PT. BISATANI *
            </div>
        `;
        modal.style.display = 'flex';
        modal.style.zIndex = '10000'; 
    },

    exportToExcel() {
        if (this.calculatedData.length === 0) return alert("Hitung gaji dulu!");
        const bulan = document.getElementById('payroll-month').options[document.getElementById('payroll-month').selectedIndex].text;
        const tahun = document.getElementById('payroll-year').value;
        let csv = "Nama;ID;Gapok;Hadir;Lembur;Bonus;Menit Telat;Denda Telat;BPJS;Total\n";
        this.calculatedData.forEach(p => {
            csv += `${p.name};${p.id};${p.gapok};${p.hadir};${p.lemburJam.toFixed(1)};${p.bonusLembur};${p.menitTelat};${p.dendaTelat};${p.bpjs};${p.totalGaji}\n`;
        });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `Payroll_BISATANI_${bulan}_${tahun}.csv`;
        link.click();
    }
};

window.payroll = payroll;
