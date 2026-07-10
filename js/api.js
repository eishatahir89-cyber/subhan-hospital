const API_BASE = 'http://localhost:3000/api';

const state = {
  patients: [],
  doctors: [],
  staff: [],
  patientsPage: 1,
  doctorsPage: 1,
  staffPage: 1,
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
  }, 3000);
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
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'API Error');
    return data;
  } catch (err) {
    showToast(err.message, 'error');
    throw err;
  }
}

// ==========================================
// MODAL MANAGEMENT
// ==========================================
function openModal(modalId) { document.getElementById(modalId)?.classList.add('open'); }
function closeModal(modalId) { document.getElementById(modalId)?.classList.remove('open'); }

// ==========================================
// CONFIRMATION MODAL
// ==========================================
let confirmCallback = null;
function openConfirmModal(message, callback) {
  document.getElementById('confirmMessage').textContent = message;
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
  let html = `<div style="display:grid; grid-template-columns: 1fr 1fr; gap: 1rem;">`;
  for (const [key, val] of Object.entries(dataObj)) {
    if(key === 'id') continue;
    html += `<div><strong>${key.replace(/([A-Z])/g, ' $1').toUpperCase()}:</strong><br><span style="color:var(--text-secondary)">${val || 'N/A'}</span></div>`;
  }
  html += `</div>`;
  content.innerHTML = html;
  document.querySelector('#viewModalBackdrop h3').textContent = title;
  openModal('viewModalBackdrop');
}
document.getElementById('closeViewModalBtn')?.addEventListener('click', () => closeModal('viewModalBackdrop'));

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
    if(qSearch) url += `&q=${encodeURIComponent(qSearch)}`;
    if(qGender !== 'All') url += `&gender=${encodeURIComponent(qGender)}`;
    if(qBlood !== 'All') url += `&bloodGroup=${encodeURIComponent(qBlood)}`;
    if(qStatus !== 'All') url += `&status=${encodeURIComponent(qStatus)}`;

    const res = await fetch(`${API_BASE}${url}`);
    const totalCount = res.headers.get('X-Total-Count') || 0;
    const data = await res.json();
    state.patients = data;
    renderPatientsTable(totalCount);
  } catch (e) {}
}

function renderPatientsTable(totalCount) {
  const tbody = document.getElementById('patientsTableBody');
  if(!tbody) return;
  tbody.innerHTML = '';
  
  if(state.patients.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><p>No patients found.</p></div></td></tr>`;
  } else {
    state.patients.forEach(p => {
      const tr = document.createElement('tr');
      const badgeClass = p.status === 'Admitted' ? 'badge-success' : 'badge-info';
      tr.innerHTML = `
        <td><strong>${p.patientId}</strong></td>
        <td>${p.fullName}</td>
        <td>${p.age} / ${p.gender}</td>
        <td>${p.bloodGroup}</td>
        <td>${p.admissionDate || p.createdAt?.split('T')[0] || '-'}</td>
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
      tr.querySelector('.del-btn').onclick = () => openConfirmModal(`Delete patient ${p.fullName}?`, async () => {
        await fetchAPI(`/patients/${p.id}`, { method: 'DELETE' });
        showToast('Patient deleted', 'success');
        loadPatients();
      });
      tbody.appendChild(tr);
    });
  }
  
  updatePagination('patients', totalCount);
}

document.getElementById('patientsSearchInput')?.addEventListener('input', () => { state.patientsPage=1; loadPatients(); });
document.getElementById('patientsGenderFilter')?.addEventListener('change', () => { state.patientsPage=1; loadPatients(); });
document.getElementById('patientsBloodFilter')?.addEventListener('change', () => { state.patientsPage=1; loadPatients(); });
document.getElementById('patientsStatusFilter')?.addEventListener('change', () => { state.patientsPage=1; loadPatients(); });

document.getElementById('patientsPrevPage')?.addEventListener('click', () => { if(state.patientsPage > 1) { state.patientsPage--; loadPatients(); }});
document.getElementById('patientsNextPage')?.addEventListener('click', () => { state.patientsPage++; loadPatients(); });

// Patient Form
function openPatientModal(patient = null) {
  const form = document.getElementById('patientForm');
  form.reset();
  document.getElementById('patientModalTitle').textContent = patient ? 'Edit Patient' : 'Register Patient';
  
  if (patient) {
    document.getElementById('patientId').value = patient.id;
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
  }
  openModal('patientModalBackdrop');
}

document.querySelector('.openRegisterPatientModalBtn')?.addEventListener('click', () => openPatientModal());
document.getElementById('closePatientModalBtn')?.addEventListener('click', () => closeModal('patientModalBackdrop'));
document.getElementById('cancelPatientBtn')?.addEventListener('click', () => closeModal('patientModalBackdrop'));

