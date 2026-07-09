/* js/auth.js */

document.addEventListener('DOMContentLoaded', () => {
  // Common utilities
  const togglePassword = document.querySelectorAll('.password-toggle');
  
  // Password Visibility Toggle
  togglePassword.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const input = btn.previousElementSibling;
      if (input.type === 'password') {
        input.type = 'text';
        // Eye-slash icon (hide)
        btn.innerHTML = `<svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"></path></svg>`;
      } else {
        input.type = 'password';
        // Eye icon (show)
        btn.innerHTML = `<svg class="eye-icon" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>`;
      }
    });
  });

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // Login Form Handling
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    // Fill saved email if remember me was checked
    const savedEmail = localStorage.getItem('subhan_saved_email');
    if (savedEmail) {
      document.getElementById('email').value = savedEmail;
      document.getElementById('rememberMe').checked = true;
    }

    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('email');
      const password = document.getElementById('password');
      const emailError = document.getElementById('emailError');
      const passwordError = document.getElementById('passwordError');
      const generalError = document.getElementById('generalError');
      const btn = document.getElementById('loginBtn');
      const remember = document.getElementById('rememberMe').checked;

      let isValid = true;
      generalError.style.display = 'none';

      if (!validateEmail(email.value)) {
        email.classList.add('error');
        emailError.style.display = 'block';
        isValid = false;
      } else {
        email.classList.remove('error');
        emailError.style.display = 'none';
      }

      if (!password.value) {
        password.classList.add('error');
        passwordError.style.display = 'block';
        isValid = false;
      } else {
        password.classList.remove('error');
        passwordError.style.display = 'none';
      }

      if (!isValid) return;

      // Loading state
      btn.classList.add('loading');
      btn.disabled = true;

      try {
        // Fetch mock users
        const response = await fetch('/data/users.json');
        const users = await response.json();

        // Simulate network delay
        setTimeout(() => {
          const user = users.find(u => u.email === email.value && u.password === password.value);
          
          if (user) {
            // Success
            if (remember) {
              localStorage.setItem('subhan_saved_email', email.value);
            } else {
              localStorage.removeItem('subhan_saved_email');
            }
            
            // Generate mock token and session data
            const token = btoa(JSON.stringify({ id: user.id, role: user.role, exp: Date.now() + 86400000 }));
            localStorage.setItem('subhan_auth_token', token);
            localStorage.setItem('subhan_user', JSON.stringify(user));
            
            window.location.href = 'index.html'; // Redirect to dashboard
          } else {
            // Fail
            generalError.textContent = 'Invalid email or password.';
            generalError.style.display = 'block';
            btn.classList.remove('loading');
            btn.disabled = false;
          }
        }, 1000);

      } catch (err) {
        console.error("Auth Error:", err);
        generalError.textContent = 'Connection error. Try again.';
        generalError.style.display = 'block';
        btn.classList.remove('loading');
        btn.disabled = false;
      }
    });
  }

  // Forgot Password Handling
  const forgotForm = document.getElementById('forgotForm');
  const otpForm = document.getElementById('otpForm');
  if (forgotForm) {
    forgotForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('resetEmail');
      const emailError = document.getElementById('resetEmailError');
      const btn = document.getElementById('sendOtpBtn');

      if (!validateEmail(email.value)) {
        email.classList.add('error');
        emailError.style.display = 'block';
        return;
      }
      email.classList.remove('error');
      emailError.style.display = 'none';

      btn.classList.add('loading');
      btn.disabled = true;

      // Simulate sending OTP
      setTimeout(() => {
        btn.classList.remove('loading');
        btn.disabled = false;
        forgotForm.style.display = 'none';
        otpForm.style.display = 'block';
        document.getElementById('formSubtitle').textContent = `We sent a code to ${email.value}`;
        
        // Auto focus first OTP input
        const firstOtp = document.querySelector('.otp-input');
        if (firstOtp) firstOtp.focus();
      }, 1200);
    });
  }

  // OTP Handling
  if (otpForm) {
    const inputs = document.querySelectorAll('.otp-input');
    inputs.forEach((input, index) => {
      input.addEventListener('input', (e) => {
        if (e.target.value.length > 0 && index < inputs.length - 1) {
          inputs[index + 1].focus();
        }
      });
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && e.target.value === '' && index > 0) {
          inputs[index - 1].focus();
        }
      });
    });

    otpForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const btn = document.getElementById('verifyOtpBtn');
      const error = document.getElementById('otpError');
      
      let code = '';
      inputs.forEach(i => code += i.value);
      
      if (code.length < 4) {
        error.style.display = 'block';
        return;
      }
      error.style.display = 'none';

      btn.classList.add('loading');
      btn.disabled = true;

      setTimeout(() => {
        // Accept any 4 digit code for mock demo
        window.location.href = 'reset-password.html';
      }, 1000);
    });
  }

  // Reset Password Handling
  const resetForm = document.getElementById('resetPasswordForm');
  if (resetForm) {
    resetForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const pwd = document.getElementById('newPassword');
      const confirm = document.getElementById('confirmPassword');
      const pwdErr = document.getElementById('newPasswordError');
      const confirmErr = document.getElementById('confirmPasswordError');
      const btn = document.getElementById('savePasswordBtn');

      let isValid = true;
      if (pwd.value.length < 6) {
        pwd.classList.add('error');
        pwdErr.style.display = 'block';
        isValid = false;
      } else {
        pwd.classList.remove('error');
        pwdErr.style.display = 'none';
      }

      if (pwd.value !== confirm.value) {
        confirm.classList.add('error');
        confirmErr.style.display = 'block';
        isValid = false;
      } else {
        confirm.classList.remove('error');
        confirmErr.style.display = 'none';
      }

      if (!isValid) return;

      btn.classList.add('loading');
      btn.disabled = true;

      setTimeout(() => {
        alert("Password reset successfully! Redirecting to login...");
        window.location.href = 'login.html';
      }, 1200);
    });
  }
});
