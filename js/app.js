/* js/app.js */

document.addEventListener('DOMContentLoaded', () => {
  // Core initializations (preserved)
  initSpaRouter();
  initThemeManager();
  initSidebarManager();
  initRegistrationModal();
  initAdmissionsSearchAndFilter();
  initNotificationCenter();
  initClock();
  animateChartAndGauges();

  // Premium enterprise upgrades
  initCountUpAnimations();
  initNotificationDropdown();
  initProfileDropdown();
  initQuickLinkNav();
  
  // Auth & User Profile
  loadUserProfile();
});

/**
 * Load User Profile
 * Fetches user from localStorage and updates UI elements
 */
function loadUserProfile() {
  const userJson = localStorage.getItem('subhan_user');
  if (userJson) {
    const user = JSON.parse(userJson);
    
    // Update sidebar profile
    const sidebarName = document.querySelector('.sidebar .user-name-label');
    const sidebarRole = document.querySelector('.sidebar .user-role-label');
    const sidebarAvatar = document.querySelector('.sidebar .user-avatar-circle');
    if (sidebarName) sidebarName.textContent = user.name;
    if (sidebarRole) sidebarRole.textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
    if (sidebarAvatar) sidebarAvatar.textContent = user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    // Update Top Navbar Profile
    const navName = document.querySelector('.profile-trigger-name');
    const navRole = document.querySelector('.profile-trigger-role');
    const ddName = document.querySelector('.profile-dd-name');
    const ddEmail = document.querySelector('.profile-dd-email');
    const ddAvatar = document.querySelector('.profile-dd-avatar');
    if (navName) navName.textContent = user.name;
    if (navRole) navRole.textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
    if (ddName) ddName.textContent = user.name;
    if (ddEmail) ddEmail.textContent = user.email;
    if (ddAvatar) ddAvatar.textContent = user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

    // Store globally for greeting use
    window.currentUser = user;
  }
}

/**
 * Single Page Application (SPA) Router
 * Monitors clicks on sidebar navigation links and switches active section views
 */
function initSpaRouter() {
  const routerNav = document.getElementById('sidebarNavRouter');
  const sections = document.querySelectorAll('.dashboard-section');
  const navItems = routerNav.querySelectorAll('.nav-item');

  if (!routerNav) return;

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();

      const targetSectionId = item.getAttribute('data-section');
      const targetSection = document.getElementById(targetSectionId);

      if (!targetSection) return;

      // Update active nav item
      navItems.forEach(nav => {
        nav.classList.remove('active');
        nav.removeAttribute('aria-current');
      });
      item.classList.add('active');
      item.setAttribute('aria-current', 'page');

      // Toggle active section visibility
      sections.forEach(sec => {
        sec.classList.remove('active');
      });
      
      // Delay slightly to trigger transform entrance transitions
      setTimeout(() => {
        targetSection.classList.add('active');
      }, 50);

      showSystemToast(`Navigated to ${item.querySelector('.nav-item-text').textContent}`, 'success');

      // Close mobile drawer if open
      const sidebarNode = document.getElementById('sidebarNode');
      if (sidebarNode && sidebarNode.classList.contains('mobile-open')) {
        sidebarNode.classList.remove('mobile-open');
      }
    });
  });
}

/**
 * Theme Manager
 * Toggles data-theme attributes between light and dark modes
 */
