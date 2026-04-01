/**
 * Portal Karyawan - Admin Employees PT. BISATANI
 * Versi Lengkap: Add, Edit, Delete
 */
const adminEmployees = {
    employees: [],

    init() {
        console.log("AdminEmployees: Aktif...");
        this.loadEmployees();
        this.bindEvents();
    },

    async loadEmployees() {
        const tbody = document.getElementById('employees-table-body');
        if (tbody) tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;"><i class="fas fa-sync fa-spin"></i> Memuat data...</td></tr>';

        try {
            const res = await api.post({ action: 'getEmployees' });
            if (res.success) {
                this.employees = res.data || [];
                this.renderTable();
            }
        } catch (e) { console.error(e); }
    },

    renderTable() {
        const tbody = document.getElementById('employees-table-body');
        if (!tbody) return;

        tbody.innerHTML = this.employees.map((emp, index) => `
            <tr>
                <td style="text-align:center;">${index + 1}</td>
                <td><strong>${emp.name}</strong><br><small>ID: ${emp.id}</small></td>
                <td>${emp.email || '-'}</td>
                <td>${emp.department || '-'}</td>
                <td>${emp.position || '-'}</td>
                <td>Rp ${Number(emp.gaji_pokok || 0).toLocaleString('id-ID')}</td>
                <td style="text-align:center;">
                    <button onclick="adminEmployees.prepareEdit('${emp.id}')" style="background:#f59e0b; color:white; border:none; padding:5px 8px; border-radius:4px; cursor:pointer;"><i class="fas fa-edit"></i></button>
                    <button onclick="adminEmployees.deleteEmployee('${emp.id}')" style="background:#ef4444; color:white; border:none; padding:5px 8px; border-radius:4px; cursor:pointer; margin-left:5px;"><i class="fas fa-trash"></i></button>
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
        const payload = {
            action: 'saveEmployee',
            id: document.getElementById('emp-id').value,
            name: document.getElementById('emp-name').value,
            email: document.getElementById('emp-email').value,
            department: document.getElementById('emp-dept').value,
            position: document.getElementById('emp-position').value,
            role: document.getElementById('emp-role').value,
            gaji_pokok: document.getElementById('emp-gaji').value,
            bpjs: document.getElementById('emp-bpjs').value
        };

        const res = await api.post(payload);
        if (res.success) {
            alert("Berhasil disimpan!");
            document.getElementById('modal-employee').style.display = 'none';
            this.loadEmployees();
        }
    },

    prepareEdit(id) {
        const emp = this.employees.find(e => String(e.id) === String(id));
        if (!emp) return;
        document.getElementById('emp-id').value = emp.id;
        document.getElementById('emp-name').value = emp.name;
        document.getElementById('emp-email').value = emp.email;
        document.getElementById('emp-dept').value = emp.department || '';
        document.getElementById('emp-position').value = emp.position;
        document.getElementById('emp-gaji').value = emp.gaji_pokok;
        document.getElementById('emp-bpjs').value = emp.bpjs;
        document.getElementById('modal-employee').style.display = 'flex';
    },

    // --- INI FUNGSI YANG TADI HILANG ---
    async deleteEmployee(id) {
        if (!confirm(`Hapus karyawan dengan ID ${id}? Data tidak bisa dikembalikan!`)) return;

        try {
            const res = await api.post({ 
                action: 'deleteEmployee', 
                id: id 
            });

            if (res.success) {
                alert("Karyawan berhasil dihapus!");
                this.loadEmployees(); // Refresh tabel
            } else {
                alert("Gagal menghapus: " + res.error);
            }
        } catch (e) {
            alert("Terjadi kesalahan koneksi saat menghapus.");
        }
    }
};

window.adminEmployees = adminEmployees;
