const API_BASE = 'http://localhost:3000/api';

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

// ==========================================
// DROP DOWN AND AUTO-POPULATION UTILITIES
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
      sel.innerHTML += `<option value="${p.id}" data-name="${p.fullName}">${p.fullName} (${p.patientId})</option>`;
    });
    if (currentVal) sel.value = currentVal;
  });

  doctorSelects.forEach(sel => {
    if (!sel) return;
    const currentVal = sel.value;
    sel.innerHTML = '<option value="">Select Doctor</option>';
    state.doctors.forEach(d => {
      sel.innerHTML += `<option value="${d.id}" data-name="${d.fullName}" data-dept="${d.department}">${d.fullName} (${d.specialization})</option>`;
    });
    if (currentVal) sel.value = currentVal;
  });
}

function populateAppointmentsDoctorFilter() {
  const docFilter = document.getElementById('appointmentsDoctorFilter');
  if (docFilter) {
    const currentVal = docFilter.value;
    docFilter.innerHTML = '<option value="All">All Doctors</option>';
    state.doctors.forEach(d => {
      docFilter.innerHTML += `<option value="${d.id}">${d.fullName}</option>`;
    });
    if (currentVal) docFilter.value = currentVal;
  }
}

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
      if (match) {
        sum += parseFloat(match[1]);
      }
    });
    return sum;
  };
  
  total += sumCosts(servicesText);
  total += sumCosts(medicinesText);
  
  const bTotalAmount = document.getElementById('bTotalAmount');
  if (bTotalAmount) {
    bTotalAmount.value = total.toFixed(2);
  }
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
        a.id.toLowerCase().includes(searchLower) ||
        (a.patientName && a.patientName.toLowerCase().includes(searchLower)) ||
        (a.doctorName && a.doctorName.toLowerCase().includes(searchLower))
      );
    }
    
    if (qDate) {
      data = data.filter(a => a.date === qDate);
    }
    
    if (qDoctor !== 'All') {
      data = data.filter(a => a.doctorId === qDoctor);
    }
    
    if (qStatus !== 'All') {
      data = data.filter(a => a.status === qStatus);
    }
    
    if (qSort === 'date-asc') {
      data.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (qSort === 'date-desc') {
      data.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (qSort === 'time-asc') {
      data.sort((a, b) => a.time.localeCompare(b.time));
    } else if (qSort === 'time-desc') {
      data.sort((a, b) => b.time.localeCompare(a.time));
    }
    
    const totalCount = data.length;
    const page = state.appointmentsPage;
    const limit = state.limit;
    const start = (page - 1) * limit;
    data = data.slice(start, start + limit);
    
    renderAppointmentsTable(data, totalCount);
  } catch (e) {
    console.error(e);
  }
}

function renderAppointmentsTable(appointments, totalCount) {
  const tbody = document.getElementById('appointmentsTableBody');
  if(!tbody) return;
  tbody.innerHTML = '';
  
  if(appointments.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><p>No appointments found.</p></div></td></tr>`;
  } else {
    appointments.forEach(a => {
      const tr = document.createElement('tr');
      let badgeClass = 'badge-info';
      if(a.status === 'Completed') badgeClass = 'badge-success';
      if(a.status === 'Cancelled') badgeClass = 'badge-danger';
      
      tr.innerHTML = `
        <td><strong>${a.id}</strong></td>
        <td>${a.patientName || '-'}</td>
        <td>${a.doctorName || '-'}</td>
        <td>${a.department || '-'}</td>
        <td>${a.date || '-'}</td>
        <td>${a.time || '-'}</td>
        <td><span class="badge ${badgeClass}">${a.status || 'Scheduled'}</span></td>
        <td>
          <div class="row-actions">
            <button class="action-btn-circle view-btn" title="View Details">👁️</button>
            <button class="action-btn-circle edit-btn" title="Edit Appointment">✏️</button>
            <button class="action-btn-circle danger del-btn" title="Delete Appointment">🗑️</button>
          </div>
        </td>
      `;
      tr.querySelector('.view-btn').onclick = () => viewProfile(`Appointment Details (${a.id})`, a);
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
  form.reset();
  document.getElementById('appointmentModalTitle').textContent = appt ? 'Edit Appointment' : 'Book Appointment';
  
  if (appt) {
    document.getElementById('appointmentId').value = appt.id;
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
  
  const payload = {
    patientId,
    patientName,
    doctorId,
    doctorName,
    department: document.getElementById('aDept').value,
    date: document.getElementById('aDate').value,
    time: document.getElementById('aTime').value,
    status: document.getElementById('aStatus').value,
    notes: document.getElementById('aNotes').value
  };
  
  if (!patientId || !doctorId) {
    showToast('Please select a patient and a doctor', 'error');
    return;
  }
  
  if (id) {
    await fetchAPI(`/appointments/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
    showToast('Appointment updated');
  } else {
    await fetchAPI('/appointments', { method: 'POST', body: JSON.stringify(payload) });
    showToast('Appointment booked');
  }
  closeModal('appointmentModalBackdrop');
  loadAppointments();
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
        p.id.toLowerCase().includes(searchLower) ||
        (p.patientName && p.patientName.toLowerCase().includes(searchLower)) ||
        (p.doctorName && p.doctorName.toLowerCase().includes(searchLower)) ||
        (p.diagnosis && p.diagnosis.toLowerCase().includes(searchLower))
      );
    }
    
    const totalCount = data.length;
    const page = state.prescriptionsPage;
    const limit = state.limit;
    const start = (page - 1) * limit;
    data = data.slice(start, start + limit);
    
    renderPrescriptionsTable(data, totalCount);
  } catch (e) {}
}

