const signupForm = document.getElementById("signup-form");
const loginForm = document.getElementById("login-form");
const formTitle = document.getElementById("form-title");
const toggleText = document.getElementById("toggle-text");

function toggleForms() {
  if (signupForm.style.display === "none") {
    signupForm.style.display = "block";
    loginForm.style.display = "none";
    formTitle.textContent = "Sign Up";
    toggleText.innerHTML =
      'Already have an account? <a href="#" onclick="toggleForms()">Login</a>';
  } else {
    signupForm.style.display = "none";
    loginForm.style.display = "block";
    formTitle.textContent = "Login";
    toggleText.innerHTML =
      'Don\'t have an account? <a href="#" onclick="toggleForms()">Sign Up</a>';
  }
}

// Sign Up Handler
signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = signupForm.querySelector('input[placeholder="Username"]').value;
  const email = signupForm.querySelector('input[placeholder="Email"]').value;
  const password = signupForm.querySelector('input[placeholder="Password"]').value;

  try {
    const response = await fetch("http://localhost:5000/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });
    alert(await response.text());
  } catch (err) {
    alert("Sign-up failed. Please try again.");
  }
});

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const emailOrUsername = loginForm.querySelector('input[placeholder="Username or Email"]').value;
  const password = loginForm.querySelector('input[placeholder="Password"]').value;

  try {
    const response = await fetch("http://localhost:5000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailOrUsername, password }),
    });

    alert(await response.text());
  } catch (err) {
    alert("❌ Login failed. Please check your credentials.");
  }
});