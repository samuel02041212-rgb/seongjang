// ===== 회원가입 =====
const registerForm = document.getElementById('registerForm');

if (registerForm) {
  registerForm.addEventListener('submit', (e) => {
    e.preventDefault(); // 새로고침 막기

    const username = document.getElementById('username').value;
    const gender = document.getElementById('gender').value;
    const birthDate = document.getElementById('birthDate').value;
    const church = document.getElementById('church').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const signupSource = document.getElementById('signupSource').value;

    fetch('/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, gender, birthDate, church,
    email, password, signupSource })
    })
      .then(res => res.text())
      .then(data => {
        alert(data);
      });
  });
}

// ===== 로그인 =====
const loginForm = document.getElementById('loginForm');

if (loginForm) {
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault(); // 새로고침 막기

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    fetch('/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ email, password })
})
.then(res => res.text())
.then(data => {
  if (data === '로그인 성공') {
    window.location.href = '/main';
  } else {
    alert(data);
  }
});

  });
}

