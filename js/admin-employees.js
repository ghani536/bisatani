/**
 * Portal Karyawan - Admin Employees PT. BISATANI
 */
const adminEmployees = {
    employees: [],

    init() {
        // PROTEKSI KRUSIAL: Jika bukan halaman employees, hentikan semua proses!
        const tableBody = document.getElementById('employees-table-body');
        const modal = document.getElementById('modal-employee');
        
        if (!tableBody) {
            if (modal) modal.style.display = 'none'; // Paksa tutup modal jika nyasar
            return; 
        }

        console.log("Admin Employees Active on Employees Page");
        this.loadEmployees();
        this.bindEvents();
    },

    async loadEmployees() {
        const tbody = document.getElementById('employees-table-body');
        try {
            const result = await api.post({ action: 'getEmployees' });
            this.employees = result.data || [];
            this.renderTable();
        } catch (error) {
            toast.error('Gagal memuat data karyawan');
        }
    },

    bindEvents() {
        const addBtn = document.getElementById('btn-add-employee');
        if (addBtn) {
            addBtn.onclick = () => {
                document.getElementById('modal-title').textContent = "Tambah Karyawan Baru";
                document.getElementById('form-employee').reset();
                document.getElementById('emp-id').value = "";
                document.getElementById('modal-employee').style.display = 'flex';
            };
        }
        const form = document.getElementById('form-employee');
        if (form) form.onsubmit = (e) => this.handleSubmit(e);
    },

    renderTable() {
        const tbody = document.getElementById('employees-table-body');
        if (!tbody) return;
        tbody.innerHTML = this.employees.map(emp => `
            <tr>
                <td>${emp.name}</td>
                <td>ID-${emp.id}</td>
                <td>${emp.position}</td>
                <td>Rp ${Number(emp.gaji_pokok).toLocaleString()}</td>
                <td>Rp ${Number(emp.bpjs).toLocaleString()}</td>
                <td>
                    <button onclick="adminEmployees.prepareEdit('${emp.id}')"><i class="fas fa-edit"></i></button>
                </td>
            </tr>
        `).join('');
    },

    // ... (fungsi handleSubmit, prepareEdit, deleteEmployee tetap sama)
};

window.initEmployees = () => adminEmployees.init();
window.adminEmployees = adminEmployees;
