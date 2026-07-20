/* js/api.js - Subhan Hospital Management System - Complete API Client */

const API_BASE = 'http://localhost:3000/api';

// Input sanitization helper - prevent XSS
function sanitize(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const state = {
  patients: [],
  doctors: [],
  staff: [],
  appointments: [],
  prescriptions: [],
  medicalHistory: [],
  inventory: [],
  billing: [],
  patientsPage: 1,
  doctorsPage: 1,
  staffPage: 1,
  appointmentsPage: 1,
  prescriptionsPage: 1,
  medicalHistoryPage: 1,
  inventoryPage: 1,
  billingPage: 1,
  limit: 10
};

// ==========================================
// TOAST NOTIFICATIONS
// ==========================================
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let icon = '';
  if (type === 'success') icon = '<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>';
  else if (type === 'error') icon = '<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>';
  else icon = '<svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';

  toast.innerHTML = `${icon}<span>${message}</span>`;
  container.appendChild(toast);
  
  requestAnimationFrame(() => toast.classList.add('show'));
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ==========================================
// API CALLS
// ==========================================
async function fetchAPI(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options
    });
    if (res.status === 204) return null; // No content (DELETE success)
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || `API Error: ${res.status}`);
    return data;
  } catch (err) {
    console.error('API Error:', err);
    showToast(err.message || 'Connection error. Make sure the server is running.', 'error');
    throw err;
  }
}

// ==========================================
// MODAL MANAGEMENT
// ==========================================
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}
function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('open');
    document.body.style.overflow = '';
  }
}

// Close modal on backdrop click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-backdrop') && e.target.classList.contains('open')) {
    closeModal(e.target.id);
  }
});

// Close modal on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-backdrop.open').forEach(m => closeModal(m.id));
  }
});

// ==========================================
// CONFIRMATION MODAL
// ==========================================
let confirmCallback = null;
function openConfirmModal(message, callback) {
  const msgEl = document.getElementById('confirmMessage');
  if (msgEl) msgEl.textContent = message;
  confirmCallback = callback;
  openModal('confirmModalBackdrop');
}
document.getElementById('cancelConfirmBtn')?.addEventListener('click', () => {
  closeModal('confirmModalBackdrop');
  confirmCallback = null;
});
document.getElementById('proceedConfirmBtn')?.addEventListener('click', async () => {
  if (confirmCallback) await confirmCallback();
  closeModal('confirmModalBackdrop');
  confirmCallback = null;
});

// ==========================================
// VIEW PROFILE MODAL
// ==========================================
function viewProfile(title, dataObj) {
  const content = document.getElementById('viewModalContent');
  if (!content) return;
  
  const skipKeys = ['id', 'createdAt', 'updatedAt'];
  const fieldLabels = {
    patientId: 'Patient ID', doctorId: 'Doctor ID', staffId: 'Staff ID',
    fullName: 'Full Name', bloodGroup: 'Blood Group', admissionDate: 'Admission Date',
    assignedDoctor: 'Assigned Doctor', experienceYears: 'Experience (Years)',
    availableDays: 'Available Days', joiningDate: 'Joining Date',
    invoiceDate: 'Invoice Date', totalAmount: 'Total Amount',
    paymentStatus: 'Payment Status', paymentMethod: 'Payment Method',
    patientName: 'Patient Name', doctorName: 'Doctor Name',
    unitPrice: 'Unit Price', expiryDate: 'Expiry Date',
    visitHistory: 'Visit History', labReports: 'Lab Reports',
    patientId: 'Patient ID', prescriptions: 'Prescriptions'
  };
  
  let html = '<div style="display:grid; grid-template-columns: 1fr 1fr; gap: 1rem 2rem;">';
  for (const [key, val] of Object.entries(dataObj)) {
    if (skipKeys.includes(key)) continue;
    const label = fieldLabels[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase());
    html += `
      <div style="margin-bottom:0.5rem;">
        <div style="font-size:0.75rem; font-weight:600; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.05em; margin-bottom:0.25rem;">${label}</div>
        <div style="color:var(--text-main); font-size:0.9rem;">${val || '—'}</div>
      </div>`;
  }
  html += '</div>';
  content.innerHTML = html;
  
  const titleEl = document.querySelector('#viewModalBackdrop h3');
  if (titleEl) titleEl.textContent = title;
  openModal('viewModalBackdrop');
}
document.getElementById('closeViewModalBtn')?.addEventListener('click', () => closeModal('viewModalBackdrop'));

// ==========================================
// DASHBOARD STATS UPDATER
// ==========================================
function updateDashboardStats() {
  // Update real counts from API state
  const admittedCount = state.patients.filter(p => p.status === 'Admitted').length;
  const activeDoctors = state.doctors.filter(d => d.status === 'Active').length;
  const paidRevenue = state.billing
    .filter(b => b.paymentStatus === 'Paid')
    .reduce((sum, b) => sum + parseFloat(b.totalAmount || 0), 0);

  // Update dashboard stat elements (if the count-up target approach doesn't conflict)
  const patientsStat = document.getElementById('dashboard-patients-stat');
  if (patientsStat && !patientsStat.hasAttribute('data-animated')) {
    patientsStat.setAttribute('data-target', admittedCount);
    patientsStat.textContent = admittedCount;
  }
}

// ==========================================
// PATIENTS MODULE
// ==========================================
async function loadPatients() {
  try {
    const qSearch = document.getElementById('patientsSearchInput')?.value || '';
    const qGender = document.getElementById('patientsGenderFilter')?.value || 'All';
    const qBlood = document.getElementById('patientsBloodFilter')?.value || 'All';
    const qStatus = document.getElementById('patientsStatusFilter')?.value || 'All';
    
    let url = `/patients?_page=${state.patientsPage}&_limit=${state.limit}`;
    if (qSearch) url += `&q=${encodeURIComponent(qSearch)}`;
    if (qGender !== 'All') url += `&gender=${encodeURIComponent(qGender)}`;
    if (qBlood !== 'All') url += `&bloodGroup=${encodeURIComponent(qBlood)}`;
    if (qStatus !== 'All') url += `&status=${encodeURIComponent(qStatus)}`;

    const res = await fetch(`${API_BASE}${url}`);
    const totalCount = parseInt(res.headers.get('X-Total-Count') || '0');
    const data = await res.json();
    state.patients = data;
    renderPatientsTable(totalCount);
    populateDropdowns();
  } catch (e) {
    console.error('Load patients error:', e);
  }
}

