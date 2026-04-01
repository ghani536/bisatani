/**
 * Portal Karyawan - Payroll Engine PT. BISATANI
 * Periode Gaji: Tanggal 26 (Bulan Lalu) s/d 25 (Bulan Ini)
 * Fitur: Kalkulasi Otomatis, Slip Gaji, & Export Excel
 */
const payroll = {
    config: {},
    employees: [],
    attendance: [],
    calculatedData: [],

    init() {
        console.log("Payroll: Engine Aktif...");
        
        // Set Default Tahun & Bulan di UI
        const yearInput = document.getElementById('payroll-year');
        const monthInput = document.getElementById('payroll-month');
        
        if (yearInput) yearInput.value = new Date().getFullYear();
        if (monthInput) monthInput.value = new Date().getMonth(); 
    },

    async calculate() {
        const btn = document.querySelector('button[onclick="payroll.calculate()"]');
        const tbody = document.getElementById('payroll-table-body');
        
        try {
            // UI Loading State
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
            
            // 2. Normalisasi Config (Handle Object atau Array)
            this.config = {};
            if (resCfg.success && resCfg.data) {
                if (Array.isArray(resCfg.data)) {
                    resCfg.data.forEach(item => { this.config[item.key] = item.value; });
                } else {
                    this.config = resCfg.data;
                }
            }

            // 3. Tentukan Range Tanggal (26 Bulan Lalu - 25 Bulan Ini)
            const startDate = new Date(year, month - 1, 26, 0, 0, 0);
            const endDate = new Date(year, month, 25, 23, 59, 59);

            console.log(`Menghitung Periode: ${startDate.toDateString()} - ${endDate.toDateString()}`);

            // 4. Proses Hitung per Karyawan
            this.calculatedData = this.employees.map(emp => {
                return this.calculateSingleEmployee(emp, startDate, endDate);
            });

            // 5. Tampilkan ke Tabel
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

        // Ambil Aturan dari Settings
        const jamMasukStandar = this.config.jam_masuk || "08:00";
        const tarifLembur = parseInt(this.config.overtime_rate || 0);
        const dendaTelatPerKejadian = parseInt(this.config.late_rate || 0); 

        let hadirCount = 0;
        let jamLemburTotal = 0;
        let telatCount = 0;

        // Hitung Kehadiran & Telat
        userLogs.filter(l => l.type === 'MASUK').forEach(log => {
            hadirCount++;
            const jamMasukUser = new Date(log.timestamp).toLocaleTimeString('id-ID', { hour12: false, hour: '2-digit', minute: '2-digit' });
            if (jamMasukUser > jamMasukStandar) {
                telatCount++;
            }
        });

        // Hitung Lembur (Berdasarkan totalHours yang tersimpan di baris SELESAI_LEMBUR)
        userLogs.filter(l => l.type === 'SELESAI_LEMBUR').forEach(log => {
            jamLemburTotal += parseFloat(log.totalHours || 0);
        });

        // Kalkulasi Nominal
        const gapok = parseInt(emp.gaji_pokok || 0);
        const bpjs = parseInt(emp.bpjs || 0);
        const bonusLembur = Math.round(jamLemburTotal * tarifLembur);
        const totalDendaTelat = telatCount * dendaTelatPerKejadian;
        
        const takeHomePay = (gapok + bonusLembur) - (bpjs + totalDendaTelat);

        return {
            id: emp.id,
            name: emp.name,
            gapok: gapok,
            hadir: hadirCount,
            lemburJam: jamLemburTotal,
            bonusLembur: bonusLembur,
            telatCount: telatCount,
            dendaTelat: totalDendaTelat,
            bpjs: bpjs,
            totalGaji: takeHomePay
        };
    },

    renderTable(data) {
        const tbody = document.getElementById('payroll-table-body');
        if (!tbody) return;

        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;">Data karyawan tidak ditemukan.</td></tr>';
            return;
        }

        tbody.innerHTML = data.map(p => `
            <tr>
                <td style="padding:12px;"><strong>${p.name}</strong><br><small>${p.id}</small></td>
                <td>Rp ${p.gapok.toLocaleString('id-ID')}</td>
                <td style="text-align:center;">${p.hadir} Hari</td>
                <td style="text-align:center;">${p.lemburJam.toFixed(1)} j</td>
                <td style="color:#10b981; font-weight:600;">+${p.bonusLembur.toLocaleString('id-ID')}</td>
                <td style="color:#ef4444;">-${p.dendaTelat.toLocaleString('id-ID')}</td>
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
        if (!data) {
            alert("Data gaji tidak ditemukan. Silakan klik 'Hitung' terlebih dahulu.");
            return;
        }

        const modal = document.getElementById('modal-slip');
        const content = document.getElementById('slip-content');
        
        const bulanSelect = document.getElementById('payroll-month');
        const bulanNama = bulanSelect.options[bulanSelect.selectedIndex].text;
        const tahun = document.getElementById('payroll-year').value;

        content.innerHTML = `
            <div style="text-align:center; border-bottom:2px dashed #eee; padding-bottom:10px; margin-bottom:15px;">
                <h3 style="margin:0; color:#10b981;">PT. BISATANI</h3>
                <small style="color:#64748b;">Periode: 26 ${this.getPrevMonthName(bulanNama)} - 25 ${bulanNama} ${tahun}</small>
            </div>
            <table style="width:100%; border-collapse:collapse; font-size:13px; font-family:monospace;">
                <tr><td style="padding:4px 0;">NAMA</td><td>: <strong>${data.name}</strong></td></tr>
                <tr><td style="padding:4px 0;">ID KARYAWAN</td><td>: ${data.id}</td></tr>
                <tr><td colspan="2"><hr style="border:0; border-top:1px solid #eee; margin:10px 0;"></td></tr>
                <tr><td style="padding:4px 0;">GAJI POKOK</td><td style="text-align:right;">Rp ${data.gapok.toLocaleString('id-ID')}</td></tr>
                <tr><td style="padding:4px 0; color:#10b981;">(+) LEMBUR (${data.lemburJam.toFixed(1)}j)</td><td style="text-align:right; color:#10b981;">+ Rp ${data.bonusLembur.toLocaleString('id-ID')}</td></tr>
                <tr><td style="padding:4px 0; color:#ef4444;">(-) DENDA TELAT (${data.telatCount}x)</td><td style="text-align:right; color:#ef4444;">- Rp ${data.dendaTelat.toLocaleString('id-ID')}</td></tr>
                <tr><td style="padding:4px 0; color:#ef4444;">(-) POTONGAN BPJS</td><td style="text-align:right; color:#ef4444;">- Rp ${data.bpjs.toLocaleString('id-ID')}</td></tr>
                <tr><td colspan="2"><hr style="border:0; border-top:2px solid #334155; margin:10px 0;"></td></tr>
                <tr style="font-weight:bold; font-size:16px;">
                    <td style="color:#1e293b;">TOTAL GAJI</td>
                    <td style="text-align:right; color:#166534;">Rp ${data.totalGaji.toLocaleString('id-ID')}</td>
                </tr>
            </table>
            <div style="margin-top:25px; text-align:center; font-size:10px; color:#94a3b8; border-top:1px solid #f1f5f9; padding-top:10px;">
                Dicetak pada: ${new Date().toLocaleString('id-ID')}<br>
                * Dokumen Sah PT. BISATANI *
            </div>
        `;

        modal.style.display = 'flex';
        modal.style.zIndex = '10000'; 
    },

    exportToExcel() {
        if (this.calculatedData.length === 0) {
            alert("Hitung gaji terlebih dahulu sebelum export!");
            return;
        }

        const bulan = document.getElementById('payroll-month').options[document.getElementById('payroll-month').selectedIndex].text;
        const tahun = document.getElementById('payroll-year').value;
        
        // 1. Header CSV (Pakai separator titik koma agar Excel otomatis baca kolom)
        let csv = "Nama Karyawan;ID Karyawan;Gaji Pokok;Total Hadir;Total Lembur (Jam);Bonus Lembur;Denda Telat;Potongan BPJS;Gaji Bersih\n";
        
        // 2. Data Baris
        this.calculatedData.forEach(p => {
            csv += `${p.name};${p.id};${p.gapok};${p.hadir};${p.lemburJam.toFixed(1)};${p.bonusLembur};${p.dendaTelat};${p.bpjs};${p.totalGaji}\n`;
        });

        // 3. Download Logic
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `Payroll_BISATANI_${bulan}_${tahun}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },

    getPrevMonthName(currentMonth) {
        const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
        let idx = months.indexOf(currentMonth);
        if (idx <= 0) idx = 12;
        return months[idx - 1];
    }
};

window.payroll = payroll;
