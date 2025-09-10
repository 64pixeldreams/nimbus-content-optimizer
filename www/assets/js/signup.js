/**
 * Signup Page Script
 * Clean signup functionality
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize CFramework
  cf.init({
    serverUrl: 'https://nimbus-platform.martin-598.workers.dev',
    appName: 'nimbus'
  });
  
  // Auto-redirect if already logged in
  cf.autoRedirect();
  
  // Show cookie consent
  cf.showCookieConsent();
});

async function handleSignup(event) {
  event.preventDefault();
  
  const email = document.getElementById('email').value;
  const name = document.getElementById('name').value;
  const password = document.getElementById('password').value;
  const errorDiv = document.getElementById('error-message');
  const successDiv = document.getElementById('success-message');
  const signupBtn = document.getElementById('signup-btn');
  const signupText = document.getElementById('signup-text');
  const signupSpinner = document.getElementById('signup-spinner');
  
  // Show loading state
  signupBtn.disabled = true;
  signupText.textContent = 'Creating account...';
  signupSpinner.style.display = 'inline-block';
  errorDiv.style.display = 'none';
  successDiv.style.display = 'none';
  
  try {
    // Use direct signup endpoint
    const response = await fetch('https://nimbus-platform.martin-598.workers.dev/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name })
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Success - show message and auto-login
      successDiv.textContent = 'Account created successfully! Signing you in...';
      successDiv.style.display = 'block';
      
      // Auto-login after signup
      await cf.login(email, password);
      window.location.href = '/app/dashboard.html';
    } else {
      errorDiv.textContent = result.error || 'Signup failed. Please try again.';
      errorDiv.style.display = 'block';
    }
    
  } catch (error) {
    errorDiv.textContent = 'Network error. Please check your connection.';
    errorDiv.style.display = 'block';
  } finally {
    // Reset loading state
    signupBtn.disabled = false;
    signupText.textContent = 'Create Account';
    signupSpinner.style.display = 'none';
  }
}

// Global functions for HTML
window.handleSignup = handleSignup;
window.acceptCookies = cf.acceptCookies.bind(cf);
window.rejectCookies = cf.rejectCookies.bind(cf);
