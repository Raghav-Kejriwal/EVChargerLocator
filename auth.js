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

    if (response.ok) {
      localStorage.setItem("user", JSON.stringify({ username })); // ✅ Store user in localStorage
      alert("✅ Sign-up successful. Redirecting to main page...");
      window.location.href = "index.html";
    } else {
      alert("❌ Sign-up failed. Please try again.");
    }
  } catch (err) {
    alert("❌ Error during sign-up.");
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

    if (response.ok) {
      localStorage.setItem("user", JSON.stringify({ username: emailOrUsername })); // ✅ Store user in localStorage
      alert("✅ Login successful. Redirecting to main page...");
      window.location.href = "index.html";
    } else {
      alert("❌ Login failed. Check your credentials.");
    }
  } catch (err) {
    alert("❌ Error during login.");
  }
});