function initThemeManager() {
  const themeTogglerBtn = document.getElementById('themeTogglerBtn');
  const settingsThemeBtn = document.getElementById('settingsThemeBtn');
  if (!themeTogglerBtn) return;

  const sunIcon = themeTogglerBtn.querySelector('.theme-sun');
  const moonIcon = themeTogglerBtn.querySelector('.theme-moon');

  // Load preference
  const savedTheme = localStorage.getItem('dashboard-theme') || 'light';
  setTheme(savedTheme);

  // Bind navbar button
  themeTogglerBtn.addEventListener('click', toggleTheme);
  
  // Bind settings page button
  if (settingsThemeBtn) {
    settingsThemeBtn.addEventListener('click', toggleTheme);
  }

  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const targetTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setTheme(targetTheme);
    showSystemToast(`Switched to ${targetTheme === 'dark' ? 'Midnight Dark' : 'Clinical Light'} mode`, 'success');
  }

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('dashboard-theme', theme);

    if (theme === 'dark') {
      sunIcon.style.display = 'block';
      moonIcon.style.display = 'none';
    } else {
      sunIcon.style.display = 'none';
      moonIcon.style.display = 'block';
    }
  }
}

/**
 * Sidebar Drawer Manager
 */
function initSidebarManager() {
  const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
  const sidebarNode = document.getElementById('sidebarNode');

  if (!sidebarToggleBtn || !sidebarNode) return;

  sidebarToggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    sidebarNode.classList.toggle('collapsed');
    
    if (window.innerWidth <= 768) {
      sidebarNode.classList.toggle('mobile-open');
    }
  });

  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 && sidebarNode.classList.contains('mobile-open')) {
      if (!sidebarNode.contains(e.target) && e.target !== sidebarToggleBtn) {
        sidebarNode.classList.remove('mobile-open');
      }
    }
  });
}

/**
 * Registration Modal System
 * Controls opening, validating, saving, and appending records to tables
 */
function initRegistrationModal() {
  const modalBackdrop = document.getElementById('registrationModalBackdrop');
  const openModalBtns = document.querySelectorAll('.openRegisterModalBtn, .openAppointmentModalBtn');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const cancelBtn = document.getElementById('cancelRegistrationBtn');
  const regForm = document.getElementById('patientRegistrationForm');
  
  // Stats Counters
  const patientsCountStat = document.getElementById('dashboard-patients-stat');

  if (!modalBackdrop || !regForm) return;

  // Toggle Modal Open
  openModalBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      modalBackdrop.classList.add('open');
    });
  });

  // Toggle Modal Close
  const closeActions = [closeModalBtn, cancelBtn];
  closeActions.forEach(btn => {
    if (btn) {
      btn.addEventListener('click', () => {
        modalBackdrop.classList.remove('open');
        regForm.reset();
      });
    }
  });

  // Handle Form submit
  regForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = document.getElementById('regPatientName').value.trim();
    const age = document.getElementById('regPatientAge').value.trim();
    const dept = document.getElementById('regPatientDept').value;
    const doctor = document.getElementById('regPatientDoctor').value;
    const status = document.getElementById('regPatientStatus').value;

    if (!name || !age) {
      showSystemToast('Please fill out all required fields.', 'warning');
      return;
    }

    // Generate Mock Patient ID
    const randomIdSuffix = Math.floor(100 + Math.random() * 900);
    const newId = `#SH-26-${randomIdSuffix}`;

    // Format current date
    const dateOptions = { year: 'numeric', month: 'long', day: '2-digit' };
    const formattedDate = new Date().toLocaleDateString('en-US', dateOptions);

    // Build row element dynamically
    const tableBody = document.querySelector('#patientsDirTable tbody');
    if (tableBody) {
      const newTr = document.createElement('tr');
      newTr.innerHTML = `
        <td><strong>${newId}</strong></td>
        <td>${name}</td>
        <td>${formattedDate}</td>
        <td>${dept}</td>
        <td>${doctor}</td>
        <td><span class="badge ${status === 'Admitted' ? 'badge-success' : 'badge-warning'}">${status}</span></td>
        <td>
          <div class="row-actions">
            <button class="action-btn-circle" title="View Patient File">
              <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
            </button>
            <button class="action-btn-circle dischargePatientBtn danger" title="Discharge Patient">
              <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </button>
          </div>
      `;

      // Bind dynamic discharge functionality to new button
      const dischargeBtn = newTr.querySelector('.dischargePatientBtn');
      if (dischargeBtn) {
        bindDischargeRowListener(dischargeBtn);
      }

      tableBody.insertBefore(newTr, tableBody.firstChild);
    }

    // Update admissions count
    if (patientsCountStat) {
      const currentVal = parseInt(patientsCountStat.textContent.replace(/,/g, ''));
      patientsCountStat.textContent = (currentVal + 1).toLocaleString();
    }

    showSystemToast(`Successfully registered ${name} to ${dept}!`, 'success');
    modalBackdrop.classList.remove('open');
    regForm.reset();
  });

  // Bind initial patient rows discharge buttons
  const initDischargeBtns = document.querySelectorAll('.dischargePatientBtn');
  initDischargeBtns.forEach(btn => bindDischargeRowListener(btn));
}

