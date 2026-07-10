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

function initRegistrationModal() { /* Replaced by new API logic */ }
function bindDischargeRowListener(btn) { /* Replaced by new API logic */ }
function initAdmissionsSearchAndFilter() { /* Replaced by new API logic */ }

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
