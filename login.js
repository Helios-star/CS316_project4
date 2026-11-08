const loginForm = document.getElementById("loginForm");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");

const rememberCheckbox = document.getElementById("rememberUsername");
const createAccountBtn = document.getElementById("createAccountBtn");

// Load saved checkbox status
rememberCheckbox.checked = localStorage.getItem("rememberUsername") === "true";

// Load saved username
if (rememberCheckbox.checked) {
  usernameInput.value = localStorage.getItem("savedUsername") || "";
}

// Remember checkbox changes
rememberCheckbox.addEventListener("change", () => {
  localStorage.setItem("rememberUsername", rememberCheckbox.checked);

  if (rememberCheckbox.checked) {
    localStorage.setItem("savedUsername", usernameInput.value);
  } else {
    localStorage.removeItem("savedUsername");
  }
});

// Update saved username while typing
usernameInput.addEventListener("input", () => {
  if (rememberCheckbox.checked) {
    localStorage.setItem("savedUsername", usernameInput.value);
  }
});

// Login button
loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const username = usernameInput.value;
  const password = passwordInput.value;

  try {
    const response = await fetch("/api/login", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        username,
        password,
      }),
    });

    const result = await response.json();

    if (result.success) {
      window.location.href = "/records.html";
    } else {
      alert("Incorrect username or password.");
    }
  } catch (error) {
    console.error(error);
    alert("Unable to connect to server.");
  }
});

// Create Account button
createAccountBtn.addEventListener("click", () => {
  window.location.href = "/register.html";
});
