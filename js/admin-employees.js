/**
 * Portal Karyawan - Admin Employees PT. BISATANI
 * Mengelola data karyawan, gaji pokok, dan BPJS
 */

const adminEmployees = {
    employees: [],

    async init() {
        // 1. SECURITY CHECK: Jangan jalankan jika elemen tabel tidak ada di halaman ini
        const tbody = document.getElementById('employees-table-body');
        if (!tbody) return; 

        // 2. Akses Check
        const session = storage.get('session');
        if (!session || session.role !== 'admin') {
            console.warn('Akses ditolak: Bukan admin');
            return;
        }

        console.log("Admin Employees Initializing...");
        await this.loadEmployees();
        this.bindEvents();
        this.renderTable();
    },

    async loadEmployees() {
        const tbody = document.getElementById('employees-table-body');
        if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">Memuat data...</td></tr>';

        try {
            const result = await api.post({ action: 'getEmployees' });
            this.employees = result.data || [];
        } catch (error) {
            console.error('Error loading employees:', error);
            toast.error('Gagal mengambil data dari server');
        }
    },

    bindEvents() {
        // Tombol Tambah Karyawan
        const addBtn = document.getElementById('btn-add-employee');
        if (addBtn) {
            addBtn.onclick = (e) => {
                e.preventDefault();
                document.getElementById('modal-title').textContent = "Tambah Karyawan Baru";
                document.getElementById('form-employee').reset();
                document.getElementById('emp-id').value = ""; // Pastikan ID kosong
                document.getElementById('modal-employee').style.display = 'flex';
            };
        }

        // Form Submit (Tambah/Edit)
        const form = document.getElementById('form-employee');
        if (form) {
            form.onsubmit = (e) => this.handleSubmit(e);
        }
    },

    renderTable() {
        const tbody = document.getElementById('employees-table-body');
        if (!tbody) return;

        if (this.employees.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center">Belum ada data karyawan</td></tr>';
            return;
        }

        tbody.innerHTML = this.employees.map(emp => `
            <tr>
                <td>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <img src="${emp.avatar || 'https://ui-avatars.com/api/?name=' + emp.name}" style="width:35px; border-radius:50%">
                        <div>
                            <div style="font-weight:600">${emp.name}</div>
                            <small style="color:gray">${emp.email}</small>
                        </div>
                    </div>
                </td>
                <td><small>ID-${emp.id}</small></td>
                <td>${emp.position || '-'}</td>
                <td>Rp ${Number(emp.gaji_pokok || 0).toLocaleString('id-ID')}</td>
                <td>Rp ${Number(emp.bpjs || 0).toLocaleString('id-ID')}</td>
                <td>
                    <button class="btn-action edit" onclick="adminEmployees.prepareEdit('${emp.id}')" style="color: #3b82f6; border:none; background:none; cursor:pointer; padding:5px;">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action delete" onclick="adminEmployees.deleteEmployee('${emp.id}')" style="color: #ef4444; border:none; background:none; cursor:pointer; padding:5px; margin-left:10px;">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    },

    async handleSubmit(e) {
        e.preventDefault();
        
        const id = document.getElementById('emp-id').value;
        const data = {
            action: id ? 'updateEmployee' : 'addEmployee',
            id: id || null,
            name: document.getElementById('emp-name').value,
            email: document.getElementById('emp-email').value,
            position: document.getElementById('emp-position').value,
            role: document.getElementById('emp-role').value,
            gaji_pokok: document.getElementById('emp-gaji').value,
            bpjs: document.getElementById('emp-bpjs').value
        };

        toast.info("Sedang memproses...");

        try {
            const res = await api.post(data);
            if (res.success) {
                toast.success(id ? 'Data diperbarui!' : 'Karyawan ditambahkan!');
                document.getElementById('modal-employee').style.display = 'none';
                await this.loadEmployees();
                this.renderTable();
            } else {
                toast.error(res.error || 'Terjadi kesalahan');
            }
        } catch (err) {
            toast.error('Gagal menghubungi server');
        }
    },

    prepareEdit(id) {
        const emp = this.employees.find(e => String(e.id) === String(id));
        if (!emp) return;

        document.getElementById('modal-title').textContent = "Edit Data Karyawan";
        document.getElementById('emp-id').value = emp.id;
        document.getElementById('emp-name').value = emp.name;
        document.getElementById('emp-email').value = emp.email;
        document.getElementById('emp-position').value = emp.position || '';
        document.getElementById('emp-role').value = emp.role || 'employee';
        document.getElementById('emp-gaji').value = emp.gaji_pokok || 0;
        document.getElementById('emp-bpjs').value = emp.bpjs || 0;

        document.getElementById('modal-employee').style.display = 'flex';
    },

    async deleteEmployee(id) {
        if (!confirm('Hapus karyawan ini? Data login dan profil akan dihapus.')) return;

        try {
            const res = await api.post({ action: 'deleteEmployee', id: id });
            if (res.success) {
                toast.success('Karyawan berhasil dihapus');
                await this.loadEmployees();
                this.renderTable();
            }
        } catch (err) {
            toast.error('Gagal menghapus data');
        }
    }
};

// Inisialisasi global
window.initEmployees = () => adminEmployees.init();
window.adminEmployees = adminEmployees;
