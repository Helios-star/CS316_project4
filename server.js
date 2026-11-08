const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = process.env.PORT || 3000;

const DATA_DIR = path.join(__dirname, "data");
const ACCOUNTS_FILE = path.join(DATA_DIR, "accounts.json");
const ACCOUNT_FOLDERS = path.join(DATA_DIR, "accounts");

// Temporary in-memory sessions
const sessions = new Map();

// Initialize account storage if it doesn't exist
fs.mkdirSync(ACCOUNT_FOLDERS, { recursive: true });

if (!fs.existsSync(ACCOUNTS_FILE)) {
  fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify({ accounts: [] }, null, 2));
}

// Helper: Send JSON response
function sendJSON(res, status, data, headers = {}) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
    ...headers,
  });

  res.end(JSON.stringify(data));
}

// Helper: Read Account List
function readAccounts() {
  return JSON.parse(fs.readFileSync(ACCOUNTS_FILE, "utf8"));
}

// Helper: Find account
function findAccount(accountId) {
  const data = readAccounts();

  return data.accounts.find(
    (account) => String(account.id) === String(accountId),
  );
}

// Helper: Get account file path
function getAccountFilePath(account) {
  return path.join(ACCOUNT_FOLDERS, String(account.id), "account.json");
}

// Helper: Read request body
function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();

      if (body.length > 100000) {
        reject(new Error("Request too large"));
        req.destroy();
      }
    });

    req.on("end", () => {
      try {
        resolve(JSON.parse(body));
      } catch (error) {
        reject(error);
      }
    });

    req.on("error", reject);
  });
}

// Helper: Get logged-in account ID
function getLoggedInAccount(req) {
  const cookies = req.headers.cookie || "";

  const sessionCookie = cookies
    .split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith("session="));

  if (!sessionCookie) {
    return null;
  }

  const token = sessionCookie.substring("session=".length);
  const session = sessions.get(token);

  if (!session) {
    return null;
  }

  if (Date.now() > session.expires) {
    sessions.delete(token);
    return null;
  }

  return session.accountId;
}

// Helper: Serve public files
function serveFile(req, res) {
  const publicFiles = {
    "/": ["index.html", "text/html"],
    "/index.html": ["index.html", "text/html"],
    "/style.css": ["style.css", "text/css"],
    "/login.js": ["login.js", "application/javascript"],
    "/register.html": ["register.html", "text/html"],
    "/register.js": ["register.js", "application/javascript"],
    "/records.html": ["records.html", "text/html"],
    "/records.js": ["records.js", "application/javascript"],
    "/forms.html": ["forms.html", "text/html"],
    "/forms.js": ["forms.js", "application/javascript"],
  };

  const requestedFile = publicFiles[req.url];

  if (!requestedFile || req.method !== "GET") {
    res.writeHead(404);
    res.end("404 - Not Found");
    return;
  }

  const [filename, contentType] = requestedFile;

  fs.readFile(path.join(__dirname, filename), (error, data) => {
    if (error) {
      res.writeHead(404);
      res.end("404 - File Not Found");
      return;
    }

    res.writeHead(200, {
      "Content-Type": contentType,
    });

    res.end(data);
  });
}