function renderPrescriptionsTable(prescriptions, totalCount) {
  const tbody = document.getElementById('prescriptionsTableBody');
  if(!tbody) return;
  tbody.innerHTML = '';
  
  if(prescriptions.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><p>No prescriptions found.</p></div></td></tr>`;
  } else {
    prescriptions.forEach(p => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${p.id}</strong></td>
        <td>${p.patientName || '-'}</td>
        <td>${p.doctorName || '-'}</td>
        <td>${p.diagnosis || '-'}</td>
        <td>${p.medicines || '-'}</td>
        <td>${p.date || '-'}</td>
        <td>
          <div class="row-actions">
            <button class="action-btn-circle view-btn" title="View Prescription">👁️</button>
            <button class="action-btn-circle edit-btn" title="Edit Prescription">✏️</button>
            <button class="action-btn-circle danger del-btn" title="Delete Prescription">🗑️</button>
          </div>
        </td>
      `;
      tr.querySelector('.view-btn').onclick = () => viewProfile(`Prescription Details (${p.id})`, p);
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
  form.reset();
  document.getElementById('prescriptionModalTitle').textContent = p ? 'Edit Prescription' : 'Write Prescription';
  
  if (p) {
    document.getElementById('prescriptionId').value = p.id;
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
  
  const payload = {
    patientId,
    patientName,
    doctorId,
    doctorName,
    diagnosis: document.getElementById('prDiagnosis').value,
    medicines: document.getElementById('prMedicines').value,
    dosage: document.getElementById('prDosage').value,
    duration: document.getElementById('prDuration').value,
    date: document.getElementById('prDate').value,
    notes: document.getElementById('prNotes').value
  };
  
  if (!patientId || !doctorId) {
    showToast('Please select a patient and a doctor', 'error');
    return;
  }
  
  if(id) {
    await fetchAPI(`/prescriptions/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
    showToast('Prescription updated');
  } else {
    await fetchAPI('/prescriptions', { method: 'POST', body: JSON.stringify(payload) });
    showToast('Prescription saved');
  }
  closeModal('prescriptionModalBackdrop');
  loadPrescriptions();
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
        mh.id.toLowerCase().includes(searchLower) ||
        (mh.patientName && mh.patientName.toLowerCase().includes(searchLower)) ||
        (mh.diseases && mh.diseases.toLowerCase().includes(searchLower)) ||
        (mh.allergies && mh.allergies.toLowerCase().includes(searchLower))
      );
    }
    
    const totalCount = data.length;
    const page = state.medicalHistoryPage;
    const limit = state.limit;
    const start = (page - 1) * limit;
    data = data.slice(start, start + limit);
    
    renderMedicalHistoryTable(data, totalCount);
  } catch (e) {}
}

function renderMedicalHistoryTable(historyList, totalCount) {
  const tbody = document.getElementById('medicalHistoryTableBody');
  if(!tbody) return;
  tbody.innerHTML = '';
  
  if(historyList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><p>No medical histories found.</p></div></td></tr>`;
  } else {
    historyList.forEach(mh => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${mh.id}</strong></td>
        <td>${mh.patientName || '-'}</td>
        <td>${mh.diseases || '-'}</td>
        <td>${mh.allergies || '-'}</td>
        <td>${mh.surgeries || '-'}</td>
        <td>
          <div class="row-actions">
            <button class="action-btn-circle view-btn" title="View Full Details">👁️</button>
            <button class="action-btn-circle edit-btn" title="Edit Medical Record">✏️</button>
            <button class="action-btn-circle danger del-btn" title="Delete Medical Record">🗑️</button>
          </div>
        </td>
      `;
      tr.querySelector('.view-btn').onclick = () => viewProfile(`Medical Record Details (${mh.id})`, mh);
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
  form.reset();
  document.getElementById('medicalHistoryModalTitle').textContent = mh ? 'Edit Medical History' : 'Add Medical History';
  
  if (mh) {
    document.getElementById('medicalHistoryId').value = mh.id;
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
  
  const payload = {
    patientId,
    patientName,
    diseases: document.getElementById('mhDiseases').value,
    allergies: document.getElementById('mhAllergies').value,
    surgeries: document.getElementById('mhSurgeries').value,
    labReports: document.getElementById('mhLabReports').value,
    prescriptions: document.getElementById('mhPrescriptions').value,
    visitHistory: document.getElementById('mhVisitHistory').value
  };
  
  if (!patientId) {
    showToast('Please select a patient', 'error');
    return;
  }
  
  if(id) {
    await fetchAPI(`/medical-history/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
    showToast('Medical record updated');
  } else {
    await fetchAPI('/medical-history', { method: 'POST', body: JSON.stringify(payload) });
    showToast('Medical record saved');
  }
  closeModal('medicalHistoryModalBackdrop');
  loadMedicalHistory();
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
        i.name.toLowerCase().includes(searchLower) ||
        i.id.toLowerCase().includes(searchLower) ||
        i.supplier.toLowerCase().includes(searchLower)
      );
    }
    
    if (qCategory !== 'All') {
      data = data.filter(i => i.category === qCategory);
    }
    
    if (qStatus !== 'All') {
      data = data.filter(i => {
        const calculatedStatus = i.quantity <= 0 ? 'Out of Stock' : (i.quantity < 10 ? 'Low Stock' : 'In Stock');
        return calculatedStatus === qStatus;
      });
    }
    
    const totalCount = data.length;
    const page = state.inventoryPage;
    const limit = state.limit;
    const start = (page - 1) * limit;
    data = data.slice(start, start + limit);
    
    renderInventoryTable(data, totalCount);
  } catch (e) {}
}

function renderInventoryTable(items, totalCount) {
  const tbody = document.getElementById('inventoryTableBody');
  if(!tbody) return;
  tbody.innerHTML = '';
  
  if(items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9"><div class="empty-state"><p>No inventory items found.</p></div></td></tr>`;
  } else {
    items.forEach(i => {
      const tr = document.createElement('tr');
      
      const qty = parseInt(i.quantity);
      let status = 'In Stock';
      let badge = 'badge-success';
      if (qty <= 0) {
        status = 'Out of Stock';
        badge = 'badge-danger';
      } else if (qty < 10) {
        status = 'Low Stock';
        badge = 'badge-warning';
      }
      
      tr.innerHTML = `
        <td><strong>${i.id}</strong></td>
        <td>${i.name || '-'}</td>
        <td>${i.category || '-'}</td>
        <td><strong>${i.quantity}</strong></td>
        <td>${i.supplier || '-'}</td>
        <td>$${parseFloat(i.unitPrice).toFixed(2)}</td>
        <td>${i.expiryDate || '-'}</td>
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
      tr.querySelector('.del-btn').onclick = () => openConfirmModal(`Delete inventory item ${i.name}?`, async () => {
        await fetchAPI(`/inventory/${i.id}`, { method: 'DELETE' });
        showToast('Item deleted', 'success');
        loadInventory();
      });
      tbody.appendChild(tr);
    });
  }
  updatePagination('inventory', totalCount);
}

function openInventoryModal(i = null) {
  const form = document.getElementById('inventoryForm');
  form.reset();
  document.getElementById('inventoryModalTitle').textContent = i ? 'Edit Inventory Item' : 'Add Inventory Item';
  
  if (i) {
    document.getElementById('inventoryId').value = i.id;
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
  
  let status = 'In Stock';
  if (qty <= 0) status = 'Out of Stock';
  else if (qty < 10) status = 'Low Stock';
  
  const payload = {
    name: document.getElementById('iName').value,
    category: document.getElementById('iCategory').value,
    quantity: qty,
    supplier: document.getElementById('iSupplier').value,
    unitPrice: parseFloat(document.getElementById('iUnitPrice').value),
    expiryDate: document.getElementById('iExpiryDate').value,
    status: status
  };
  
  if(id) {
    await fetchAPI(`/inventory/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
    showToast('Inventory item updated');
  } else {
    await fetchAPI('/inventory', { method: 'POST', body: JSON.stringify(payload) });
    showToast('Inventory item added');
  }
  closeModal('inventoryModalBackdrop');
  loadInventory();
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
        b.id.toLowerCase().includes(searchLower) ||
        (b.patientName && b.patientName.toLowerCase().includes(searchLower)) ||
        (b.patientId && b.patientId.toLowerCase().includes(searchLower))
      );
    }
    
    if (qStatus !== 'All') {
      data = data.filter(b => b.paymentStatus === qStatus);
    }
    
    if (qPayment !== 'All') {
      data = data.filter(b => b.paymentMethod === qPayment);
    }
    
    let paidTotal = 0;
    let unpaidTotal = 0;
    data.forEach(b => {
      if (b.paymentStatus === 'Paid') paidTotal += parseFloat(b.totalAmount || 0);
      else unpaidTotal += parseFloat(b.totalAmount || 0);
    });
    
    const receiptsEl = document.getElementById('billingTotalReceipts');
    const unpaidEl = document.getElementById('billingUnpaidClaims');
    if (receiptsEl) receiptsEl.textContent = `$${paidTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    if (unpaidEl) unpaidEl.textContent = `$${unpaidTotal.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    
    const totalCount = data.length;
    const page = state.billingPage;
    const limit = state.limit;
    const start = (page - 1) * limit;
    data = data.slice(start, start + limit);
    
    renderBillingTable(data, totalCount);
  } catch (e) {}
}

function renderBillingTable(bills, totalCount) {
  const tbody = document.getElementById('billingTableBody');
  if(!tbody) return;
  tbody.innerHTML = '';
  
  if(bills.length === 0) {
    tbody.innerHTML = `<tr><td colspan="10"><div class="empty-state"><p>No billing records found.</p></div></td></tr>`;
  } else {
    bills.forEach(b => {
      const tr = document.createElement('tr');
      let statusBadge = 'badge-success';
      if(b.paymentStatus === 'Unpaid') statusBadge = 'badge-danger';
      if(b.paymentStatus === 'Pending') statusBadge = 'badge-warning';
      
      tr.innerHTML = `
        <td><strong>${b.id}</strong></td>
        <td>${b.patientName || '-'}</td>
        <td>${b.doctorName || '-'}</td>
        <td style="max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${b.services || '-'}</td>
        <td style="max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${b.medicines || '-'}</td>
        <td><strong>$${parseFloat(b.totalAmount).toFixed(2)}</strong></td>
        <td>${b.paymentMethod || '-'}</td>
        <td><span class="badge ${statusBadge}">${b.paymentStatus}</span></td>
        <td>${b.invoiceDate || '-'}</td>
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
  form.reset();
  document.getElementById('billingModalTitle').textContent = b ? 'Edit Invoice' : 'Create Invoice';
  
  if (b) {
    document.getElementById('billId').value = b.id;
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
  
  const payload = {
    patientId,
    patientName,
    doctorId,
    doctorName,
    services: document.getElementById('bServices').value,
    medicines: document.getElementById('bMedicines').value,
    totalAmount: parseFloat(document.getElementById('bTotalAmount').value || 0),
    paymentMethod: document.getElementById('bMethod').value,
    paymentStatus: document.getElementById('bStatus').value,
    invoiceDate: document.getElementById('bDate').value
  };
  
  if (!patientId || !doctorId) {
    showToast('Please select a patient and a doctor', 'error');
    return;
  }
  
  if(id) {
    await fetchAPI(`/billing/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
    showToast('Invoice updated');
  } else {
    await fetchAPI('/billing', { method: 'POST', body: JSON.stringify(payload) });
    showToast('Invoice generated');
  }
  closeModal('billingModalBackdrop');
  loadBilling();
});

// Printable Receipt Modal Binding
function openInvoicePrintModal(bill) {
  document.getElementById('printBillId').textContent = bill.id;
  document.getElementById('printInvoiceDate').textContent = bill.invoiceDate;
  document.getElementById('printPatientName').textContent = bill.patientName;
  document.getElementById('printPatientId').textContent = bill.patientId;
  document.getElementById('printDoctorName').textContent = bill.doctorName;
  document.getElementById('printPaymentMethod').textContent = bill.paymentMethod;
  document.getElementById('printPaymentStatus').textContent = bill.paymentStatus;
  document.getElementById('printTotalAmount').textContent = `$${parseFloat(bill.totalAmount).toFixed(2)}`;
  
  const tbody = document.getElementById('printInvoiceItems');
  tbody.innerHTML = '';
  
  const parseRows = (text, category) => {
    if (!text) return;
    const lines = text.split(',');
    lines.forEach(line => {
      const parts = line.split(':');
      const desc = parts[0]?.trim() || category;
      const valStr = parts[1]?.trim() || '';
      const match = valStr.match(/\$?(\d+(?:\.\d+)?)/);
      const val = match ? parseFloat(match[1]) : 0;
      
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="padding: 0.5rem; border: 1px solid #ddd;">${desc}</td>
        <td style="padding: 0.5rem; border: 1px solid #ddd; text-align: right;">$${val.toFixed(2)}</td>
      `;
      tbody.appendChild(tr);
    });
  };
  
  parseRows(bill.services, 'Service Fee');
  parseRows(bill.medicines, 'Medicine');
  
  openModal('invoiceViewModalBackdrop');
}

// Wire up all new triggers
function initNewModulesTriggers() {
  document.querySelectorAll('.openAppointmentModalBtn').forEach(btn => {
    btn.addEventListener('click', () => openAppointmentModal());
  });
  document.getElementById('closeAppointmentModalBtn')?.addEventListener('click', () => closeModal('appointmentModalBackdrop'));
  document.getElementById('cancelAppointmentBtn')?.addEventListener('click', () => closeModal('appointmentModalBackdrop'));

  document.querySelectorAll('.openPrescriptionModalBtn').forEach(btn => {
    btn.addEventListener('click', () => openPrescriptionModal());
  });
  document.getElementById('closePrescriptionModalBtn')?.addEventListener('click', () => closeModal('prescriptionModalBackdrop'));
  document.getElementById('cancelPrescriptionBtn')?.addEventListener('click', () => closeModal('prescriptionModalBackdrop'));

  document.querySelectorAll('.openMedicalHistoryModalBtn').forEach(btn => {
    btn.addEventListener('click', () => openMedicalHistoryModal());
  });
  document.getElementById('closeMedicalHistoryModalBtn')?.addEventListener('click', () => closeModal('medicalHistoryModalBackdrop'));
  document.getElementById('cancelMedicalHistoryBtn')?.addEventListener('click', () => closeModal('medicalHistoryModalBackdrop'));

  document.querySelectorAll('.openInventoryModalBtn').forEach(btn => {
    btn.addEventListener('click', () => openInventoryModal());
  });
  document.getElementById('closeInventoryModalBtn')?.addEventListener('click', () => closeModal('inventoryModalBackdrop'));
  document.getElementById('cancelInventoryBtn')?.addEventListener('click', () => closeModal('inventoryModalBackdrop'));

  document.querySelectorAll('.openCreateBillModalBtn').forEach(btn => {
    btn.addEventListener('click', () => openBillingModal());
  });
  document.getElementById('closeBillingModalBtn')?.addEventListener('click', () => closeModal('billingModalBackdrop'));
  document.getElementById('cancelBillingBtn')?.addEventListener('click', () => closeModal('billingModalBackdrop'));
  
  document.getElementById('closeInvoiceViewModalBtn')?.addEventListener('click', () => closeModal('invoiceViewModalBackdrop'));
  document.getElementById('closeInvoiceViewBtn')?.addEventListener('click', () => closeModal('invoiceViewModalBackdrop'));
  
  document.getElementById('printInvoiceActionBtn')?.addEventListener('click', () => {
    const printContent = document.getElementById('invoicePrintArea').innerHTML;
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Invoice - Subhan Hospital</title>
          <style>
            body { font-family: sans-serif; padding: 20px; background: white; color: black; }
            .invoice-print-container { max-width: 600px; margin: 0 auto; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { padding: 8px; border: 1px solid #ddd; text-align: left; }
            th { background: #f5f5f5; }
          </style>
        </head>
        <body>
          <div class="invoice-print-container">
            ${printContent}
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  });

  // Attach search and filters listeners
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
}

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
  // Load basic entities first
  await loadPatients();
  await loadDoctors();
  await loadStaff();
  
  // Populate dropdowns & doctor filter
  populateAppointmentsDoctorFilter();
  initNewModulesTriggers();
  
  // Load new module lists
  loadAppointments();
  loadPrescriptions();
  loadMedicalHistory();
  loadInventory();
  loadBilling();
});