function renderPatientsTable(totalCount) {
  const tbody = document.getElementById('patientsTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  
  if (state.patients.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="opacity:0.3;margin-bottom:0.5rem;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg><p>No patients found. Register the first patient.</p></div></td></tr>`;
  } else {
    state.patients.forEach(p => {
      const tr = document.createElement('tr');
      const badgeClass = p.status === 'Admitted' ? 'badge-success' : p.status === 'Discharged' ? 'badge-info' : 'badge-warning';
      tr.innerHTML = `
        <td><strong>${p.patientId || p.id}</strong></td>
        <td>${p.fullName || '—'}</td>
        <td>${p.age || '—'} / ${p.gender || '—'}</td>
        <td>${p.bloodGroup || '—'}</td>
        <td>${p.admissionDate || p.createdAt?.split('T')[0] || '—'}</td>
        <td><span class="badge ${badgeClass}">${p.status || 'Registered'}</span></td>
        <td>
          <div class="row-actions">
            <button class="action-btn-circle view-btn" title="View Profile">👁️</button>
            <button class="action-btn-circle edit-btn" title="Edit Patient">✏️</button>
            <button class="action-btn-circle danger del-btn" title="Delete Patient">🗑️</button>
          </div>
        </td>
      `;
      tr.querySelector('.view-btn').onclick = () => viewProfile(`${p.fullName}'s Profile`, p);
      tr.querySelector('.edit-btn').onclick = () => openPatientModal(p);
      tr.querySelector('.del-btn').onclick = () => openConfirmModal(`Delete patient "${p.fullName}"?`, async () => {
        await fetchAPI(`/patients/${p.id}`, { method: 'DELETE' });
        showToast('Patient deleted successfully', 'success');
        state.patientsPage = 1;
        loadPatients();
      });
      tbody.appendChild(tr);
    });
  }
  updatePagination('patients', totalCount);
}

document.getElementById('patientsSearchInput')?.addEventListener('input', () => { state.patientsPage = 1; loadPatients(); });
document.getElementById('patientsGenderFilter')?.addEventListener('change', () => { state.patientsPage = 1; loadPatients(); });
document.getElementById('patientsBloodFilter')?.addEventListener('change', () => { state.patientsPage = 1; loadPatients(); });
document.getElementById('patientsStatusFilter')?.addEventListener('change', () => { state.patientsPage = 1; loadPatients(); });
document.getElementById('patientsPrevPage')?.addEventListener('click', () => { if (state.patientsPage > 1) { state.patientsPage--; loadPatients(); } });
document.getElementById('patientsNextPage')?.addEventListener('click', () => { state.patientsPage++; loadPatients(); });

// Patient Form
function openPatientModal(patient = null) {
  const form = document.getElementById('patientForm');
  if (!form) return;
  form.reset();
  document.getElementById('patientModalTitle').textContent = patient ? 'Edit Patient' : 'Register Patient';
  
  if (patient) {
    document.getElementById('patientId').value = patient.id || '';
    document.getElementById('pFullName').value = patient.fullName || '';
    document.getElementById('pAge').value = patient.age || '';
    document.getElementById('pGender').value = patient.gender || 'Male';
    document.getElementById('pBlood').value = patient.bloodGroup || 'A+';
    document.getElementById('pCnic').value = patient.cnic || '';
    document.getElementById('pPhone').value = patient.phone || '';
    document.getElementById('pEmail').value = patient.email || '';
    document.getElementById('pAddress').value = patient.address || '';
    document.getElementById('pDisease').value = patient.disease || '';
    document.getElementById('pDoctor').value = patient.assignedDoctor || '';
    document.getElementById('pDate').value = patient.admissionDate || '';
    document.getElementById('pStatus').value = patient.status || 'Admitted';
  } else {
    document.getElementById('patientId').value = '';
    document.getElementById('pDate').value = new Date().toISOString().split('T')[0];
  }
  openModal('patientModalBackdrop');
}

// Wire "Register Patient" / "Register Inpatient" buttons
document.querySelectorAll('.openRegisterPatientModalBtn, .openRegisterModalBtn').forEach(btn => {
  btn.addEventListener('click', () => openPatientModal());
});
document.getElementById('closePatientModalBtn')?.addEventListener('click', () => closeModal('patientModalBackdrop'));
document.getElementById('cancelPatientBtn')?.addEventListener('click', () => closeModal('patientModalBackdrop'));

document.getElementById('patientForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('patientId').value;
  
  const fullName = document.getElementById('pFullName').value.trim();
  if (!fullName) { showToast('Patient full name is required', 'error'); return; }
  
  const payload = {
    fullName,
    age: document.getElementById('pAge').value,
    gender: document.getElementById('pGender').value,
    bloodGroup: document.getElementById('pBlood').value,
    cnic: document.getElementById('pCnic').value,
    phone: document.getElementById('pPhone').value,
    email: document.getElementById('pEmail').value,
    address: document.getElementById('pAddress').value,
    disease: document.getElementById('pDisease').value,
    assignedDoctor: document.getElementById('pDoctor').value,
    admissionDate: document.getElementById('pDate').value,
    status: document.getElementById('pStatus').value
  };

  try {
    if (id) {
      await fetchAPI(`/patients/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
      showToast('Patient updated successfully', 'success');
    } else {
      await fetchAPI('/patients', { method: 'POST', body: JSON.stringify(payload) });
      showToast('Patient registered successfully', 'success');
    }
    closeModal('patientModalBackdrop');
    state.patientsPage = 1;
    await loadPatients();
  } catch (e) { /* Toast shown in fetchAPI */ }
});


// ==========================================
// DOCTORS MODULE
// ==========================================
async function loadDoctors() {
  try {
    const qSearch = document.getElementById('doctorsSearchInput')?.value || '';
    const qDept = document.getElementById('doctorsDeptFilter')?.value || 'All';
    const qStatus = document.getElementById('doctorsAvailabilityFilter')?.value || 'All';
    
    let url = `/doctors?_page=1&_limit=100`;
    if (qSearch) url += `&q=${encodeURIComponent(qSearch)}`;
    if (qDept !== 'All') url += `&department=${encodeURIComponent(qDept)}`;
    if (qStatus !== 'All') url += `&status=${encodeURIComponent(qStatus)}`;

    const data = await fetchAPI(url);
    state.doctors = data;
    renderDoctorsTable();
    populateAppointmentsDoctorFilter();
    populateDropdowns();
  } catch (e) {
    console.error('Load doctors error:', e);
  }
}

function renderDoctorsTable() {
  const tbody = document.getElementById('doctorsTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  
  if (state.doctors.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="opacity:0.3;margin-bottom:0.5rem;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg><p>No doctors found. Add the first doctor.</p></div></td></tr>`;
  } else {
    state.doctors.forEach(d => {
      const tr = document.createElement('tr');
      let badge = 'badge-success';
      if (d.status === 'On Leave') badge = 'badge-warning';
      if (d.status === 'Inactive') badge = 'badge-danger';

      tr.innerHTML = `
        <td><strong>${d.doctorId || d.id}</strong></td>
        <td>${d.fullName || '—'}</td>
        <td>${d.department || '—'}</td>
        <td>${d.specialization || '—'}</td>
        <td>${d.shift || '—'}</td>
        <td><span class="badge ${badge}">${d.status || 'Active'}</span></td>
        <td>
          <div class="row-actions">
            <button class="action-btn-circle view-btn" title="View Profile">👁️</button>
            <button class="action-btn-circle edit-btn" title="Edit Doctor">✏️</button>
            <button class="action-btn-circle danger del-btn" title="Delete Doctor">🗑️</button>
          </div>
        </td>
      `;
      tr.querySelector('.view-btn').onclick = () => viewProfile(`Dr. ${d.fullName}`, d);
      tr.querySelector('.edit-btn').onclick = () => openDoctorModal(d);
      tr.querySelector('.del-btn').onclick = () => openConfirmModal(`Delete doctor "${d.fullName}"?`, async () => {
        await fetchAPI(`/doctors/${d.id}`, { method: 'DELETE' });
        showToast('Doctor deleted successfully', 'success');
        loadDoctors();
      });
      tbody.appendChild(tr);
    });
  }
}

document.getElementById('doctorsSearchInput')?.addEventListener('input', loadDoctors);
document.getElementById('doctorsDeptFilter')?.addEventListener('change', loadDoctors);
document.getElementById('doctorsAvailabilityFilter')?.addEventListener('change', loadDoctors);

function openDoctorModal(doc = null) {
  const form = document.getElementById('doctorForm');
  if (!form) return;
  form.reset();
  document.getElementById('doctorModalTitle').textContent = doc ? 'Edit Doctor' : 'Add Doctor';
  
  if (doc) {
    document.getElementById('doctorId').value = doc.id || '';
    document.getElementById('dFullName').value = doc.fullName || '';
    document.getElementById('dDept').value = doc.department || '';
    document.getElementById('dSpec').value = doc.specialization || '';
    document.getElementById('dQual').value = doc.qualification || '';
    document.getElementById('dExp').value = doc.experienceYears || '';
    document.getElementById('dPhone').value = doc.phone || '';
    document.getElementById('dEmail').value = doc.email || '';
    document.getElementById('dShift').value = doc.shift || '';
    document.getElementById('dDays').value = doc.availableDays || '';
    document.getElementById('dStatus').value = doc.status || 'Active';
  } else {
    document.getElementById('doctorId').value = '';
  }
  openModal('doctorModalBackdrop');
}

document.querySelector('.openAddDoctorModalBtn')?.addEventListener('click', () => openDoctorModal());
document.getElementById('closeDoctorModalBtn')?.addEventListener('click', () => closeModal('doctorModalBackdrop'));
document.getElementById('cancelDoctorBtn')?.addEventListener('click', () => closeModal('doctorModalBackdrop'));

document.getElementById('doctorForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('doctorId').value;
  
  const fullName = document.getElementById('dFullName').value.trim();
  if (!fullName) { showToast('Doctor full name is required', 'error'); return; }
  
  const payload = {
    fullName,
    department: document.getElementById('dDept').value,
    specialization: document.getElementById('dSpec').value,
    qualification: document.getElementById('dQual').value,
    experienceYears: document.getElementById('dExp').value,
    phone: document.getElementById('dPhone').value,
    email: document.getElementById('dEmail').value,
    shift: document.getElementById('dShift').value,
    availableDays: document.getElementById('dDays').value,
    status: document.getElementById('dStatus').value
  };

  try {
    if (id) {
      await fetchAPI(`/doctors/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
      showToast('Doctor updated successfully', 'success');
    } else {
      await fetchAPI('/doctors', { method: 'POST', body: JSON.stringify(payload) });
      showToast('Doctor added successfully', 'success');
    }
    closeModal('doctorModalBackdrop');
    await loadDoctors();
  } catch (e) { /* handled */ }
});

// ==========================================
// STAFF MODULE
// ==========================================
async function loadStaff() {
  try {
    const qSearch = document.getElementById('staffSearchInput')?.value || '';
    const qDept = document.getElementById('staffDeptFilter')?.value || 'All';
    const qRole = document.getElementById('staffRoleFilter')?.value || 'All';
    
    let url = `/staff?_page=1&_limit=100`;
    if (qSearch) url += `&q=${encodeURIComponent(qSearch)}`;
    if (qDept !== 'All') url += `&department=${encodeURIComponent(qDept)}`;
    if (qRole !== 'All') url += `&role=${encodeURIComponent(qRole)}`;

    const data = await fetchAPI(url);
    state.staff = data;
    renderStaffTable();
  } catch (e) {
    console.error('Load staff error:', e);
  }
}

function renderStaffTable() {
  const tbody = document.getElementById('staffTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  
  if (state.staff.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="opacity:0.3;margin-bottom:0.5rem;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"></path></svg><p>No staff found. Add the first staff member.</p></div></td></tr>`;
  } else {
    state.staff.forEach(s => {
      const tr = document.createElement('tr');
      let badge = 'badge-success';
      if (s.status === 'On Leave') badge = 'badge-warning';
      if (s.status === 'Inactive') badge = 'badge-danger';

      tr.innerHTML = `
        <td><strong>${s.staffId || s.id}</strong></td>
        <td>${s.fullName || '—'}</td>
        <td>${s.role || '—'}</td>
        <td>${s.department || '—'}</td>
        <td>${s.shift || '—'}</td>
        <td><span class="badge ${badge}">${s.status || 'Active'}</span></td>
        <td>
          <div class="row-actions">
            <button class="action-btn-circle view-btn" title="View Profile">👁️</button>
            <button class="action-btn-circle edit-btn" title="Edit Staff">✏️</button>
            <button class="action-btn-circle danger del-btn" title="Delete Staff">🗑️</button>
          </div>
        </td>
      `;
      tr.querySelector('.view-btn').onclick = () => viewProfile(`${s.fullName} (${s.role})`, s);
      tr.querySelector('.edit-btn').onclick = () => openStaffModal(s);
      tr.querySelector('.del-btn').onclick = () => openConfirmModal(`Delete staff member "${s.fullName}"?`, async () => {
        await fetchAPI(`/staff/${s.id}`, { method: 'DELETE' });
        showToast('Staff deleted successfully', 'success');
        loadStaff();
      });
      tbody.appendChild(tr);
    });
  }
}

document.getElementById('staffSearchInput')?.addEventListener('input', loadStaff);
document.getElementById('staffDeptFilter')?.addEventListener('change', loadStaff);
document.getElementById('staffRoleFilter')?.addEventListener('change', loadStaff);

function openStaffModal(s = null) {
  const form = document.getElementById('staffForm');
  if (!form) return;
  form.reset();
  document.getElementById('staffModalTitle').textContent = s ? 'Edit Staff Member' : 'Add Staff Member';
  
  if (s) {
    document.getElementById('staffId').value = s.id || '';
    document.getElementById('sFullName').value = s.fullName || '';
    document.getElementById('sRole').value = s.role || '';
    document.getElementById('sDept').value = s.department || '';
    document.getElementById('sPhone').value = s.phone || '';
    document.getElementById('sEmail').value = s.email || '';
    document.getElementById('sDate').value = s.joiningDate || '';
    document.getElementById('sShift').value = s.shift || '';
    document.getElementById('sSalary').value = s.salary || '';
    document.getElementById('sStatus').value = s.status || 'Active';
  } else {
    document.getElementById('staffId').value = '';
    document.getElementById('sDate').value = new Date().toISOString().split('T')[0];
  }
  openModal('staffModalBackdrop');
}

document.querySelector('.openAddStaffModalBtn')?.addEventListener('click', () => openStaffModal());
document.getElementById('closeStaffModalBtn')?.addEventListener('click', () => closeModal('staffModalBackdrop'));
document.getElementById('cancelStaffBtn')?.addEventListener('click', () => closeModal('staffModalBackdrop'));

document.getElementById('staffForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('staffId').value;
  
  const fullName = document.getElementById('sFullName').value.trim();
  if (!fullName) { showToast('Staff full name is required', 'error'); return; }
  
  const payload = {
    fullName,
    role: document.getElementById('sRole').value,
    department: document.getElementById('sDept').value,
    phone: document.getElementById('sPhone').value,
    email: document.getElementById('sEmail').value,
    joiningDate: document.getElementById('sDate').value,
    shift: document.getElementById('sShift').value,
    salary: document.getElementById('sSalary').value,
    status: document.getElementById('sStatus').value
  };

  try {
    if (id) {
      await fetchAPI(`/staff/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
      showToast('Staff updated successfully', 'success');
    } else {
      await fetchAPI('/staff', { method: 'POST', body: JSON.stringify(payload) });
      showToast('Staff member added successfully', 'success');
    }
    closeModal('staffModalBackdrop');
    await loadStaff();
  } catch (e) { /* handled */ }
});

// ==========================================
// PAGINATION UTILITY
// ==========================================
function updatePagination(module, total) {
  const info = document.getElementById(`${module}PageInfo`);
  const prevBtn = document.getElementById(`${module}PrevPage`);
  const nextBtn = document.getElementById(`${module}NextPage`);
  if (!info) return;

  const page = state[`${module}Page`];
  const limit = state.limit;
  const totalNum = parseInt(total) || 0;
  const start = totalNum === 0 ? 0 : (page - 1) * limit + 1;
  let end = page * limit;
  if (end > totalNum) end = totalNum;
  
  info.textContent = totalNum === 0 ? 'Showing 0 of 0' : `Showing ${start}–${end} of ${totalNum}`;

  if (prevBtn) prevBtn.disabled = page === 1;
  if (nextBtn) nextBtn.disabled = end >= totalNum;
}

// ==========================================
// DROPDOWN & AUTO-POPULATION UTILITIES
// ==========================================
function populateDropdowns() {
  const patientSelects = [
    document.getElementById('aPatient'),
    document.getElementById('prPatient'),
    document.getElementById('mhPatient'),
    document.getElementById('bPatient')
  ];

  const doctorSelects = [
    document.getElementById('aDoctor'),
    document.getElementById('prDoctor'),
    document.getElementById('bDoctor')
  ];

  patientSelects.forEach(sel => {
    if (!sel) return;
    const currentVal = sel.value;
    sel.innerHTML = '<option value="">Select Patient</option>';
    state.patients.forEach(p => {
      sel.innerHTML += `<option value="${p.id}" data-name="${p.fullName}">${p.fullName} (${p.patientId || p.id})</option>`;
    });
    if (currentVal) sel.value = currentVal;
  });

  doctorSelects.forEach(sel => {
    if (!sel) return;
    const currentVal = sel.value;
    sel.innerHTML = '<option value="">Select Doctor</option>';
    state.doctors.forEach(d => {
      sel.innerHTML += `<option value="${d.id}" data-name="${d.fullName}" data-dept="${d.department}">${d.fullName} (${d.specialization || d.department})</option>`;
    });
    if (currentVal) sel.value = currentVal;
  });
}

function populateAppointmentsDoctorFilter() {
  const docFilter = document.getElementById('appointmentsDoctorFilter');
  if (!docFilter) return;
  const currentVal = docFilter.value;
  docFilter.innerHTML = '<option value="All">All Doctors</option>';
  state.doctors.forEach(d => {
    docFilter.innerHTML += `<option value="${d.id}">${d.fullName}</option>`;
  });
  if (currentVal) docFilter.value = currentVal;
}

// Doctor auto-fill department
document.getElementById('aDoctor')?.addEventListener('change', (e) => {
  const selectedOption = e.target.options[e.target.selectedIndex];
  const dept = selectedOption ? selectedOption.getAttribute('data-dept') : '';
  const aDept = document.getElementById('aDept');
  if (aDept) aDept.value = dept || '';
});

// Dynamic Bill Calculation Helper
function parseAndCalculateTotalBill() {
  const servicesText = document.getElementById('bServices')?.value || '';
  const medicinesText = document.getElementById('bMedicines')?.value || '';
  
  let total = 0;
  const sumCosts = (text) => {
    let sum = 0;
    const lines = text.split(',');
    lines.forEach(line => {
      const match = line.match(/:?\s*\$?(\d+(?:\.\d+)?)/);
      if (match) sum += parseFloat(match[1]);
    });
    return sum;
  };
  
  total += sumCosts(servicesText);
  total += sumCosts(medicinesText);
  
  const bTotalAmount = document.getElementById('bTotalAmount');
  if (bTotalAmount) bTotalAmount.value = total.toFixed(2);
}
document.getElementById('bServices')?.addEventListener('input', parseAndCalculateTotalBill);
document.getElementById('bMedicines')?.addEventListener('input', parseAndCalculateTotalBill);

// ==========================================
// APPOINTMENTS MODULE
// ==========================================
async function loadAppointments() {
  try {
    const qSearch = document.getElementById('appointmentsSearchInput')?.value || '';
    const qDate = document.getElementById('appointmentsDateFilter')?.value || '';
    const qDoctor = document.getElementById('appointmentsDoctorFilter')?.value || 'All';
    const qStatus = document.getElementById('appointmentsStatusFilter')?.value || 'All';
    const qSort = document.getElementById('appointmentsSortFilter')?.value || 'date-desc';
    
    let data = await fetchAPI('/appointments');
    state.appointments = data;
    
    if (qSearch) {
      const searchLower = qSearch.toLowerCase();
      data = data.filter(a => 
        a.id?.toLowerCase().includes(searchLower) ||
        a.patientName?.toLowerCase().includes(searchLower) ||
        a.doctorName?.toLowerCase().includes(searchLower)
      );
    }
    if (qDate) data = data.filter(a => a.date === qDate);
    if (qDoctor !== 'All') data = data.filter(a => a.doctorId === qDoctor);
    if (qStatus !== 'All') data = data.filter(a => a.status === qStatus);
    
    if (qSort === 'date-asc') data.sort((a, b) => new Date(a.date) - new Date(b.date));
    else if (qSort === 'date-desc') data.sort((a, b) => new Date(b.date) - new Date(a.date));
    else if (qSort === 'time-asc') data.sort((a, b) => (a.time || '').localeCompare(b.time || ''));
    else if (qSort === 'time-desc') data.sort((a, b) => (b.time || '').localeCompare(a.time || ''));
    
    const totalCount = data.length;
    const page = state.appointmentsPage;
    const limit = state.limit;
    const start = (page - 1) * limit;
    data = data.slice(start, start + limit);
    
    renderAppointmentsTable(data, totalCount);
  } catch (e) {
    console.error('Load appointments error:', e);
  }
}

function renderAppointmentsTable(appointments, totalCount) {
  const tbody = document.getElementById('appointmentsTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  
  if (appointments.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="opacity:0.3;margin-bottom:0.5rem;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg><p>No appointments found. Book the first appointment.</p></div></td></tr>`;
  } else {
    appointments.forEach(a => {
      const tr = document.createElement('tr');
      let badgeClass = 'badge-info';
      if (a.status === 'Completed') badgeClass = 'badge-success';
      if (a.status === 'Cancelled') badgeClass = 'badge-danger';
      
      tr.innerHTML = `
        <td><strong>${a.id}</strong></td>
        <td>${a.patientName || '—'}</td>
        <td>${a.doctorName || '—'}</td>
        <td>${a.department || '—'}</td>
        <td>${a.date || '—'}</td>
        <td>${a.time || '—'}</td>
        <td><span class="badge ${badgeClass}">${a.status || 'Scheduled'}</span></td>
        <td>
          <div class="row-actions">
            <button class="action-btn-circle view-btn" title="View Details">👁️</button>
            <button class="action-btn-circle edit-btn" title="Edit Appointment">✏️</button>
            <button class="action-btn-circle danger del-btn" title="Delete Appointment">🗑️</button>
          </div>
        </td>
      `;
      tr.querySelector('.view-btn').onclick = () => viewProfile(`Appointment (${a.id})`, a);
      tr.querySelector('.edit-btn').onclick = () => openAppointmentModal(a);
      tr.querySelector('.del-btn').onclick = () => openConfirmModal(`Delete appointment ${a.id}?`, async () => {
        await fetchAPI(`/appointments/${a.id}`, { method: 'DELETE' });
        showToast('Appointment deleted', 'success');
        loadAppointments();
      });
      tbody.appendChild(tr);
    });
  }
  updatePagination('appointments', totalCount);
}

function openAppointmentModal(appt = null) {
  populateDropdowns();
  const form = document.getElementById('appointmentForm');
  if (!form) return;
  form.reset();
  document.getElementById('appointmentModalTitle').textContent = appt ? 'Edit Appointment' : 'Book Appointment';
  
  if (appt) {
    document.getElementById('appointmentId').value = appt.id || '';
    document.getElementById('aPatient').value = appt.patientId || '';
    document.getElementById('aDoctor').value = appt.doctorId || '';
    document.getElementById('aDept').value = appt.department || '';
    document.getElementById('aDate').value = appt.date || '';
    document.getElementById('aTime').value = appt.time || '';
    document.getElementById('aStatus').value = appt.status || 'Scheduled';
    document.getElementById('aNotes').value = appt.notes || '';
  } else {
    document.getElementById('appointmentId').value = '';
    document.getElementById('aDate').value = new Date().toISOString().split('T')[0];
  }
  openModal('appointmentModalBackdrop');
}

document.getElementById('appointmentForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('appointmentId').value;
  const pSelect = document.getElementById('aPatient');
  const dSelect = document.getElementById('aDoctor');
  
  const patientId = pSelect.value;
  const patientName = pSelect.options[pSelect.selectedIndex]?.getAttribute('data-name') || '';
  const doctorId = dSelect.value;
  const doctorName = dSelect.options[dSelect.selectedIndex]?.getAttribute('data-name') || '';
  
  if (!patientId || !doctorId) {
    showToast('Please select a patient and a doctor', 'error');
    return;
  }
  
  const payload = {
    patientId, patientName, doctorId, doctorName,
    department: document.getElementById('aDept').value,
    date: document.getElementById('aDate').value,
    time: document.getElementById('aTime').value,
    status: document.getElementById('aStatus').value,
    notes: document.getElementById('aNotes').value
  };
  
  try {
    if (id) {
      await fetchAPI(`/appointments/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
      showToast('Appointment updated successfully', 'success');
    } else {
      await fetchAPI('/appointments', { method: 'POST', body: JSON.stringify(payload) });
      showToast('Appointment booked successfully', 'success');
    }
    closeModal('appointmentModalBackdrop');
    loadAppointments();
  } catch (e) { /* handled */ }
});

// ==========================================
// PRESCRIPTIONS MODULE
// ==========================================
async function loadPrescriptions() {
  try {
    const qSearch = document.getElementById('prescriptionsSearchInput')?.value || '';
    let data = await fetchAPI('/prescriptions');
    state.prescriptions = data;
    
    if (qSearch) {
      const searchLower = qSearch.toLowerCase();
      data = data.filter(p => 
        p.id?.toLowerCase().includes(searchLower) ||
        p.patientName?.toLowerCase().includes(searchLower) ||
        p.doctorName?.toLowerCase().includes(searchLower) ||
        p.diagnosis?.toLowerCase().includes(searchLower)
      );
    }
    
    const totalCount = data.length;
    const page = state.prescriptionsPage;
    const start = (page - 1) * state.limit;
    data = data.slice(start, start + state.limit);
    
    renderPrescriptionsTable(data, totalCount);
  } catch (e) {
    console.error('Load prescriptions error:', e);
  }
}

function renderPrescriptionsTable(prescriptions, totalCount) {
  const tbody = document.getElementById('prescriptionsTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  
  if (prescriptions.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="opacity:0.3;margin-bottom:0.5rem;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg><p>No prescriptions found.</p></div></td></tr>`;
  } else {
    prescriptions.forEach(p => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${p.id}</strong></td>
        <td>${p.patientName || '—'}</td>
        <td>${p.doctorName || '—'}</td>
        <td>${p.diagnosis || '—'}</td>
        <td style="max-width:150px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${p.medicines || ''}">${p.medicines || '—'}</td>
        <td>${p.date || '—'}</td>
        <td>
          <div class="row-actions">
            <button class="action-btn-circle view-btn" title="View Prescription">👁️</button>
            <button class="action-btn-circle edit-btn" title="Edit Prescription">✏️</button>
            <button class="action-btn-circle danger del-btn" title="Delete Prescription">🗑️</button>
          </div>
        </td>
      `;
      tr.querySelector('.view-btn').onclick = () => viewProfile(`Prescription (${p.id})`, p);
      tr.querySelector('.edit-btn').onclick = () => openPrescriptionModal(p);
      tr.querySelector('.del-btn').onclick = () => openConfirmModal(`Delete prescription ${p.id}?`, async () => {
        await fetchAPI(`/prescriptions/${p.id}`, { method: 'DELETE' });
        showToast('Prescription deleted', 'success');
        loadPrescriptions();
      });
      tbody.appendChild(tr);
    });
  }
  updatePagination('prescriptions', totalCount);
}

function openPrescriptionModal(p = null) {
  populateDropdowns();
  const form = document.getElementById('prescriptionForm');
  if (!form) return;
  form.reset();
  document.getElementById('prescriptionModalTitle').textContent = p ? 'Edit Prescription' : 'Write Prescription';
  
  if (p) {
    document.getElementById('prescriptionId').value = p.id || '';
    document.getElementById('prPatient').value = p.patientId || '';
    document.getElementById('prDoctor').value = p.doctorId || '';
    document.getElementById('prDiagnosis').value = p.diagnosis || '';
    document.getElementById('prMedicines').value = p.medicines || '';
    document.getElementById('prDosage').value = p.dosage || '';
    document.getElementById('prDuration').value = p.duration || '';
    document.getElementById('prDate').value = p.date || '';
    document.getElementById('prNotes').value = p.notes || '';
  } else {
    document.getElementById('prescriptionId').value = '';
    document.getElementById('prDate').value = new Date().toISOString().split('T')[0];
  }
  openModal('prescriptionModalBackdrop');
}

document.getElementById('prescriptionForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('prescriptionId').value;
  const pSelect = document.getElementById('prPatient');
  const dSelect = document.getElementById('prDoctor');
  
  const patientId = pSelect.value;
  const patientName = pSelect.options[pSelect.selectedIndex]?.getAttribute('data-name') || '';
  const doctorId = dSelect.value;
  const doctorName = dSelect.options[dSelect.selectedIndex]?.getAttribute('data-name') || '';
  
  if (!patientId || !doctorId) { showToast('Please select a patient and a doctor', 'error'); return; }
  
  const payload = {
    patientId, patientName, doctorId, doctorName,
    diagnosis: document.getElementById('prDiagnosis').value,
    medicines: document.getElementById('prMedicines').value,
    dosage: document.getElementById('prDosage').value,
    duration: document.getElementById('prDuration').value,
    date: document.getElementById('prDate').value,
    notes: document.getElementById('prNotes').value
  };
  
  try {
    if (id) {
      await fetchAPI(`/prescriptions/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
      showToast('Prescription updated', 'success');
    } else {
      await fetchAPI('/prescriptions', { method: 'POST', body: JSON.stringify(payload) });
      showToast('Prescription saved', 'success');
    }
    closeModal('prescriptionModalBackdrop');
    loadPrescriptions();
  } catch (e) { /* handled */ }
});

// ==========================================
// MEDICAL HISTORY MODULE
// ==========================================
async function loadMedicalHistory() {
  try {
    const qSearch = document.getElementById('medicalHistorySearchInput')?.value || '';
    let data = await fetchAPI('/medical-history');
    state.medicalHistory = data;
    
    if (qSearch) {
      const searchLower = qSearch.toLowerCase();
      data = data.filter(mh => 
        mh.id?.toLowerCase().includes(searchLower) ||
        mh.patientName?.toLowerCase().includes(searchLower) ||
        mh.diseases?.toLowerCase().includes(searchLower) ||
        mh.allergies?.toLowerCase().includes(searchLower)
      );
    }
    
    const totalCount = data.length;
    const page = state.medicalHistoryPage;
    const start = (page - 1) * state.limit;
    data = data.slice(start, start + state.limit);
    
    renderMedicalHistoryTable(data, totalCount);
  } catch (e) {
    console.error('Load medical history error:', e);
  }
}

function renderMedicalHistoryTable(historyList, totalCount) {
  const tbody = document.getElementById('medicalHistoryTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  
  if (historyList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="opacity:0.3;margin-bottom:0.5rem;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg><p>No medical records found.</p></div></td></tr>`;
  } else {
    historyList.forEach(mh => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${mh.id}</strong></td>
        <td>${mh.patientName || '—'}</td>
        <td style="max-width:150px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${mh.diseases || ''}">${mh.diseases || '—'}</td>
        <td style="max-width:120px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${mh.allergies || '—'}</td>
        <td style="max-width:150px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${mh.surgeries || '—'}</td>
        <td>
          <div class="row-actions">
            <button class="action-btn-circle view-btn" title="View Full Details">👁️</button>
            <button class="action-btn-circle edit-btn" title="Edit Medical Record">✏️</button>
            <button class="action-btn-circle danger del-btn" title="Delete Medical Record">🗑️</button>
          </div>
        </td>
      `;
      tr.querySelector('.view-btn').onclick = () => viewProfile(`Medical Record (${mh.id})`, mh);
      tr.querySelector('.edit-btn').onclick = () => openMedicalHistoryModal(mh);
      tr.querySelector('.del-btn').onclick = () => openConfirmModal(`Delete medical record ${mh.id}?`, async () => {
        await fetchAPI(`/medical-history/${mh.id}`, { method: 'DELETE' });
        showToast('Medical record deleted', 'success');
        loadMedicalHistory();
      });
      tbody.appendChild(tr);
    });
  }
  updatePagination('medicalHistory', totalCount);
}

function openMedicalHistoryModal(mh = null) {
  populateDropdowns();
  const form = document.getElementById('medicalHistoryForm');
  if (!form) return;
  form.reset();
  document.getElementById('medicalHistoryModalTitle').textContent = mh ? 'Edit Medical History' : 'Add Medical History';
  
  if (mh) {
    document.getElementById('medicalHistoryId').value = mh.id || '';
    document.getElementById('mhPatient').value = mh.patientId || '';
    document.getElementById('mhDiseases').value = mh.diseases || '';
    document.getElementById('mhAllergies').value = mh.allergies || '';
    document.getElementById('mhSurgeries').value = mh.surgeries || '';
    document.getElementById('mhLabReports').value = mh.labReports || '';
    document.getElementById('mhPrescriptions').value = mh.prescriptions || '';
    document.getElementById('mhVisitHistory').value = mh.visitHistory || '';
  } else {
    document.getElementById('medicalHistoryId').value = '';
  }
  openModal('medicalHistoryModalBackdrop');
}

document.getElementById('medicalHistoryForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('medicalHistoryId').value;
  const pSelect = document.getElementById('mhPatient');
  
  const patientId = pSelect.value;
  const patientName = pSelect.options[pSelect.selectedIndex]?.getAttribute('data-name') || '';
  
  if (!patientId) { showToast('Please select a patient', 'error'); return; }
  
  const payload = {
    patientId, patientName,
    diseases: document.getElementById('mhDiseases').value,
    allergies: document.getElementById('mhAllergies').value,
    surgeries: document.getElementById('mhSurgeries').value,
    labReports: document.getElementById('mhLabReports').value,
    prescriptions: document.getElementById('mhPrescriptions').value,
    visitHistory: document.getElementById('mhVisitHistory').value
  };
  
  try {
    if (id) {
      await fetchAPI(`/medical-history/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
      showToast('Medical record updated', 'success');
    } else {
      await fetchAPI('/medical-history', { method: 'POST', body: JSON.stringify(payload) });
      showToast('Medical record saved', 'success');
    }
    closeModal('medicalHistoryModalBackdrop');
    loadMedicalHistory();
  } catch (e) { /* handled */ }
});

// ==========================================
// INVENTORY MODULE
// ==========================================
async function loadInventory() {
  try {
    const qSearch = document.getElementById('inventorySearchInput')?.value || '';
    const qCategory = document.getElementById('inventoryCategoryFilter')?.value || 'All';
    const qStatus = document.getElementById('inventoryStatusFilter')?.value || 'All';
    
    let data = await fetchAPI('/inventory');
    state.inventory = data;
    
    if (qSearch) {
      const searchLower = qSearch.toLowerCase();
      data = data.filter(i => 
        i.name?.toLowerCase().includes(searchLower) ||
        i.id?.toLowerCase().includes(searchLower) ||
        i.supplier?.toLowerCase().includes(searchLower)
      );
    }
    if (qCategory !== 'All') data = data.filter(i => i.category === qCategory);
    if (qStatus !== 'All') {
      data = data.filter(i => {
        const qty = parseInt(i.quantity);
        const calculatedStatus = qty <= 0 ? 'Out of Stock' : (qty < 10 ? 'Low Stock' : 'In Stock');
        return calculatedStatus === qStatus;
      });
    }
    
    const totalCount = data.length;
    const page = state.inventoryPage;
    const start = (page - 1) * state.limit;
    data = data.slice(start, start + state.limit);
    
    renderInventoryTable(data, totalCount);
  } catch (e) {
    console.error('Load inventory error:', e);
  }
}

function renderInventoryTable(items, totalCount) {
  const tbody = document.getElementById('inventoryTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  
  if (items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9"><div class="empty-state"><svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="opacity:0.3;margin-bottom:0.5rem;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg><p>No inventory items found.</p></div></td></tr>`;
  } else {
    items.forEach(i => {
      const tr = document.createElement('tr');
      const qty = parseInt(i.quantity);
      let status = 'In Stock';
      let badge = 'badge-success';
      if (qty <= 0) { status = 'Out of Stock'; badge = 'badge-danger'; }
      else if (qty < 10) { status = 'Low Stock'; badge = 'badge-warning'; }
      
      tr.innerHTML = `
        <td><strong>${i.id}</strong></td>
        <td>${i.name || '—'}</td>
        <td>${i.category || '—'}</td>
        <td><strong style="color:${qty <= 0 ? 'var(--color-danger)' : qty < 10 ? 'var(--color-warning)' : 'inherit'}">${i.quantity}</strong></td>
        <td>${i.supplier || '—'}</td>
        <td>$${parseFloat(i.unitPrice || 0).toFixed(2)}</td>
        <td>${i.expiryDate || '—'}</td>
        <td><span class="badge ${badge}">${status}</span></td>
        <td>
          <div class="row-actions">
            <button class="action-btn-circle view-btn" title="View Details">👁️</button>
            <button class="action-btn-circle edit-btn" title="Edit Item">✏️</button>
            <button class="action-btn-circle danger del-btn" title="Delete Item">🗑️</button>
          </div>
        </td>
      `;
      tr.querySelector('.view-btn').onclick = () => viewProfile(`${i.name} Details`, i);
      tr.querySelector('.edit-btn').onclick = () => openInventoryModal(i);
      tr.querySelector('.del-btn').onclick = () => openConfirmModal(`Delete inventory item "${i.name}"?`, async () => {
        await fetchAPI(`/inventory/${i.id}`, { method: 'DELETE' });
        showToast('Inventory item deleted', 'success');
        loadInventory();
      });
      tbody.appendChild(tr);
    });
  }
  updatePagination('inventory', totalCount);
}

function openInventoryModal(i = null) {
  const form = document.getElementById('inventoryForm');
  if (!form) return;
  form.reset();
  document.getElementById('inventoryModalTitle').textContent = i ? 'Edit Inventory Item' : 'Add Inventory Item';
  
  if (i) {
    document.getElementById('inventoryId').value = i.id || '';
    document.getElementById('iName').value = i.name || '';
    document.getElementById('iCategory').value = i.category || 'Medicine';
    document.getElementById('iQuantity').value = i.quantity || '';
    document.getElementById('iSupplier').value = i.supplier || '';
    document.getElementById('iUnitPrice').value = i.unitPrice || '';
    document.getElementById('iExpiryDate').value = i.expiryDate || '';
  } else {
    document.getElementById('inventoryId').value = '';
  }
  openModal('inventoryModalBackdrop');
}

document.getElementById('inventoryForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('inventoryId').value;
  const qty = parseInt(document.getElementById('iQuantity').value);
  const itemName = document.getElementById('iName').value.trim();
  
  if (!itemName) { showToast('Item name is required', 'error'); return; }
  
  let status = 'In Stock';
  if (qty <= 0) status = 'Out of Stock';
  else if (qty < 10) status = 'Low Stock';
  
  const payload = {
    name: itemName,
    category: document.getElementById('iCategory').value,
    quantity: qty,
    supplier: document.getElementById('iSupplier').value,
    unitPrice: parseFloat(document.getElementById('iUnitPrice').value || 0),
    expiryDate: document.getElementById('iExpiryDate').value,
    status
  };
  
  try {
    if (id) {
      await fetchAPI(`/inventory/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
      showToast('Inventory item updated', 'success');
    } else {
      await fetchAPI('/inventory', { method: 'POST', body: JSON.stringify(payload) });
      showToast('Inventory item added', 'success');
    }
    closeModal('inventoryModalBackdrop');
    loadInventory();
  } catch (e) { /* handled */ }
});

// ==========================================
// BILLING MODULE
// ==========================================
async function loadBilling() {
  try {
    const qSearch = document.getElementById('billingSearchInput')?.value || '';
    const qStatus = document.getElementById('billingStatusFilter')?.value || 'All';
    const qPayment = document.getElementById('billingPaymentFilter')?.value || 'All';
    
    let data = await fetchAPI('/billing');
    state.billing = data;
    
    if (qSearch) {
      const searchLower = qSearch.toLowerCase();
      data = data.filter(b => 
        b.id?.toLowerCase().includes(searchLower) ||
        b.patientName?.toLowerCase().includes(searchLower) ||
        b.patientId?.toLowerCase().includes(searchLower)
      );
    }
    if (qStatus !== 'All') data = data.filter(b => b.paymentStatus === qStatus);
    if (qPayment !== 'All') data = data.filter(b => b.paymentMethod === qPayment);
    
    // Calculate totals from all billing (not filtered for summary)
    let paidTotal = 0;
    let unpaidTotal = 0;
    state.billing.forEach(b => {
      if (b.paymentStatus === 'Paid') paidTotal += parseFloat(b.totalAmount || 0);
      else unpaidTotal += parseFloat(b.totalAmount || 0);
    });
    
    const receiptsEl = document.getElementById('billingTotalReceipts');
    const unpaidEl = document.getElementById('billingUnpaidClaims');
    if (receiptsEl) receiptsEl.textContent = `$${paidTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    if (unpaidEl) unpaidEl.textContent = `$${unpaidTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    
    const totalCount = data.length;
    const page = state.billingPage;
    const start = (page - 1) * state.limit;
    data = data.slice(start, start + state.limit);
    
    renderBillingTable(data, totalCount);
  } catch (e) {
    console.error('Load billing error:', e);
  }
}

function renderBillingTable(bills, totalCount) {
  const tbody = document.getElementById('billingTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';
  
  if (bills.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10"><div class="empty-state"><svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="opacity:0.3;margin-bottom:0.5rem;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg><p>No billing records found.</p></div></td></tr>`;
  } else {
    bills.forEach(b => {
      const tr = document.createElement('tr');
      let statusBadge = 'badge-success';
      if (b.paymentStatus === 'Unpaid') statusBadge = 'badge-danger';
      if (b.paymentStatus === 'Pending') statusBadge = 'badge-warning';
      
      tr.innerHTML = `
        <td><strong>${b.id}</strong></td>
        <td>${b.patientName || '—'}</td>
        <td>${b.doctorName || '—'}</td>
        <td style="max-width:150px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${b.services || ''}">${b.services || '—'}</td>
        <td style="max-width:150px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${b.medicines || ''}">${b.medicines || '—'}</td>
        <td><strong>$${parseFloat(b.totalAmount || 0).toFixed(2)}</strong></td>
        <td>${b.paymentMethod || '—'}</td>
        <td><span class="badge ${statusBadge}">${b.paymentStatus || '—'}</span></td>
        <td>${b.invoiceDate || '—'}</td>
        <td>
          <div class="row-actions">
            <button class="action-btn-circle view-btn" title="View Print Invoice">🧾</button>
            <button class="action-btn-circle edit-btn" title="Edit Invoice">✏️</button>
            <button class="action-btn-circle danger del-btn" title="Delete Invoice">🗑️</button>
          </div>
        </td>
      `;
      tr.querySelector('.view-btn').onclick = () => openInvoicePrintModal(b);
      tr.querySelector('.edit-btn').onclick = () => openBillingModal(b);
      tr.querySelector('.del-btn').onclick = () => openConfirmModal(`Delete invoice ${b.id}?`, async () => {
        await fetchAPI(`/billing/${b.id}`, { method: 'DELETE' });
        showToast('Invoice deleted', 'success');
        loadBilling();
      });
      tbody.appendChild(tr);
    });
  }
  updatePagination('billing', totalCount);
}

function openBillingModal(b = null) {
  populateDropdowns();
  const form = document.getElementById('billingForm');
  if (!form) return;
  form.reset();
  document.getElementById('billingModalTitle').textContent = b ? 'Edit Invoice' : 'Create Invoice';
  
  if (b) {
    document.getElementById('billId').value = b.id || '';
    document.getElementById('bPatient').value = b.patientId || '';
    document.getElementById('bDoctor').value = b.doctorId || '';
    document.getElementById('bServices').value = b.services || '';
    document.getElementById('bMedicines').value = b.medicines || '';
    document.getElementById('bTotalAmount').value = b.totalAmount || '';
    document.getElementById('bMethod').value = b.paymentMethod || 'Cash';
    document.getElementById('bStatus').value = b.paymentStatus || 'Paid';
    document.getElementById('bDate').value = b.invoiceDate || '';
  } else {
    document.getElementById('billId').value = '';
    document.getElementById('bDate').value = new Date().toISOString().split('T')[0];
  }
  openModal('billingModalBackdrop');
}

document.getElementById('billingForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('billId').value;
  const pSelect = document.getElementById('bPatient');
  const dSelect = document.getElementById('bDoctor');
  
  const patientId = pSelect.value;
  const patientName = pSelect.options[pSelect.selectedIndex]?.getAttribute('data-name') || '';
  const doctorId = dSelect.value;
  const doctorName = dSelect.options[dSelect.selectedIndex]?.getAttribute('data-name') || '';
  
  if (!patientId || !doctorId) { showToast('Please select a patient and a doctor', 'error'); return; }
  
  const payload = {
    patientId, patientName, doctorId, doctorName,
    services: document.getElementById('bServices').value,
    medicines: document.getElementById('bMedicines').value,
    totalAmount: parseFloat(document.getElementById('bTotalAmount').value || 0),
    paymentMethod: document.getElementById('bMethod').value,
    paymentStatus: document.getElementById('bStatus').value,
    invoiceDate: document.getElementById('bDate').value
  };
  
  try {
    if (id) {
      await fetchAPI(`/billing/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
      showToast('Invoice updated', 'success');
    } else {
      await fetchAPI('/billing', { method: 'POST', body: JSON.stringify(payload) });
      showToast('Invoice generated', 'success');
    }
    closeModal('billingModalBackdrop');
    loadBilling();
  } catch (e) { /* handled */ }
});

// Invoice Print Modal
function openInvoicePrintModal(bill) {
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val || '—'; };
  set('printBillId', bill.id);
  set('printInvoiceDate', bill.invoiceDate);
  set('printPatientName', bill.patientName);
  set('printPatientId', bill.patientId);
  set('printDoctorName', bill.doctorName);
  set('printPaymentMethod', bill.paymentMethod);
  set('printPaymentStatus', bill.paymentStatus);
  set('printTotalAmount', `$${parseFloat(bill.totalAmount || 0).toFixed(2)}`);
  
  const tbody = document.getElementById('printInvoiceItems');
  if (!tbody) return;
  tbody.innerHTML = '';
  
  const parseRows = (text, category) => {
    if (!text) return;
    text.split(',').forEach(line => {
      const parts = line.split(':');
      const desc = parts[0]?.trim() || category;
      const valStr = parts[1]?.trim() || '';
      const match = valStr.match(/\$?(\d+(?:\.\d+)?)/);
      const val = match ? parseFloat(match[1]) : 0;
      const tr = document.createElement('tr');
      tr.innerHTML = `<td style="padding:0.5rem;border:1px solid #ddd;">${desc}</td><td style="padding:0.5rem;border:1px solid #ddd;text-align:right;">$${val.toFixed(2)}</td>`;
      tbody.appendChild(tr);
    });
  };
  
  parseRows(bill.services, 'Service Fee');
  parseRows(bill.medicines, 'Medicine');
  
  openModal('invoiceViewModalBackdrop');
}

// ==========================================
// REPORTS MODULE (loadReports)
// ==========================================
async function loadReports() {
  try {
    const data = await fetchAPI('/reports');
    if (!data) return;
    
    const { summary, financials, appointments, inventory, patients, departments } = data;
    
    // Summary stats
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('rptTotalPatients', summary.totalPatients);
    set('rptActiveDoctors', summary.activeDoctors);
    set('rptTotalStaff', summary.totalStaff);
    set('rptTotalAppointments', summary.totalAppointments);
    set('rptTotalPrescriptions', summary.totalPrescriptions);
    set('rptTotalInventory', summary.totalInventoryItems);
    set('rptTotalRevenue', `$${financials.totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
    set('rptPendingAmount', `$${(financials.pendingAmount + financials.unpaidAmount).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
    
    // Financial summary
    set('finRevenue', `$${financials.totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
    set('finPending', `$${financials.pendingAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
    set('finUnpaid', `$${financials.unpaidAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
    set('finTotal', `$${financials.totalBilled.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
    
    // Collection rate
    const collectionRate = financials.totalBilled > 0 ? Math.round((financials.totalRevenue / financials.totalBilled) * 100) : 0;
    set('finCollectionRate', `Collection Rate: ${collectionRate}%`);
    const finProgress = document.getElementById('finProgressBar');
    if (finProgress) finProgress.style.width = `${collectionRate}%`;
    
    // Appointment donut chart
    const totalAppts = (appointments.Scheduled || 0) + (appointments.Completed || 0) + (appointments.Cancelled || 0);
    const circumference = 238.76;
    set('apptDonutTotal', totalAppts);
    set('legendScheduled', appointments.Scheduled || 0);
    set('legendCompleted', appointments.Completed || 0);
    set('legendCancelled', appointments.Cancelled || 0);
    
    // Animate donut segments
    const scheduledPct = totalAppts > 0 ? (appointments.Scheduled / totalAppts) : 0;
    const completedPct = totalAppts > 0 ? (appointments.Completed / totalAppts) : 0;
    const cancelledPct = totalAppts > 0 ? (appointments.Cancelled / totalAppts) : 0;
    
    const scheduledLen = scheduledPct * circumference;
    const completedLen = completedPct * circumference;
    const cancelledLen = cancelledPct * circumference;
    
    const apptS = document.getElementById('apptDonutScheduled');
    const apptC = document.getElementById('apptDonutCompleted');
    const apptX = document.getElementById('apptDonutCancelled');
    
    if (apptS) { apptS.setAttribute('stroke-dasharray', `${scheduledLen} ${circumference}`); apptS.setAttribute('transform', 'rotate(-90 50 50)'); }
    if (apptC) { apptC.setAttribute('stroke-dasharray', `${completedLen} ${circumference}`); apptC.setAttribute('transform', `rotate(${-90 + (scheduledPct * 360)} 50 50)`); }
    if (apptX) { apptX.setAttribute('stroke-dasharray', `${cancelledLen} ${circumference}`); apptX.setAttribute('transform', `rotate(${-90 + ((scheduledPct + completedPct) * 360)} 50 50)`); }
    
    // Inventory status bars
    const totalInv = (inventory.inStock || 0) + (inventory.lowStock || 0) + (inventory.outOfStock || 0);
    const invPct = (n) => totalInv > 0 ? Math.round((n / totalInv) * 100) : 0;
    
    const setBar = (barId, countId, count, total) => {
      const bar = document.getElementById(barId);
      const cnt = document.getElementById(countId);
      if (bar) bar.style.width = `${total > 0 ? Math.round((count / total) * 100) : 0}%`;
      if (cnt) cnt.textContent = count;
    };
    setBar('invBarInStock', 'invCountInStock', inventory.inStock || 0, totalInv);
    setBar('invBarLowStock', 'invCountLowStock', inventory.lowStock || 0, totalInv);
    setBar('invBarOutOfStock', 'invCountOutOfStock', inventory.outOfStock || 0, totalInv);
    
    // Patient gender bars
    const totalPat = (patients.Male || 0) + (patients.Female || 0) + (patients.Other || 0);
    setBar('genderBarMale', 'genderCountMale', patients.Male || 0, totalPat);
    setBar('genderBarFemale', 'genderCountFemale', patients.Female || 0, totalPat);
    
    // Department breakdown table
    const deptTbody = document.getElementById('deptBreakdownTable');
    if (deptTbody) {
      deptTbody.innerHTML = '';
      const totalDocs = Object.values(departments).reduce((a, b) => a + b, 0);
      
      if (Object.keys(departments).length === 0) {
        deptTbody.innerHTML = '<tr><td colspan="3"><div class="empty-state"><p>No doctor departments data.</p></div></td></tr>';
      } else {
        const sorted = Object.entries(departments).sort((a, b) => b[1] - a[1]);
        sorted.forEach(([dept, count]) => {
          const pct = totalDocs > 0 ? Math.round((count / totalDocs) * 100) : 0;
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${dept}</td>
            <td><strong>${count}</strong></td>
            <td>
              <div style="display:flex; align-items:center; gap:0.75rem;">
                <div style="flex:1; background:var(--border-light); border-radius:4px; height:8px; overflow:hidden;">
                  <div style="width:${pct}%; height:100%; background:linear-gradient(90deg, var(--color-primary), var(--color-secondary)); border-radius:4px;"></div>
                </div>
                <span style="font-size:0.8rem; color:var(--text-muted); min-width:30px;">${pct}%</span>
              </div>
            </td>
          `;
          deptTbody.appendChild(tr);
        });
      }
    }
    
  } catch (e) {
    console.error('Load reports error:', e);
    showToast('Failed to load reports data. Make sure server is running.', 'error');
  }
}

// ==========================================
// EXPORT CSV FUNCTION
// ==========================================
async function exportReportsCSV() {
  try {
    showToast('Preparing CSV export...', 'info');
    // Always fetch fresh data from the reports endpoint
    const data = await fetchAPI('/reports');
    if (!data) { showToast('No data to export', 'error'); return; }
    
    const { summary, financials, appointments: apptStats } = data;
    
    const rows = [
      ['Subhan Hospital - Management Report', ''],
      ['Generated On', new Date().toLocaleString()],
      ['', ''],
      ['METRIC', 'VALUE'],
      ['--- Patient Statistics ---', ''],
      ['Total Patients', summary.totalPatients],
      ['Admitted Patients', summary.admittedPatients],
      ['Discharged Patients', summary.dischargedPatients],
      ['', ''],
      ['--- Staff & Doctors ---', ''],
      ['Total Doctors', summary.totalDoctors],
      ['Active Doctors', summary.activeDoctors],
      ['Total Staff', summary.totalStaff],
      ['', ''],
      ['--- Appointments ---', ''],
      ['Total Appointments', summary.totalAppointments],
      ['Scheduled', apptStats.Scheduled || 0],
      ['Completed', apptStats.Completed || 0],
      ['Cancelled', apptStats.Cancelled || 0],
      ['', ''],
      ['--- Clinical ---', ''],
      ['Total Prescriptions', summary.totalPrescriptions],
      ['Inventory Items', summary.totalInventoryItems],
      ['Billing Records', summary.totalBillingRecords],
      ['', ''],
      ['--- Financials ---', ''],
      ['Revenue Collected ($)', financials.totalRevenue.toFixed(2)],
      ['Pending Amount ($)', financials.pendingAmount.toFixed(2)],
      ['Unpaid Amount ($)', financials.unpaidAmount.toFixed(2)],
      ['Total Billed ($)', financials.totalBilled.toFixed(2)],
    ];
    
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subhan-hospital-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Report exported as CSV successfully', 'success');
  } catch (err) {
    showToast('Failed to export CSV. Check server connection.', 'error');
  }
}

// Print Report
async function printReport() {
  try {
    showToast('Preparing printable report...', 'info');
    const data = await fetchAPI('/reports');
    if (!data) { showToast('No data to print', 'error'); return; }
    
    const { summary, financials, appointments: apptStats, departments, patients: patientGenders, staffByDept } = data;
    
    const printWindow = window.open('', '_blank', 'width=900,height=800');
    if (!printWindow) {
      showToast('Popup blocked! Please allow popups to print the report.', 'error');
      return;
    }
    
    const totalAppts = (apptStats.Scheduled || 0) + (apptStats.Completed || 0) + (apptStats.Cancelled || 0);
    const scheduledPct = totalAppts > 0 ? Math.round((apptStats.Scheduled / totalAppts) * 100) : 0;
    const completedPct = totalAppts > 0 ? Math.round((apptStats.Completed / totalAppts) * 100) : 0;
    const cancelledPct = totalAppts > 0 ? Math.round((apptStats.Cancelled / totalAppts) * 100) : 0;
    
    const totalPats = (patientGenders.Male || 0) + (patientGenders.Female || 0) + (patientGenders.Other || 0);
    const malePct = totalPats > 0 ? Math.round((patientGenders.Male / totalPats) * 100) : 0;
    const femalePct = totalPats > 0 ? Math.round((patientGenders.Female / totalPats) * 100) : 0;

    let departmentRows = '';
    Object.entries(departments).sort((a,b) => b[1] - a[1]).forEach(([dept, count]) => {
      departmentRows += `<tr><td>${sanitize(dept)}</td><td><strong>${count}</strong></td></tr>`;
    });

    let staffRows = '';
    Object.entries(staffByDept).sort((a,b) => b[1] - a[1]).forEach(([dept, count]) => {
      staffRows += `<tr><td>${sanitize(dept)}</td><td><strong>${count}</strong></td></tr>`;
    });

    const now = new Date();
    const formattedDate = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const formattedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Subhan Hospital - Operational & Performance Audit Report</title>
          <style>
            body {
              font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
              color: #1e293b;
              background-color: #ffffff;
              padding: 40px;
              margin: 0;
              line-height: 1.5;
            }
            .report-header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 3px double #cbd5e1;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .hospital-logo h1 {
              margin: 0;
              font-size: 28px;
              color: #1e3a8a;
              letter-spacing: 0.5px;
            }
            .hospital-logo p {
              margin: 4px 0 0 0;
              font-size: 14px;
              color: #64748b;
            }
            .report-meta {
              text-align: right;
            }
            .report-meta h2 {
              margin: 0;
              font-size: 20px;
              color: #0f172a;
            }
            .report-meta p {
              margin: 4px 0 0 0;
              font-size: 13px;
              color: #64748b;
            }
            .section-title {
              font-size: 16px;
              font-weight: 700;
              color: #1e3a8a;
              border-bottom: 2px solid #e2e8f0;
              padding-bottom: 6px;
              margin-top: 30px;
              margin-bottom: 15px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 15px;
              margin-bottom: 25px;
            }
            .stat-box {
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 15px;
              background-color: #f8fafc;
            }
            .stat-box .label {
              font-size: 11px;
              color: #64748b;
              text-transform: uppercase;
              font-weight: 600;
              letter-spacing: 0.5px;
            }
            .stat-box .value {
              font-size: 22px;
              font-weight: 700;
              color: #0f172a;
              margin-top: 5px;
            }
            .charts-row {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 25px;
              margin-bottom: 25px;
            }
            .chart-panel {
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 20px;
            }
            .chart-panel h3 {
              margin: 0 0 15px 0;
              font-size: 15px;
              color: #334155;
              border-bottom: 1px solid #f1f5f9;
              padding-bottom: 8px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            th, td {
              padding: 10px 12px;
              font-size: 13px;
              border: 1px solid #e2e8f0;
              text-align: left;
            }
            th {
              background-color: #f1f5f9;
              color: #334155;
              font-weight: 600;
            }
            tr:nth-child(even) {
              background-color: #f8fafc;
            }
            .financial-table td {
              font-size: 14px;
            }
            .financial-total {
              font-weight: bold;
              background-color: #ecfdf5 !important;
              color: #065f46;
            }
            .report-footer {
              margin-top: 50px;
              border-top: 1px dashed #cbd5e1;
              padding-top: 20px;
              text-align: center;
              font-size: 12px;
              color: #94a3b8;
            }
            .distribution-row {
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 6px 0;
              font-size: 13px;
              border-bottom: 1px solid #f1f5f9;
            }
            .distribution-row:last-child {
              border-bottom: none;
            }
            @media print {
              body {
                padding: 0;
              }
              button {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="report-header">
            <div class="hospital-logo">
              <h1>SUBHAN HOSPITAL</h1>
              <p>Block 4, Gulshan-e-Iqbal, Karachi &bull; Phone: 021-111-222-333</p>
            </div>
            <div class="report-meta">
              <h2>Executive Operational Audit</h2>
              <p><strong>Date:</strong> ${formattedDate}</p>
              <p><strong>Time:</strong> ${formattedTime}</p>
            </div>
          </div>

          <div class="section-title">Operational Summary Statistics</div>
          <div class="stats-grid">
            <div class="stat-box">
              <div class="label">Total Admitted Patients</div>
              <div class="value">${summary.admittedPatients}</div>
            </div>
            <div class="stat-box">
              <div class="label">Total Discharged Patients</div>
              <div class="value">${summary.dischargedPatients}</div>
            </div>
            <div class="stat-box">
              <div class="label">Total Physicians</div>
              <div class="value">${summary.totalDoctors}</div>
            </div>
            <div class="stat-box">
              <div class="label">Total Hospital Staff</div>
              <div class="value">${summary.totalStaff}</div>
            </div>
          </div>
          <div class="stats-grid">
            <div class="stat-box">
              <div class="label">Appointments Booked</div>
              <div class="value">${summary.totalAppointments}</div>
            </div>
            <div class="stat-box">
              <div class="label">Prescriptions Written</div>
              <div class="value">${summary.totalPrescriptions}</div>
            </div>
            <div class="stat-box">
              <div class="label">Inventory Lines</div>
              <div class="value">${summary.totalInventoryItems}</div>
            </div>
            <div class="stat-box">
              <div class="label">Billing Records</div>
              <div class="value">${summary.totalBillingRecords}</div>
            </div>
          </div>

          <div class="charts-row">
            <div class="chart-panel">
              <h3>Appointment Breakdown</h3>
              <div class="distribution-row">
                <span>Scheduled Status:</span>
                <strong>${apptStats.Scheduled || 0} (${scheduledPct}%)</strong>
              </div>
              <div class="distribution-row">
                <span>Completed Status:</span>
                <strong>${apptStats.Completed || 0} (${completedPct}%)</strong>
              </div>
              <div class="distribution-row">
                <span>Cancelled Status:</span>
                <strong>${apptStats.Cancelled || 0} (${cancelledPct}%)</strong>
              </div>
              <div class="distribution-row" style="margin-top: 10px; border-top: 2px solid #e2e8f0; font-weight: bold; padding-top: 10px;">
                <span>Total Registered:</span>
                <strong>${totalAppts}</strong>
              </div>
            </div>
            <div class="chart-panel">
              <h3>Patient Gender Representation</h3>
              <div class="distribution-row">
                <span>Male Patients:</span>
                <strong>${patientGenders.Male || 0} (${malePct}%)</strong>
              </div>
              <div class="distribution-row">
                <span>Female Patients:</span>
                <strong>${patientGenders.Female || 0} (${femalePct}%)</strong>
              </div>
              <div class="distribution-row">
                <span>Other/Unspecified:</span>
                <strong>${patientGenders.Other || 0}</strong>
              </div>
              <div class="distribution-row" style="margin-top: 10px; border-top: 2px solid #e2e8f0; font-weight: bold; padding-top: 10px;">
                <span>Total Sample:</span>
                <strong>${totalPats}</strong>
              </div>
            </div>
          </div>

          <div class="section-title">Financial Summary & Accounts Receivable</div>
          <table class="financial-table">
            <thead>
              <tr>
                <th>Category Metric</th>
                <th style="text-align: right; width: 200px;">Amount ($)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Total Revenue Collected (Paid Invoices)</td>
                <td style="text-align: right; color: #16a34a; font-weight: 600;">$${financials.totalRevenue.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
              </tr>
              <tr>
                <td>Pending Invoiced Claims</td>
                <td style="text-align: right; color: #d97706;">$${financials.pendingAmount.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
              </tr>
              <tr>
                <td>Unpaid Invoiced Claims</td>
                <td style="text-align: right; color: #dc2626;">$${financials.unpaidAmount.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
              </tr>
              <tr class="financial-total">
                <td>Total Cumulative Billed Assets</td>
                <td style="text-align: right;">$${financials.totalBilled.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
              </tr>
            </tbody>
          </table>

          <div class="charts-row" style="margin-top: 30px;">
            <div class="chart-panel">
              <h3>Physicians by Department</h3>
              <table>
                <thead>
                  <tr>
                    <th>Department</th>
                    <th>Physician Count</th>
                  </tr>
                </thead>
                <tbody>
                  ${departmentRows || '<tr><td colspan="2">No physicians recorded</td></tr>'}
                </tbody>
              </table>
            </div>
            <div class="chart-panel">
              <h3>Staff Members by Department</h3>
              <table>
                <thead>
                  <tr>
                    <th>Department</th>
                    <th>Staff Count</th>
                  </tr>
                </thead>
                <tbody>
                  ${staffRows || '<tr><td colspan="2">No staff recorded</td></tr>'}
                </tbody>
              </table>
            </div>
          </div>

          <div class="report-footer">
            <p>Confidential &bull; Subhan Hospital Administration System &bull; Generated Automatically via Backend Data Sync</p>
          </div>

          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 800);
            }
          <\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
    showToast('Report print layout generated successfully', 'success');
  } catch (err) {
    console.error('Print report error:', err);
    showToast('Failed to generate printable report layout.', 'error');
  }
}

// ==========================================
// INIT MODULE TRIGGERS
// ==========================================
function initNewModulesTriggers() {
  // Appointment triggers
  document.querySelectorAll('.openAppointmentModalBtn').forEach(btn => {
    btn.addEventListener('click', () => { populateDropdowns(); openAppointmentModal(); });
  });
  document.getElementById('closeAppointmentModalBtn')?.addEventListener('click', () => closeModal('appointmentModalBackdrop'));
  document.getElementById('cancelAppointmentBtn')?.addEventListener('click', () => closeModal('appointmentModalBackdrop'));

  // Prescription triggers
  document.querySelectorAll('.openPrescriptionModalBtn').forEach(btn => {
    btn.addEventListener('click', () => { populateDropdowns(); openPrescriptionModal(); });
  });
  document.getElementById('closePrescriptionModalBtn')?.addEventListener('click', () => closeModal('prescriptionModalBackdrop'));
  document.getElementById('cancelPrescriptionBtn')?.addEventListener('click', () => closeModal('prescriptionModalBackdrop'));

  // Medical history triggers
  document.querySelectorAll('.openMedicalHistoryModalBtn').forEach(btn => {
    btn.addEventListener('click', () => { populateDropdowns(); openMedicalHistoryModal(); });
  });
  document.getElementById('closeMedicalHistoryModalBtn')?.addEventListener('click', () => closeModal('medicalHistoryModalBackdrop'));
  document.getElementById('cancelMedicalHistoryBtn')?.addEventListener('click', () => closeModal('medicalHistoryModalBackdrop'));

  // Inventory triggers
  document.querySelectorAll('.openInventoryModalBtn').forEach(btn => {
    btn.addEventListener('click', () => openInventoryModal());
  });
  document.getElementById('closeInventoryModalBtn')?.addEventListener('click', () => closeModal('inventoryModalBackdrop'));
  document.getElementById('cancelInventoryBtn')?.addEventListener('click', () => closeModal('inventoryModalBackdrop'));

  // Billing triggers
  document.querySelectorAll('.openCreateBillModalBtn').forEach(btn => {
    btn.addEventListener('click', () => { populateDropdowns(); openBillingModal(); });
  });
  document.getElementById('closeBillingModalBtn')?.addEventListener('click', () => closeModal('billingModalBackdrop'));
  document.getElementById('cancelBillingBtn')?.addEventListener('click', () => closeModal('billingModalBackdrop'));

  // Invoice print/close
  document.getElementById('closeInvoiceViewModalBtn')?.addEventListener('click', () => closeModal('invoiceViewModalBackdrop'));
  document.getElementById('closeInvoiceViewBtn')?.addEventListener('click', () => closeModal('invoiceViewModalBackdrop'));
  document.getElementById('printInvoiceActionBtn')?.addEventListener('click', () => {
    const printContent = document.getElementById('invoicePrintArea')?.innerHTML || '';
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) { showToast('Popup blocked. Please allow popups to print.', 'error'); return; }
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Invoice - Subhan Hospital</title>
          <style>
            body { font-family: 'Segoe UI', sans-serif; padding: 20px; background: white; color: black; }
            .invoice-print-container { max-width: 600px; margin: 0 auto; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { padding: 8px; border: 1px solid #ddd; text-align: left; }
            th { background: #f5f5f5; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <div class="invoice-print-container">${printContent}</div>
          <script>window.onload = function() { window.print(); setTimeout(() => window.close(), 500); }<\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
  });

  // Reports buttons
  document.getElementById('exportReportsCSVBtn')?.addEventListener('click', exportReportsCSV);
  document.getElementById('printReportsBtn')?.addEventListener('click', printReport);

  // Search and filter listeners
  document.getElementById('appointmentsSearchInput')?.addEventListener('input', () => { state.appointmentsPage = 1; loadAppointments(); });
  document.getElementById('appointmentsDateFilter')?.addEventListener('change', () => { state.appointmentsPage = 1; loadAppointments(); });
  document.getElementById('appointmentsDoctorFilter')?.addEventListener('change', () => { state.appointmentsPage = 1; loadAppointments(); });
  document.getElementById('appointmentsStatusFilter')?.addEventListener('change', () => { state.appointmentsPage = 1; loadAppointments(); });
  document.getElementById('appointmentsSortFilter')?.addEventListener('change', () => { state.appointmentsPage = 1; loadAppointments(); });
  document.getElementById('appointmentsPrevPage')?.addEventListener('click', () => { if (state.appointmentsPage > 1) { state.appointmentsPage--; loadAppointments(); } });
  document.getElementById('appointmentsNextPage')?.addEventListener('click', () => { state.appointmentsPage++; loadAppointments(); });

  document.getElementById('prescriptionsSearchInput')?.addEventListener('input', () => { state.prescriptionsPage = 1; loadPrescriptions(); });
  document.getElementById('prescriptionsPrevPage')?.addEventListener('click', () => { if (state.prescriptionsPage > 1) { state.prescriptionsPage--; loadPrescriptions(); } });
  document.getElementById('prescriptionsNextPage')?.addEventListener('click', () => { state.prescriptionsPage++; loadPrescriptions(); });

  document.getElementById('medicalHistorySearchInput')?.addEventListener('input', () => { state.medicalHistoryPage = 1; loadMedicalHistory(); });
  document.getElementById('medicalHistoryPrevPage')?.addEventListener('click', () => { if (state.medicalHistoryPage > 1) { state.medicalHistoryPage--; loadMedicalHistory(); } });
  document.getElementById('medicalHistoryNextPage')?.addEventListener('click', () => { state.medicalHistoryPage++; loadMedicalHistory(); });

  document.getElementById('inventorySearchInput')?.addEventListener('input', () => { state.inventoryPage = 1; loadInventory(); });
  document.getElementById('inventoryCategoryFilter')?.addEventListener('change', () => { state.inventoryPage = 1; loadInventory(); });
  document.getElementById('inventoryStatusFilter')?.addEventListener('change', () => { state.inventoryPage = 1; loadInventory(); });
  document.getElementById('inventoryPrevPage')?.addEventListener('click', () => { if (state.inventoryPage > 1) { state.inventoryPage--; loadInventory(); } });
  document.getElementById('inventoryNextPage')?.addEventListener('click', () => { state.inventoryPage++; loadInventory(); });

  document.getElementById('billingSearchInput')?.addEventListener('input', () => { state.billingPage = 1; loadBilling(); });
  document.getElementById('billingStatusFilter')?.addEventListener('change', () => { state.billingPage = 1; loadBilling(); });
  document.getElementById('billingPaymentFilter')?.addEventListener('change', () => { state.billingPage = 1; loadBilling(); });
  document.getElementById('billingPrevPage')?.addEventListener('click', () => { if (state.billingPage > 1) { state.billingPage--; loadBilling(); } });
  document.getElementById('billingNextPage')?.addEventListener('click', () => { state.billingPage++; loadBilling(); });
  
  // Save Notification Preferences
  document.getElementById('saveNotifSettingsBtn')?.addEventListener('click', () => {
    const prefs = {
      email: document.getElementById('notifEmail')?.checked,
      inApp: document.getElementById('notifInApp')?.checked,
      icu: document.getElementById('notifICU')?.checked,
      appointments: document.getElementById('notifAppt')?.checked,
      billing: document.getElementById('notifBilling')?.checked,
      inventory: document.getElementById('notifInventory')?.checked
    };
    localStorage.setItem('subhan_notif_prefs', JSON.stringify(prefs));
    showToast('Notification preferences saved', 'success');
  });
  
  // Load saved notification preferences
  const savedNotifPrefs = localStorage.getItem('subhan_notif_prefs');
  if (savedNotifPrefs) {
    const prefs = JSON.parse(savedNotifPrefs);
    const setCheck = (id, val) => { const el = document.getElementById(id); if (el && val !== undefined) el.checked = val; };
    setCheck('notifEmail', prefs.email);
    setCheck('notifInApp', prefs.inApp);
    setCheck('notifICU', prefs.icu);
    setCheck('notifAppt', prefs.appointments);
    setCheck('notifBilling', prefs.billing);
    setCheck('notifInventory', prefs.inventory);
  }
  
  // Preferences Form
  document.getElementById('preferencesForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const prefs = {
      language: document.getElementById('prefLanguage')?.value,
      timezone: document.getElementById('prefTimezone')?.value,
      dateFormat: document.getElementById('prefDateFormat')?.value,
      itemsPerPage: document.getElementById('prefItemsPerPage')?.value,
      currency: document.getElementById('prefCurrency')?.value
    };
    localStorage.setItem('subhan_system_prefs', JSON.stringify(prefs));
    
    // Apply items per page
    if (prefs.itemsPerPage) state.limit = parseInt(prefs.itemsPerPage);
    
    showToast('System preferences saved', 'success');
  });
  
  // Load saved system preferences
  const savedSysPrefs = localStorage.getItem('subhan_system_prefs');
  if (savedSysPrefs) {
    const prefs = JSON.parse(savedSysPrefs);
    const setVal = (id, val) => { const el = document.getElementById(id); if (el && val) el.value = val; };
    setVal('prefLanguage', prefs.language);
    setVal('prefTimezone', prefs.timezone);
    setVal('prefDateFormat', prefs.dateFormat);
    setVal('prefItemsPerPage', prefs.itemsPerPage);
    setVal('prefCurrency', prefs.currency);
    if (prefs.itemsPerPage) state.limit = parseInt(prefs.itemsPerPage);
  }
  
  // My Profile button in dropdown
  document.querySelectorAll('.profile-dd-item').forEach(btn => {
    if (btn.textContent.trim() === 'My Profile') {
      btn.addEventListener('click', () => {
        const settingsNavItem = document.querySelector('.nav-item[data-section="settings-view"]');
        if (settingsNavItem) settingsNavItem.click();
        document.getElementById('profileDropdown')?.classList.remove('open');
      });
    }
  });
  
  // Password strength meter
  document.getElementById('newPassword')?.addEventListener('input', (e) => {
    const pwd = e.target.value;
    const fill = document.getElementById('pwdStrengthFill');
    const label = document.getElementById('pwdStrengthLabel');
    if (!fill || !label) return;
    
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[0-9]/.test(pwd)) strength++;
    if (/[^A-Za-z0-9]/.test(pwd)) strength++;
    
    const colors = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981'];
    const labels = ['Weak', 'Fair', 'Good', 'Strong'];
    const widths = ['25%', '50%', '75%', '100%'];
    
    if (pwd.length === 0) {
      fill.style.width = '0%';
      label.textContent = '';
    } else {
      const idx = Math.max(0, strength - 1);
      fill.style.width = widths[idx];
      fill.style.background = colors[idx];
      label.textContent = labels[idx];
      label.style.color = colors[idx];
    }
  });
  
  // Settings Last Login
  const lastLoginEl = document.getElementById('settingsLastLogin');
  if (lastLoginEl) {
    const now = new Date();
    lastLoginEl.textContent = now.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
  }
}

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
  // Load base data first
  try {
    await Promise.all([loadPatients(), loadDoctors(), loadStaff()]);
    
    // Populate dropdowns and filters after data loaded
    populateDropdowns();
    populateAppointmentsDoctorFilter();
    
    // Wire all module triggers
    initNewModulesTriggers();
    
    // Load remaining modules in parallel
    await Promise.all([
      loadAppointments(),
      loadPrescriptions(),
      loadMedicalHistory(),
      loadInventory(),
      loadBilling()
    ]);
    
    // Update dashboard stats from real data
    updateDashboardStats();
    
    // Pre-load reports data so it's ready when Reports tab is clicked
    loadReports().catch(() => {}); // Non-blocking, suppress errors
    
  } catch (err) {
    console.error('Initialization error:', err);
    showToast('Failed to connect to server. Please ensure the server is running on port 3000.', 'error');
  }
});

// ==========================================
// SERVER CONNECTION CHECK
// ==========================================
async function checkServerConnection() {
  try {
    const res = await fetch(`${API_BASE}/patients?_limit=1`, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}

