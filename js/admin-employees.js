/**
 * Portal Karyawan - Admin Employees PT. BISATANI
 * Sesuai Urutan: id, name, email, department, position, status, joinDate, avatar, password, gaji_pokok, bpjs
 */
const adminEmployees = {
    employees: [],

    init() {
        const tableBody = document.getElementById('employees-table-body');
        if (!tableBody) return; 

        console.log("Admin Employees: Menggunakan urutan database terbaru...");
        this.loadEmployees();
        this.bindEvents();
    },

    async loadEmployees() {
        const tbody = document.getElementById('employees-table-body');
        if (tbody) tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;"><i class="fas fa-sync fa-spin"></i> Memuat data...</td></tr>';
        
        try {
            const result = await api.post({ action: 'getEmployees' });
            if (result.success) {
                this.employees = result.data || [];
                this.renderTable();
            }
        } catch (error) {
            console.error('Gagal memuat data karyawan:', error);
        }
    },

    bindEvents() {
        const addBtn = document.getElementById('btn-add-employee');
        if (addBtn) {
            addBtn.onclick = () => {
                const modal = document.getElementById('modal-employee');
                const form = document.getElementById('form-employee');
                if (form) form.reset();
                document.getElementById('emp-id').value = ""; // Kosongkan ID untuk data baru
                if (modal) modal.style.display = 'flex';
            };
        }

        const form = document.getElementById('form-employee');
        if (form) {
            form.onsubmit = (e) => {
                e.preventDefault();
                this.handleSubmit();
            };
        }
    },

    renderTable() {
        const tbody = document.getElementById('employees-table-body');
        if (!tbody) return;

        if (this.employees.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Belum ada data karyawan</td></tr>';
            return;
        }

        tbody.innerHTML = this.employees.map((emp, index) => `
            <tr>
                <td style="text-align:center;">${index + 1}</td>
                <td><strong>${emp.name}</strong><br><small style="color:#666;">ID: ${emp.id}</small></td>
                <td>${emp.email || '-'}</td>
                <td>${emp.department || '-'}</td>
                <td>${emp.position || '-'}</td>
                <td>Rp ${Number(emp.gaji_pokok || 0).toLocaleString('id-ID')}</td>
                <td style="text-align:center;">
                    <button class="btn-edit" onclick="adminEmployees.prepareEdit('${emp.id}')" style="background:#f59e0b; color:white; border:none; padding:6px 10px; border-radius:4px; cursor:pointer;">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-delete" onclick="adminEmployees.deleteEmployee('${emp.id}')" style="background:#ef4444; color:white; border:none; padding:6px 10px; border-radius:4px; cursor:pointer; margin-left:5px;">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    },

    async handleSubmit() {
        const btn = document.querySelector('#form-employee button[type="submit"]');
        if (btn) btn.disabled = true;

        const payload = {
            action: 'saveEmployee',
            id: document.getElementById('emp-id').value,
            name: document.getElementById('emp-name').value,
            email: document.getElementById('emp-email').value,
            department: document.getElementById('emp-dept').value, // Pastikan ID ini ada di HTML
            position: document.getElementById('emp-position').value,
            status: 'active', // Default status
            joinDate: new Date().toISOString().split('T')[0], // Tanggal hari ini
            avatar: '', // Kosongkan dulu
            password: '123', // Default password jika baru
            gaji_pokok: document.getElementById('emp-gaji').value,
            bpjs: document.getElementById('emp-bpjs').value
        };

        try {
            const res = await api.post(payload);
            if (res.success) {
                alert("Data berhasil disimpan ke database!");
                document.getElementById('modal-employee').style.display = 'none';
                this.loadEmployees();
            } else {
                alert("Gagal menyimpan: " + res.error);
            }
        } catch (e) {
            alert("Error koneksi ke server!");
        } finally {
            if (btn) btn.disabled = false;
        }
    },

    prepareEdit(id) {
        const emp = this.employees.find(e => String(e.id) === String(id));
        if (!emp) return;

        // Mapping data dari baris database ke Input Form
        document.getElementById('emp-id').value = emp.id;
        document.getElementById('emp-name').value = emp.name;
        document.getElementById('emp-email').value = emp.email;
        if(document.getElementById('emp-dept')) document.getElementById('emp-dept').value = emp.department;
        document.getElementById('emp-position').value = emp.position;
        document.getElementById('emp-gaji').value = emp.gaji_pokok;
        document.getElementById('emp-bpjs').value = emp.bpjs;

        document.getElementById('modal-employee').style.display = 'flex';
    },

    async deleteEmployee(id) {
        if (!confirm(`Hapus data karyawan dengan ID: ${id}?`)) return;
        try {
            const res = await api.post({ action: 'deleteEmployee', id: id });
            if (res.success) {
                this.loadEmployees();
            }
        } catch (e) {
            alert("Gagal menghapus data!");
        }
    }
};

window.initEmployees = () => adminEmployees.init();
window.adminEmployees = adminEmployees;