document.getElementById('patientForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('patientId').value;
  const payload = {
    fullName: document.getElementById('pFullName').value,
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

  if(id) {
    await fetchAPI(`/patients/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
    showToast('Patient updated');
  } else {
    await fetchAPI('/patients', { method: 'POST', body: JSON.stringify(payload) });
    showToast('Patient registered');
  }
  closeModal('patientModalBackdrop');
  loadPatients();
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
    if(qSearch) url += `&q=${encodeURIComponent(qSearch)}`;
    if(qDept !== 'All') url += `&department=${encodeURIComponent(qDept)}`;
    if(qStatus !== 'All') url += `&status=${encodeURIComponent(qStatus)}`;

    const data = await fetchAPI(url);
    state.doctors = data;
    renderDoctorsTable();
  } catch (e) {}
}

function renderDoctorsTable() {
  const tbody = document.getElementById('doctorsTableBody');
  if(!tbody) return;
  tbody.innerHTML = '';
  
  if(state.doctors.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><p>No doctors found.</p></div></td></tr>`;
  } else {
    state.doctors.forEach(d => {
      const tr = document.createElement('tr');
      let badge = 'badge-success';
      if(d.status === 'On Leave') badge = 'badge-warning';
      if(d.status === 'Inactive') badge = 'badge-danger';

      tr.innerHTML = `
        <td><strong>${d.doctorId}</strong></td>
        <td>${d.fullName}</td>
        <td>${d.department}</td>
        <td>${d.specialization}</td>
        <td>${d.shift}</td>
        <td><span class="badge ${badge}">${d.status}</span></td>
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
      tr.querySelector('.del-btn').onclick = () => openConfirmModal(`Delete doctor ${d.fullName}?`, async () => {
        await fetchAPI(`/doctors/${d.id}`, { method: 'DELETE' });
        showToast('Doctor deleted', 'success');
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
  form.reset();
  document.getElementById('doctorModalTitle').textContent = doc ? 'Edit Doctor' : 'Add Doctor';
  
  if (doc) {
    document.getElementById('doctorId').value = doc.id;
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
  const payload = {
    fullName: document.getElementById('dFullName').value,
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

  if(id) {
    await fetchAPI(`/doctors/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
    showToast('Doctor updated');
  } else {
    await fetchAPI('/doctors', { method: 'POST', body: JSON.stringify(payload) });
    showToast('Doctor added');
  }
  closeModal('doctorModalBackdrop');
  loadDoctors();
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
    if(qSearch) url += `&q=${encodeURIComponent(qSearch)}`;
    if(qDept !== 'All') url += `&department=${encodeURIComponent(qDept)}`;
    if(qRole !== 'All') url += `&role=${encodeURIComponent(qRole)}`;

    const data = await fetchAPI(url);
    state.staff = data;
    renderStaffTable();
  } catch (e) {}
}

function renderStaffTable() {
  const tbody = document.getElementById('staffTableBody');
  if(!tbody) return;
  tbody.innerHTML = '';
  
  if(state.staff.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><p>No staff found.</p></div></td></tr>`;
  } else {
    state.staff.forEach(s => {
      const tr = document.createElement('tr');
      let badge = 'badge-success';
      if(s.status === 'On Leave') badge = 'badge-warning';
      if(s.status === 'Inactive') badge = 'badge-danger';

      tr.innerHTML = `
        <td><strong>${s.staffId}</strong></td>
        <td>${s.fullName}</td>
        <td>${s.role}</td>
        <td>${s.department}</td>
        <td>${s.shift}</td>
        <td><span class="badge ${badge}">${s.status}</span></td>
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
      tr.querySelector('.del-btn').onclick = () => openConfirmModal(`Delete staff ${s.fullName}?`, async () => {
        await fetchAPI(`/staff/${s.id}`, { method: 'DELETE' });
        showToast('Staff deleted', 'success');
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
  form.reset();
  document.getElementById('staffModalTitle').textContent = s ? 'Edit Staff' : 'Add Staff';
  
  if (s) {
    document.getElementById('staffId').value = s.id;
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
  }
  openModal('staffModalBackdrop');
}

document.querySelector('.openAddStaffModalBtn')?.addEventListener('click', () => openStaffModal());
document.getElementById('closeStaffModalBtn')?.addEventListener('click', () => closeModal('staffModalBackdrop'));
document.getElementById('cancelStaffBtn')?.addEventListener('click', () => closeModal('staffModalBackdrop'));

document.getElementById('staffForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('staffId').value;
  const payload = {
    fullName: document.getElementById('sFullName').value,
    role: document.getElementById('sRole').value,
    department: document.getElementById('sDept').value,
    phone: document.getElementById('sPhone').value,
    email: document.getElementById('sEmail').value,
    joiningDate: document.getElementById('sDate').value,
    shift: document.getElementById('sShift').value,
    salary: document.getElementById('sSalary').value,
    status: document.getElementById('sStatus').value
  };

  if(id) {
    await fetchAPI(`/staff/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
    showToast('Staff updated');
  } else {
    await fetchAPI('/staff', { method: 'POST', body: JSON.stringify(payload) });
    showToast('Staff added');
  }
  closeModal('staffModalBackdrop');
  loadStaff();
});

// ==========================================
// UTILS
// ==========================================
function updatePagination(module, total) {
  const info = document.getElementById(`${module}PageInfo`);
  const prevBtn = document.getElementById(`${module}PrevPage`);
  const nextBtn = document.getElementById(`${module}NextPage`);
  if(!info) return;

  const page = state[`${module}Page`];
  const limit = state.limit;
  const start = (page - 1) * limit + 1;
  let end = page * limit;
  if(end > total) end = total;
  
  if (total == 0) {
    info.textContent = `Showing 0 of 0`;
  } else {
    info.textContent = `Showing ${start}-${end} of ${total}`;
  }

  prevBtn.disabled = page === 1;
  nextBtn.disabled = end >= total;
}

// Init on load
document.addEventListener('DOMContentLoaded', () => {
  loadPatients();
  loadDoctors();
  loadStaff();
});
