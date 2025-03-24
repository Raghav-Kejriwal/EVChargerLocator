const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// Toggle Between Signup & Login Forms
const signupForm = document.getElementById("signup-form");
const loginForm = document.getElementById("login-form");
const formTitle = document.getElementById("form-title");
const toggleText = document.getElementById("toggle-text");

function toggleForms() {
  if (signupForm.style.display === "none") {
    signupForm.style.display = "block";
    loginForm.style.display = "none";
    formTitle.textContent = "Sign Up";
    toggleText.innerHTML = 'Already have an account? <a href="#" onclick="toggleForms()">Login</a>';
  } else {
    signupForm.style.display = "none";
    loginForm.style.display = "block";
    formTitle.textContent = "Login";
    toggleText.innerHTML = 'Don\'t have an account? <a href="#" onclick="toggleForms()">Sign Up</a>';
  }
}

// Handle Sign-up
signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("signup-username").value;
  const email = document.getElementById("signup-email").value;
  const password = document.getElementById("signup-password").value;

  try {
    const response = await fetch("https://evchargerlocator.onrender.com/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });

    if (response.ok) {
      alert("✅ Sign-up successful!");
      window.location.href = "index.html";
    } else {
      alert("❌ Sign-up failed. Try again.");
    }
  } catch (err) {
    alert("❌ Error during sign-up.");
  }
});

// Handle Login
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const emailOrUsername = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  try {
    const response = await fetch("https://evchargerlocator.onrender.com/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emailOrUsername, password }),
    });

    if (response.ok) {
      alert("✅ Login successful!");
      window.location.href = "index.html";
    } else {
      alert("❌ Invalid credentials.");
    }
  } catch (err) {
    alert("❌ Error during login.");
  }
});

// Initialize Google Sign-In
window.onload = function () {
  google.accounts.id.initialize({
    client_id: googleClientId,
    callback: handleCredentialResponse,
  });

  google.accounts.id.renderButton(
    document.getElementById("google-signin-button"),
    { theme: "outline", size: "large" }
  );
};

function handleCredentialResponse(response) {
  console.log("Google Sign-In response:", response.credential);

  fetch("https://evchargerlocator.onrender.com/auth/google", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: response.credential }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        // ✅ Store user info in localStorage
        localStorage.setItem("user", JSON.stringify({
          _id: data.user._id,
          userId: data.user._id,
          username: data.user.username
        }));
        alert("✅ Google Sign-in successful!");
        window.location.href = "https://evchargerlocator.vercel.app/dashboard";  // Redirect to dashboard
      } else {
        alert("❌ Google Sign-in failed.");
      }
    })
    .catch(() => alert("❌ Error during Google authentication."));
}