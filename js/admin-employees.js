/**
 * Portal Karyawan - Admin Employees PT. BISATANI
 * Versi Lengkap: Add, Edit, Delete + Auto Hitung Denda Telat
 */
const adminEmployees = {
    employees: [],

    init() {
        console.log("AdminEmployees: Aktif...");
        this.loadEmployees();
        this.bindEvents();
        this.setupDendaOtomatis(); // Aktifkan pendeteksi ketikan gaji
    },

    // --- FUNGSI BARU: HITUNG OTOMATIS SAAT KETIK GAJI ---
    setupDendaOtomatis() {
        const inputGaji = document.getElementById('emp-gaji');
        const inputDenda = document.getElementById('emp-denda'); // Pastikan ID di HTML adalah emp-denda

        if (inputGaji && inputDenda) {
            inputGaji.addEventListener('input', () => {
                const gaji = parseFloat(inputGaji.value) || 0;
                // Rumus PT. BISATANI: Gaji / 25 / 8 / 60
                const hasilDenda = Math.round(gaji / 25 / 8 / 60);
                inputDenda.value = hasilDenda;
            });
        }
    },

    async loadEmployees() {
        const tbody = document.getElementById('employees-table-body');
        if (tbody) tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;"><i class="fas fa-sync fa-spin"></i> Memuat data...</td></tr>';

        try {
            const res = await api.post({ action: 'getEmployees' });
            if (res.success) {
                this.employees = res.data || [];
                this.renderTable();
            }
        } catch (e) { 
            console.error("Gagal load karyawan:", e); 
        }
    },

    renderTable() {
        const tbody = document.getElementById('employees-table-body');
        if (!tbody) return;

        if (this.employees.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:20px;">Belum ada data karyawan</td></tr>';
            return;
        }

        tbody.innerHTML = this.employees.map((emp, index) => `
            <tr>
                <td style="text-align:center;">${index + 1}</td>
                <td><strong>${emp.name}</strong><br><small>ID: ${emp.id}</small></td>
                <td>${emp.email || '-'}</td>
                <td>${emp.department || '-'}</td>
                <td>${emp.position || '-'}</td>
                <td>Rp ${Number(emp.gaji_pokok || 0).toLocaleString('id-ID')}</td>
                <td style="text-align:center; color:#ef4444; font-weight:bold;">Rp ${emp.dendatelat || 0}</td>
                <td style="text-align:center;">
                    <button onclick="adminEmployees.prepareEdit('${emp.id}')" style="background:#f59e0b; color:white; border:none; padding:5px 8px; border-radius:4px; cursor:pointer;" title="Edit"><i class="fas fa-edit"></i></button>
                    <button onclick="adminEmployees.deleteEmployee('${emp.id}')" style="background:#ef4444; color:white; border:none; padding:5px 8px; border-radius:4px; cursor:pointer; margin-left:5px;" title="Hapus"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    },

    bindEvents() {
        const btnAdd = document.getElementById('btn-add-employee');
        if (btnAdd) {
            btnAdd.onclick = () => {
                document.getElementById('modal-title').textContent = "Tambah Karyawan";
                document.getElementById('form-employee').reset();
                document.getElementById('emp-id').value = "";
                document.getElementById('modal-employee').style.display = 'flex';
            };
        }

        const form = document.getElementById('form-employee');
        if (form) {
            form.onsubmit = async (e) => {
                e.preventDefault();
                await this.handleSubmit();
            };
        }
    },

    async handleSubmit() {
        const btn = document.querySelector('#form-employee button[type="submit"]');
        const originalText = btn.innerHTML;
        
        try {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';

            const payload = {
                action: 'saveEmployee',
                id: document.getElementById('emp-id').value,
                name: document.getElementById('emp-name').value,
                email: document.getElementById('emp-email').value,
                department: document.getElementById('emp-dept').value,
                position: document.getElementById('emp-position').value,
                role: document.getElementById('emp-role').value,
                gaji_pokok: document.getElementById('emp-gaji').value,
                bpjs: document.getElementById('emp-bpjs').value,
                dendatelat: document.getElementById('emp-denda').value // Kirim data denda ke server
            };

            const res = await api.post(payload);
            if (res.success) {
                alert("Berhasil disimpan!");
                document.getElementById('modal-employee').style.display = 'none';
                this.loadEmployees();
            } else {
                alert("Gagal: " + res.error);
            }
        } catch (e) {
            alert("Proses selesai. Silakan refresh tabel.");
            this.loadEmployees();
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    },

    prepareEdit(id) {
        const emp = this.employees.find(e => String(e.id) === String(id));
        if (!emp) return;
        
        document.getElementById('modal-title').textContent = "Edit Karyawan";
        document.getElementById('emp-id').value = emp.id;
        document.getElementById('emp-name').value = emp.name;
        document.getElementById('emp-email').value = emp.email;
        document.getElementById('emp-dept').value = emp.department || '';
        document.getElementById('emp-position').value = emp.position;
        document.getElementById('emp-role').value = emp.role || 'employee';
        document.getElementById('emp-gaji').value = emp.gaji_pokok;
        document.getElementById('emp-bpjs').value = emp.bpjs;
        document.getElementById('emp-denda').value = emp.dendatelat || 0; // Tampilkan denda saat edit
        document.getElementById('modal-employee').style.display = 'flex';
    },

    async deleteEmployee(id) {
        if (!confirm(`Hapus karyawan dengan ID ${id}? Data tidak bisa dikembalikan!`)) return;

        try {
            const res = await api.post({ 
                action: 'deleteEmployee', 
                id: id 
            });

            if (res.success) {
                alert("Karyawan berhasil dihapus!");
                this.loadEmployees();
            } else {
                alert("Proses hapus selesai.");
                this.loadEmployees();
            }
        } catch (e) {
            setTimeout(() => this.loadEmployees(), 1000);
        }
    }
};

window.adminEmployees = adminEmployees;
