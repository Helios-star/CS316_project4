const registerForm = document.getElementById("registerForm");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const registerMessage = document.getElementById("registerMessage");

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  // Check for empty fields
  if (username === "" || password.trim() === "") {
    alert("Username and password cannot be empty.");
    return;
  }

  try {
    const response = await fetch("/api/register", {
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

    if (response.ok && result.success) {
      registerForm.style.display = "none";

      registerMessage.textContent = "Account successfully created!";
    } else {
      alert(result.message || "Unable to create account.");
    }
  } catch (error) {
    console.error(error);

    alert("Unable to connect to server.");
  }
});