/**
 * Discharge Handler
 * Binds checkmark click buttons in tables to transition patient status badges to "Discharged"
 */
function bindDischargeRowListener(btn) {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const row = btn.closest('tr');
    const badge = row.querySelector('.badge');
    const name = row.querySelector('td:nth-child(2)').textContent;

    if (badge && !badge.classList.contains('badge-info')) {
      badge.className = 'badge badge-info';
      badge.textContent = 'Discharged';
      
      // Clear discharge button once discharged
      btn.remove();

      showSystemToast(`Patient ${name} has been discharged.`, 'info');
    }
  });
}

/**
 * Search & Combobox Filtering Logs
 */
function initAdmissionsSearchAndFilter() {
  const globalSearchInput = document.getElementById('dashboardSearch');
  const patientSearchInput = document.querySelector('.patientsSearchBox');
  const appointmentSearchInput = document.querySelector('.appointmentsSearchBox');
  const departmentFilterSelect = document.querySelector('.departmentFilterSelect');

  // Trigger search logic across different pages
  if (globalSearchInput) {
    globalSearchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      filterTableRows('#patientsDirTable tbody tr', [1, 3, 4], query);
      filterTableRows('#appointmentsScheduleTable tbody tr', [1, 2, 4], query);
    });
  }

  if (patientSearchInput) {
    patientSearchInput.addEventListener('input', () => applyPatientFilters());
  }

  if (departmentFilterSelect) {
    departmentFilterSelect.addEventListener('change', () => applyPatientFilters());
  }

  if (appointmentSearchInput) {
    appointmentSearchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      filterTableRows('#appointmentsScheduleTable tbody tr', [1, 2, 4], query);
    });
  }

  // Combined filters on Patient directory page
  function applyPatientFilters() {
    const textQuery = patientSearchInput ? patientSearchInput.value.toLowerCase().trim() : '';
    const deptQuery = departmentFilterSelect ? departmentFilterSelect.value : 'All';
    const rows = document.querySelectorAll('#patientsDirTable tbody tr');

    rows.forEach(row => {
      const name = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
      const id = row.querySelector('td:nth-child(1)').textContent.toLowerCase();
      const doc = row.querySelector('td:nth-child(5)').textContent.toLowerCase();
      const department = row.querySelector('td:nth-child(4)').textContent;

      const matchesText = name.includes(textQuery) || id.includes(textQuery) || doc.includes(textQuery);
      const matchesDept = deptQuery === 'All' || department === deptQuery;

      if (matchesText && matchesDept) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    });
  }

  // Generic column-specific filter
  function filterTableRows(rowSelector, columnsArray, query) {
    const rows = document.querySelectorAll(rowSelector);
    rows.forEach(row => {
      let isMatch = false;
      columnsArray.forEach(colIndex => {
        const textCell = row.querySelector(`td:nth-child(${colIndex})`);
        if (textCell && textCell.textContent.toLowerCase().includes(query)) {
          isMatch = true;
        }
      });
      
      row.style.display = (isMatch || query === '') ? '' : 'none';
    });
  }
}

/**
 * Notifications and Settings Toggles
 */
