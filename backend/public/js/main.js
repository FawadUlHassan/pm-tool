// public/js/main.js
document.addEventListener('DOMContentLoaded', () => {
  const loginTab   = document.getElementById('loginTab');
  const signupTab  = document.getElementById('signupTab');
  const loginForm  = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');

  // Show Login
  loginTab.addEventListener('click', e => {
    e.preventDefault();
    loginTab.classList.add('active');
    signupTab.classList.remove('active');
    loginForm.style.display  = 'block';
    signupForm.style.display = 'none';
  });

  // Show Sign Up
  signupTab.addEventListener('click', e => {
    e.preventDefault();
    signupTab.classList.add('active');
    loginTab.classList.remove('active');
    signupForm.style.display = 'block';
    loginForm.style.display  = 'none';
  });
});