// Main HTTP server
const server = http.createServer(async (req, res) => {
  try {
    // =====================================
    // LOGIN
    // =====================================

    if (req.url === "/api/login" && req.method === "POST") {
      const { username, password } = await readBody(req);

      const accountsData = readAccounts();

      const account = accountsData.accounts.find(
        (user) => user.username === username && user.password === password,
      );

      if (!account) {
        sendJSON(res, 401, {
          success: false,
          message: "Incorrect username or password.",
        });
        return;
      }

      // Generate session
      const token = crypto.randomBytes(32).toString("hex");

      sessions.set(token, {
        accountId: account.id,
        expires: Date.now() + 60 * 60 * 1000,
      });

      sendJSON(
        res,
        200,
        { success: true },
        {
          "Set-Cookie": `session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=3600`,
        },
      );

      return;
    }

    // =====================================
    // CREATE ACCOUNT
    // =====================================

    if (req.url === "/api/register" && req.method === "POST") {
      const { username, password } = await readBody(req);

      if (
        typeof username !== "string" ||
        typeof password !== "string" ||
        username.trim() === "" ||
        password.trim() === ""
      ) {
        sendJSON(res, 400, {
          success: false,
          message: "Username and password are required.",
        });
        return;
      }

      const cleanUsername = username.trim();
      const accountsData = readAccounts();

      // Check duplicate usernames
      const exists = accountsData.accounts.some(
        (account) => account.username === cleanUsername,
      );

      if (exists) {
        sendJSON(res, 409, {
          success: false,
          message: "Username already exists.",
        });
        return;
      }

      // Generate unique ID
      const accountId = crypto.randomUUID();

      // Create account folder
      const accountFolder = path.join(ACCOUNT_FOLDERS, accountId);

      fs.mkdirSync(accountFolder, { recursive: true });

      // Create individual account file
      const accountData = {
        id: accountId,
        username: cleanUsername,
        password: password,
        createdAt: new Date().toISOString(),
        formData: {},
      };

      fs.writeFileSync(
        path.join(accountFolder, "account.json"),
        JSON.stringify(accountData, null, 2),
      );

      // Update Account List
      accountsData.accounts.push({
        id: accountId,
        username: cleanUsername,
        password: password,
        folder: accountId,
      });

      fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(accountsData, null, 2));

      console.log("Account successfully created:");
      console.log("Username:", cleanUsername);
      console.log("Account ID:", accountId);
      console.log("Account List updated:", true);
      console.log("Account JSON created:", true);

      sendJSON(res, 201, {
        success: true,
        message: "Account created successfully.",
      });

      return;
    }

    // =====================================
    // GET ALL ACCOUNT IDs
    // =====================================

    if (req.url === "/api/accounts" && req.method === "GET") {
      const accountsData = readAccounts();

      const accounts = accountsData.accounts.map((account) => ({
        id: account.id,
      }));

      sendJSON(res, 200, accounts);
      return;
    }

    // =====================================
    // GET SELECTED ACCOUNT RECORDS
    // =====================================

    if (req.url.startsWith("/api/accounts/") && req.method === "GET") {
      const accountId = decodeURIComponent(req.url.split("/")[3]);

      const account = findAccount(accountId);

      if (!account) {
        sendJSON(res, 404, {
          error: "Account not found.",
        });
        return;
      }

      const accountFilePath = getAccountFilePath(account);

      const accountData = JSON.parse(fs.readFileSync(accountFilePath, "utf8"));

      // Return form data only, never passwords
      sendJSON(res, 200, {
        id: accountData.id,
        formData: accountData.formData || {},
      });

      return;
    }

    // =====================================
    // LOAD LOGGED-IN ACCOUNT FORM
    // =====================================

    if (req.url === "/api/form" && req.method === "GET") {
      const accountId = getLoggedInAccount(req);

      if (!accountId) {
        sendJSON(res, 401, {
          error: "Not logged in.",
        });
        return;
      }

      const account = findAccount(accountId);

      if (!account) {
        sendJSON(res, 404, {
          error: "Account not found.",
        });
        return;
      }

      const accountFilePath = getAccountFilePath(account);

      const accountData = JSON.parse(fs.readFileSync(accountFilePath, "utf8"));

      sendJSON(res, 200, {
        formData: accountData.formData || null,
      });

      return;
    }

    // =====================================
    // SAVE LOGGED-IN ACCOUNT FORM
    // =====================================

    if (req.url === "/api/form" && req.method === "POST") {
      const accountId = getLoggedInAccount(req);

      if (!accountId) {
        sendJSON(res, 401, {
          error: "Not logged in.",
        });
        return;
      }

      const account = findAccount(accountId);

      if (!account) {
        sendJSON(res, 404, {
          error: "Account not found.",
        });
        return;
      }

      const formData = await readBody(req);

      const accountFilePath = getAccountFilePath(account);

      const accountData = JSON.parse(fs.readFileSync(accountFilePath, "utf8"));

      // Save submitted form information
      accountData.formData = formData;

      fs.writeFileSync(accountFilePath, JSON.stringify(accountData, null, 2));

      sendJSON(res, 200, {
        success: true,
        message: "Form saved successfully.",
      });

      return;
    }

    // =====================================
    // SERVE WEBSITE FILES
    // =====================================

    serveFile(req, res);
  } catch (error) {
    console.error("Server error:", error);

    if (!res.headersSent) {
      sendJSON(res, 500, {
        success: false,
        message: "Internal server error.",
      });
    }
  }
});

// Start server
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