function initNotificationCenter() {
  const notificationBtn = document.getElementById('notificationBtn');
  const notificationBadge = document.getElementById('notificationBadge');
  const settingsBackupBtn = document.getElementById('settingsBackupBtn');

  if (notificationBtn) {
    notificationBtn.addEventListener('click', () => {
      notificationBtn.classList.add('alert-shake');
      
      const alerts = [
        "⚠️ Alert: Shift schedule update request from Doctor Sarah Khan.",
        "🚨 Uptime Cap: Emergency Beds occupancy exceeded safety threshold.",
        "📅 Audit: Monthly billing statements are compiled for review."
      ];

      showSystemToast("Clinical Systems Alerts:\n\n" + alerts.join("\n"), "info");

      if (notificationBadge) {
        notificationBadge.style.opacity = '0';
        setTimeout(() => notificationBadge.style.display = 'none', 300);
      }

      setTimeout(() => notificationBtn.classList.remove('alert-shake'), 600);
    });
  }

  // Backup script mock
  if (settingsBackupBtn) {
    settingsBackupBtn.addEventListener('click', () => {
      showSystemToast("System tables synchronization with server directory completed.", "success");
    });
  }
}

/**
 * Digital Clock Component
 */
function initClock() {
  const liveTimeBadge = document.getElementById('liveTimeBadge');
  if (!liveTimeBadge) return;

  function refresh() {
    const now = new Date();
    let hours = now.getHours();
    const min = String(now.getMinutes()).padStart(2, '0');
    const sec = String(now.getSeconds()).padStart(2, '0');
    const meridian = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12;
    hours = hours ? hours : 12; // 0 hour check
    const formattedHours = String(hours).padStart(2, '0');

    liveTimeBadge.textContent = `${formattedHours}:${min}:${sec} ${meridian}`;
  }

  refresh();
  setInterval(refresh, 1000);
}

/**
 * CSS bar columns & Circular Gauges animation loops
 */
function animateChartAndGauges() {
  // Chart Columns growth
  const bars = document.querySelectorAll('.bar-fill');
  bars.forEach(bar => {
    const height = bar.style.height;
    bar.style.height = '0px';
    setTimeout(() => {
      bar.style.height = height;
    }, 150);
  });

  // Circular progress gauges load animation
  const circleVals = document.querySelectorAll('.circle-val');
  circleVals.forEach(circle => {
    const dashoffset = circle.getAttribute('stroke-dashoffset');
    // Set initially empty
    circle.setAttribute('stroke-dashoffset', '251.2');
    setTimeout(() => {
      circle.setAttribute('stroke-dashoffset', dashoffset);
    }, 250);
  });
}

/**
 * Premium Systems Slide Toast Banners
 */
function showSystemToast(message, type = 'success') {
  let wrapper = document.getElementById('system-toast-wrapper');
  if (!wrapper) {
    wrapper = document.createElement('div');
    wrapper.id = 'system-toast-wrapper';
    wrapper.style.cssText = `
      position: fixed;
      top: 1.5rem;
      right: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      z-index: 999999;
      pointer-events: none;
    `;
    document.body.appendChild(wrapper);
  }

  const styles = {
    success: { bg: 'var(--color-secondary)', color: '#ffffff' }, // Teal
    info: { bg: 'var(--color-primary)', color: '#ffffff' },     // Navy
    warning: { bg: 'var(--color-warning)', color: '#0f172a' }
  };

  const current = styles[type] || styles.success;

  const card = document.createElement('div');
  card.role = 'alert';
  card.style.cssText = `
    background-color: ${current.bg};
    color: ${current.color};
    padding: 1rem 1.5rem;
    font-size: 0.9rem;
    font-weight: 600;
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
    border: 1px solid var(--border-light);
    max-width: 320px;
    white-space: pre-wrap;
    opacity: 0;
    transform: translateY(-20px);
    pointer-events: auto;
    transition: opacity var(--transition-speed) var(--transition-curve), transform var(--transition-speed) var(--transition-curve);
  `;
  card.textContent = message;
  wrapper.appendChild(card);

  requestAnimationFrame(() => {
    card.style.opacity = '1';
    card.style.transform = 'translateY(0)';
  });

  setTimeout(() => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(-20px)';
    setTimeout(() => {
      card.remove();
      if (wrapper.children.length === 0) {
        wrapper.remove();
      }
    }, 300);
  }, 4500);
}

