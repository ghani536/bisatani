/**
 * Portal Karyawan - Payroll Engine PT. BISATANI
 * Periode Gaji: Tanggal 26 (Bulan Lalu) s/d 25 (Bulan Ini)
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
        const dendaTelatPerHari = parseInt(this.config.late_rate || 0); // Bisa per menit atau per hari, di sini kita hitung per kejadian telat

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
        const totalDendaTelat = telatCount * dendaTelatPerHari;
        
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
                <td style="text-align:center;">${p.hadir}</td>
                <td style="text-align:center;">${p.lemburJam.toFixed(1)} j</td>
                <td style="color:#10b981;">+${p.bonusLembur.toLocaleString('id-ID')}</td>
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
        const data = this.calculatedData.find(d => d.id === id);
        if (!data) return;

        const modal = document.getElementById('modal-slip');
        const content = document.getElementById('slip-content');
        
        if (!modal || !content) {
            alert("Modal slip tidak ditemukan di HTML!");
            return;
        }

        const tglCetak = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

        content.innerHTML = `
            <div style="border-bottom: 1px solid #ccc; padding-bottom: 10px; margin-bottom: 10px;">
                <strong>NAMA : ${data.name}</strong><br>
                <strong>ID   : ${data.id}</strong><br>
                <span>TGL  : ${tglCetak}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <span>Gaji Pokok</span>
                <span>Rp ${data.gapok.toLocaleString('id-ID')}</span>
            </div>
            <div style="display: flex; justify-content: space-between; color: #10b981;">
                <span>Bonus Lembur (${data.lemburJam.toFixed(1)}j)</span>
                <span>+Rp ${data.bonusLembur.toLocaleString('id-ID')}</span>
            </div>
            <div style="display: flex; justify-content: space-between; color: #ef4444;">
                <span>Denda Telat (${data.telatCount}x)</span>
                <span>-Rp ${data.dendaTelat.toLocaleString('id-ID')}</span>
            </div>
            <div style="display: flex; justify-content: space-between; color: #ef4444; border-bottom: 1px solid #ccc; padding-bottom: 5px;">
                <span>Potongan BPJS</span>
                <span>-Rp ${data.bpjs.toLocaleString('id-ID')}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 16px; margin-top: 10px; background: #f0fdf4; padding: 5px;">
                <span>TOTAL GAJI</span>
                <span>Rp ${data.totalGaji.toLocaleString('id-ID')}</span>
            </div>
            <p style="text-align: center; font-size: 10px; margin-top: 20px; color: #94a3b8;">
                * Slip ini digenerate otomatis oleh sistem PT. BISATANI
            </p>
        `;

        modal.style.display = 'flex';
    }
};

// Inisialisasi
window.payroll = payroll;
document.addEventListener('DOMContentLoaded', () => {
    if (window.router && window.router.currentPage === 'payroll-reports') {
        payroll.init();
    }
});
