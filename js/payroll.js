/**
 * js/payroll.js - PT. BISATANI
 * Versi Final: Fix Denda Slip & Print Support
 */
const payroll = {
    config: {},
    employees: [],
    attendance: [],
    calculatedData: [],

    init() {
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
            tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding:30px;"><i class="fas fa-sync fa-spin"></i> Sinkronisasi data...</td></tr>';

            const month = parseInt(document.getElementById('payroll-month').value);
            const year = parseInt(document.getElementById('payroll-year').value);

            const [resEmp, resCfg, resAtt] = await Promise.all([
                api.post({ action: 'getEmployees' }),
                api.post({ action: 'getSettings' }),
                api.post({ action: 'getAllAttendanceData' })
            ]);

            this.employees = resEmp.data || [];
            this.attendance = resAtt.data || [];
            this.config = resCfg.data || {};

            const startDate = new Date(year, month - 1, 26, 0, 0, 0);
            const endDate = new Date(year, month, 25, 23, 59, 59);

            this.calculatedData = this.employees.map(emp => this.calculateSingleEmployee(emp, startDate, endDate));
            this.renderTable(this.calculatedData);

        } catch (e) {
            alert("Error: " + e.message);
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-calculator"></i> Hitung';
        }
    },

    calculateSingleEmployee(emp, start, end) {
        const userLogs = this.attendance.filter(a => {
            const tgl = new Date(a.timestamp);
            return String(a.userId) === String(emp.id) && tgl >= start && tgl <= end;
        });

        // AMBIL DENDA PER MENIT (Prioritas: Database, Cadangan: Hitung Manual)
        let dendaPerMenit = parseFloat(emp.dendatelat || 0);
        if (dendaPerMenit <= 0) {
            const gaji = parseFloat(emp.gaji_pokok || 0);
            dendaPerMenit = Math.round(gaji / 25 / 8 / 60);
        }

        let hadirCount = 0;
        let totalMenitTelat = 0;
        let jamLemburTotal = 0;

        userLogs.forEach(log => {
            if (log.type === 'MASUK') {
                hadirCount++;
                if (log.statusTelat && log.statusTelat !== "0" && log.statusTelat !== "-") {
                    totalMenitTelat += parseInt(log.statusTelat) || 0;
                }
            }
            if (log.type === 'SELESAI_LEMBUR') {
                jamLemburTotal += parseFloat(log.totalHours || 0);
            }
        });

        const gapok = parseInt(emp.gaji_pokok || 0);
        const bpjs = parseInt(emp.bpjs || 0);
        const bonusLembur = Math.round(jamLemburTotal * parseInt(this.config.overtime_rate || 0));
        
        // HITUNG NOMINAL DENDA
        const nominalDenda = Math.round(totalMenitTelat * dendaPerMenit);
        const totalGaji = (gapok + bonusLembur) - (bpjs + nominalDenda);

        return {
            id: emp.id,
            name: emp.name,
            gapok: gapok,
            hadir: hadirCount,
            lemburJam: jamLemburTotal,
            bonusLembur: bonusLembur,
            menitTelat: totalMenitTelat,
            dendaTelat: nominalDenda, // Pastikan ini terisi
            bpjs: bpjs,
            totalGaji: totalGaji
        };
    },

    renderTable(data) {
        const tbody = document.getElementById('payroll-table-body');
        if (!tbody) return;
        tbody.innerHTML = data.map(p => `
            <tr>
                <td><strong>${p.name}</strong><br><small>${p.id}</small></td>
                <td>Rp ${p.gapok.toLocaleString('id-ID')}</td>
                <td style="text-align:center;">${p.hadir} Hari</td>
                <td style="text-align:center;">${p.lemburJam.toFixed(1)}j</td>
                <td style="color:#10b981;">+${p.bonusLembur.toLocaleString('id-ID')}</td>
                <td style="color:#ef4444;">-${p.dendaTelat.toLocaleString('id-ID')}<br><small>(${p.menitTelat} m)</small></td>
                <td style="color:#ef4444;">-${p.bpjs.toLocaleString('id-ID')}</td>
                <td style="background:#f0fdf4; font-weight:bold;">Rp ${p.totalGaji.toLocaleString('id-ID')}</td>
                <td><button onclick="payroll.showSlip('${p.id}')" style="background:#6366f1; color:white; border:none; padding:6px; border-radius:6px; cursor:pointer;"><i class="fas fa-file-invoice"></i> Slip</button></td>
            </tr>
        `).join('');
    },

    showSlip(id) {
        const data = this.calculatedData.find(d => String(d.id) === String(id));
        if (!data) return;

        const modal = document.getElementById('modal-slip');
        const content = document.getElementById('slip-content');
        const bulanNama = document.getElementById('payroll-month').options[document.getElementById('payroll-month').selectedIndex].text;

        content.innerHTML = `
            <div id="printable-area">
                <div style="text-align:center; border-bottom:2px dashed #eee; padding-bottom:10px; margin-bottom:15px;">
                    <h3 style="margin:0; color:#10b981;">PT. BISATANI</h3>
                    <small>Slip Gaji: ${bulanNama} ${document.getElementById('payroll-year').value}</small>
                </div>
                <table style="width:100%; border-collapse:collapse; font-size:13px; font-family:monospace;">
                    <tr><td>NAMA</td><td>: <strong>${data.name}</strong></td></tr>
                    <tr><td>ID KARYAWAN</td><td>: ${data.id}</td></tr>
                    <tr><td colspan="2"><hr style="border:0; border-top:1px solid #eee; margin:10px 0;"></td></tr>
                    <tr><td>GAJI POKOK</td><td style="text-align:right;">Rp ${data.gapok.toLocaleString('id-ID')}</td></tr>
                    <tr><td style="color:#10b981;">(+) LEMBUR (${data.lemburJam.toFixed(1)}j)</td><td style="text-align:right; color:#10b981;">+ Rp ${data.bonusLembur.toLocaleString('id-ID')}</td></tr>
                    <tr><td style="color:#ef4444;">(-) DENDA TELAT (${data.menitTelat} Menit)</td><td style="text-align:right; color:#ef4444;">- Rp ${data.dendaTelat.toLocaleString('id-ID')}</td></tr>
                    <tr><td style="color:#ef4444;">(-) POTONGAN BPJS</td><td style="text-align:right; color:#ef4444;">- Rp ${data.bpjs.toLocaleString('id-ID')}</td></tr>
                    <tr><td colspan="2"><hr style="border:0; border-top:2px solid #334155; margin:10px 0;"></td></tr>
                    <tr style="font-weight:bold; font-size:16px;">
                        <td>TOTAL GAJI</td>
                        <td style="text-align:right; color:#166534;">Rp ${data.totalGaji.toLocaleString('id-ID')}</td>
                    </tr>
                </table>
            </div>
            <div style="margin-top:20px; display:flex; gap:10px;" class="no-print">
                <button onclick="window.print()" style="flex:1; background:#10b981; color:white; border:none; padding:10px; border-radius:8px; cursor:pointer; font-weight:bold;"><i class="fas fa-print"></i> Cetak</button>
                <button onclick="document.getElementById('modal-slip').style.display='none'" style="flex:1; background:#94a3b8; color:white; border:none; padding:10px; border-radius:8px; cursor:pointer;"><i class="fas fa-times"></i> Tutup</button>
            </div>
        `;
        modal.style.display = 'flex';
    }
};

window.payroll = payroll;