/* =====================================================
   PREMIUM ENTERPRISE FEATURES
   ===================================================== */

/**
 * Count-Up Animations
 * Animates all .count-up elements from 0 to their data-target value
 */
function initCountUpAnimations() {
  const countEls = document.querySelectorAll('.count-up[data-target]');
  if (!countEls.length) return;

  const easeOutQuart = t => 1 - Math.pow(1 - t, 4);

  countEls.forEach(el => {
    const target = parseInt(el.getAttribute('data-target'), 10);
    const prefix = el.getAttribute('data-prefix') || '';
    const isCurrency = el.getAttribute('data-format') === 'currency';
    const duration = 1600;
    const startDelay = 300;

    setTimeout(() => {
      const startTime = performance.now();

      function step(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = easeOutQuart(progress);
        const current = Math.floor(eased * target);

        if (isCurrency) {
          el.textContent = prefix + current.toLocaleString();
        } else {
          el.textContent = current.toLocaleString();
        }

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          if (isCurrency) {
            el.textContent = prefix + target.toLocaleString();
          } else {
            el.textContent = target.toLocaleString();
          }
        }
      }

      requestAnimationFrame(step);
    }, startDelay);
  });
}

/**
 * Notification Dropdown
 * Toggles notification panel and handles mark-all-read
 */
function initNotificationDropdown() {
  const wrapper = document.getElementById('notifDropdownWrapper');
  const btn = document.getElementById('notificationBtn');
  const dropdown = document.getElementById('notifDropdown');
  const badge = document.getElementById('notificationBadge');
  const markAllBtn = document.getElementById('markAllReadBtn');

  if (!btn || !dropdown) return;

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = dropdown.classList.contains('open');
    
    // Close profile dropdown if open
    closeProfileDropdown();

    if (isOpen) {
      dropdown.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    } else {
      dropdown.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
      // Shake animation
      btn.classList.add('alert-shake');
      setTimeout(() => btn.classList.remove('alert-shake'), 600);
    }
  });

  // Mark all read
  if (markAllBtn) {
    markAllBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const unread = dropdown.querySelectorAll('.notif-unread');
      unread.forEach(item => item.classList.remove('notif-unread'));
      if (badge) {
        badge.style.transition = 'opacity 0.3s, transform 0.3s';
        badge.style.opacity = '0';
        badge.style.transform = 'scale(0)';
        setTimeout(() => badge.style.display = 'none', 300);
      }
      showSystemToast('All notifications marked as read.', 'success');
    });
  }

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (wrapper && !wrapper.contains(e.target)) {
      dropdown.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    }
  });
}

function closeProfileDropdown() {
  const pd = document.getElementById('profileDropdown');
  const pt = document.getElementById('profileTriggerBtn');
  if (pd) pd.classList.remove('open');
  if (pt) {
    pt.classList.remove('open');
    pt.setAttribute('aria-expanded', 'false');
  }
}

/**
 * Profile Dropdown
 * Toggles user profile panel and handles navigation to settings
 */
