const accountSelect = document.getElementById("accountSelect");
const recordsBody = document.getElementById("recordsBody");
const recordsMessage = document.getElementById("recordsMessage");

// Load account IDs
async function loadAccounts() {
  try {
    const response = await fetch("/api/accounts");

    if (!response.ok) {
      throw new Error("Unable to retrieve accounts.");
    }

    const accounts = await response.json();

    accounts.forEach((account) => {
      const option = document.createElement("option");

      option.value = account.id;
      option.textContent = account.id;

      accountSelect.appendChild(option);
    });
  } catch (error) {
    console.error(error);
    recordsMessage.textContent = "Unable to load accounts.";
  }
}

// Display selected account data
async function loadAccountRecords(accountId) {
  recordsBody.innerHTML = "";
  recordsMessage.textContent = "";

  if (!accountId) {
    return;
  }

  try {
    const response = await fetch(
      `/api/accounts/${encodeURIComponent(accountId)}`,
    );

    if (!response.ok) {
      throw new Error("Unable to retrieve account data.");
    }

    const account = await response.json();

    // Display form data
    const formData = account.formData || {};

    if (Object.keys(formData).length === 0) {
      recordsMessage.textContent =
        "No form data has been submitted for this account.";
      return;
    }

    for (const [field, value] of Object.entries(formData)) {
      const row = document.createElement("tr");

      const fieldCell = document.createElement("td");
      const valueCell = document.createElement("td");

      fieldCell.textContent = field;

      if (value === null || value === undefined || value === "") {
        valueCell.textContent = "Not Provided";
        valueCell.classList.add("empty-field");
      } else {
        valueCell.textContent = value;
      }

      row.appendChild(fieldCell);
      row.appendChild(valueCell);

      recordsBody.appendChild(row);
    }
  } catch (error) {
    console.error(error);

    recordsMessage.textContent = "Unable to load account records.";
  }
}

// Account selection event
accountSelect.addEventListener("change", () => {
  loadAccountRecords(accountSelect.value);
});

// Load accounts when page opens
loadAccounts();
