/**
 * Login Page Script
 * Clean, focused login functionality
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize CFramework
  cf.init({
    serverUrl: 'https://nimbus-platform.martin-598.workers.dev',
    appName: 'nimbus'
  });
  
  // Check existing authentication
  // Auto-redirect if already logged in
  cf.autoRedirect();
  
  // Show cookie consent
  cf.showCookieConsent();
});

async function handleLogin(event) {
  event.preventDefault();
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const errorDiv = document.getElementById('error-message');
  const loginBtn = document.getElementById('login-btn');
  const loginText = document.getElementById('login-text');
  const loginSpinner = document.getElementById('login-spinner');
  
  // Show loading state
  loginBtn.disabled = true;
  loginText.textContent = 'Signing in...';
  loginSpinner.style.display = 'inline-block';
  errorDiv.style.display = 'none';
  
  try {
    const result = await cf.login(email, password);
    
    if (result.success) {
      if (cf.isAuthenticated()) {
        // Redirect to dashboard
        window.location.href = '/app/dashboard.html';
      } else {
        console.error('Login succeeded but user not authenticated!');
        errorDiv.textContent = 'Login succeeded but session not stored properly.';
        errorDiv.style.display = 'block';
      }
    } else {
      console.error('Login failed:', result.error);
      errorDiv.textContent = result.error || 'Login failed. Please try again.';
      errorDiv.style.display = 'block';
    }
    
  } catch (error) {
    errorDiv.textContent = 'Network error. Please check your connection.';
    errorDiv.style.display = 'block';
  } finally {
    // Reset loading state
    loginBtn.disabled = false;
    loginText.textContent = 'Sign In';
    loginSpinner.style.display = 'none';
  }
}

// Global functions for HTML onclick
window.handleLogin = handleLogin;
window.acceptCookies = cf.acceptCookies.bind(cf);
window.rejectCookies = cf.rejectCookies.bind(cf);