function initProfileDropdown() {
  const wrapper = document.getElementById('profileDropdownWrapper');
  const trigger = document.getElementById('profileTriggerBtn');
  const dropdown = document.getElementById('profileDropdown');
  const settingsNavBtn = document.getElementById('profileSettingsBtn');

  if (!trigger || !dropdown) return;

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = dropdown.classList.contains('open');

    // Close notification dropdown if open
    const notifDropdown = document.getElementById('notifDropdown');
    const notifBtn = document.getElementById('notificationBtn');
    if (notifDropdown) notifDropdown.classList.remove('open');
    if (notifBtn) notifBtn.setAttribute('aria-expanded', 'false');

    if (isOpen) {
      dropdown.classList.remove('open');
      trigger.classList.remove('open');
      trigger.setAttribute('aria-expanded', 'false');
    } else {
      dropdown.classList.add('open');
      trigger.classList.add('open');
      trigger.setAttribute('aria-expanded', 'true');
    }
  });

  // Keyboard support
  trigger.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      trigger.click();
    }
  });

  // Navigate to settings from profile dropdown
  if (settingsNavBtn) {
    settingsNavBtn.addEventListener('click', () => {
      dropdown.classList.remove('open');
      trigger.classList.remove('open');

      // Trigger settings nav item
      const settingsNavItem = document.querySelector('.nav-item[data-section="settings-view"]');
      if (settingsNavItem) settingsNavItem.click();
    });
  }

  // Sign out
  const logoutBtn = dropdown.querySelector('.profile-dd-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      showSystemToast('Signing out... Session will end shortly.', 'info');
      dropdown.classList.remove('open');
      
      // Clear session and redirect
      setTimeout(() => {
        localStorage.removeItem('subhan_auth_token');
        localStorage.removeItem('subhan_user');
        window.location.replace('login.html');
      }, 800);
    });
  }

  // Outside click
  document.addEventListener('click', (e) => {
    if (wrapper && !wrapper.contains(e.target)) {
      dropdown.classList.remove('open');
      trigger.classList.remove('open');
      trigger.setAttribute('aria-expanded', 'false');
    }
  });
}

/**
 * Quick Link Navigation
 * data-goto buttons route to sections like the sidebar nav
 */
function initQuickLinkNav() {
  const quickBtns = document.querySelectorAll('[data-goto]');
  
  quickBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-goto');
      const targetNavItem = document.querySelector(`.nav-item[data-section="${targetId}"]`);
      if (targetNavItem) {
        targetNavItem.click();
      }
    });
  });
}

/**
 * Enhanced Digital Clock - also updates date label and welcome greeting
 */
// Override the existing initClock function behavior by patching after page load
// The new version updates: clock time, meridiem, date label, and navbar greeting
(function patchClock() {
  // Will run after DOMContentLoaded via the original initClock call.
  // We extend with a secondary interval that updates additional premium elements.
  const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  function updatePremiumDateTime() {
    const now = new Date();
    const hours24 = now.getHours();
    const meridiem = hours24 >= 12 ? 'PM' : 'AM';
    let h = hours24 % 12;
    h = h ? h : 12;
    const hh = String(h).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');

    // Update the big banner clock (without meridiem in main number)
    const liveTime = document.getElementById('liveTimeBadge');
    if (liveTime) liveTime.textContent = `${hh}:${mm}:${ss}`;

    // Update meridiem separately
    const meridEl = document.getElementById('liveMeridiem');
    if (meridEl) meridEl.textContent = meridiem;

    // Update date label
    const dateEl = document.getElementById('liveDateLabel');
    if (dateEl) {
      const day = DAYS[now.getDay()];
      const month = MONTHS[now.getMonth()];
      const date = now.getDate();
      const year = now.getFullYear();
      dateEl.textContent = `${day}, ${month} ${String(date).padStart(2, '0')}, ${year}`;
    }

    // Update greeting in welcome heading
    const greetingEl = document.querySelector('.welcome-heading');
    if (greetingEl) {
      const greet = hours24 < 12 ? 'Good Morning' : hours24 < 17 ? 'Good Afternoon' : 'Good Evening';
      const userName = window.currentUser ? window.currentUser.name : 'Administrator';
      greetingEl.textContent = `${greet}, ${userName}`;
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    updatePremiumDateTime();
    setInterval(updatePremiumDateTime, 1000);
  });
})();
