const accountForm = document.getElementById("accountForm");
const formMessage = document.getElementById("formMessage");

// Load previously submitted form data
async function loadFormData() {
  try {
    const response = await fetch("/api/form");

    if (response.status === 401) {
      window.location.href = "/";
      return;
    }

    if (!response.ok) {
      throw new Error("Unable to load form data");
    }

    const data = await response.json();

    if (!data.formData) {
      return;
    }

    const form = data.formData;

    document.getElementById("fullName").value = form.fullName ?? "";

    document.getElementById("age").value = form.age ?? "";

    document.getElementById("favoriteColor").value = form.favoriteColor ?? "";

    document
      .querySelectorAll('input[name="contactMethod"]')
      .forEach((radio) => {
        radio.checked = radio.value === form.contactMethod;
      });

    document.getElementById("newsletter").checked = form.newsletter === true;

    document.getElementById("comments").value = form.comments ?? "";
  } catch (error) {
    console.error(error);

    formMessage.textContent = "Unable to load previous form information.";
  }
}

// Submit form data
accountForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const selectedContact = document.querySelector(
    'input[name="contactMethod"]:checked',
  );

  const formData = {
    fullName: document.getElementById("fullName").value,

    age: document.getElementById("age").value,

    favoriteColor: document.getElementById("favoriteColor").value,

    contactMethod: selectedContact ? selectedContact.value : "",

    newsletter: document.getElementById("newsletter").checked,

    comments: document.getElementById("comments").value,
  };

  try {
    const response = await fetch("/api/form", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(formData),
    });

    if (response.status === 401) {
      window.location.href = "/";
      return;
    }

    if (!response.ok) {
      throw new Error("Unable to save form data");
    }

    formMessage.textContent = "Form submitted successfully!";
  } catch (error) {
    console.error(error);

    formMessage.textContent = "Unable to save form information.";
  }
});

// Load saved information when page opens
loadFormData();
