document.getElementById('showSignup').onclick = e => {
  e.preventDefault();
  document.getElementById('loginForm').style.display  = 'none';
  document.getElementById('signupForm').style.display = 'block';
};
document.getElementById('showLogin').onclick = e => {
  e.preventDefault();
  document.getElementById('signupForm').style.display = 'none';
  document.getElementById('loginForm').style.display  = 'block';
};

