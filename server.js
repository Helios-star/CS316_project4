const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  // Handle account registration
  if (req.url === "/api/register" && req.method === "POST") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      try {
        const { username, password } = JSON.parse(body);

        // Validate input
        if (
          typeof username !== "string" ||
          typeof password !== "string" ||
          username.trim() === "" ||
          password.trim() === ""
        ) {
          res.writeHead(400, {
            "Content-Type": "application/json",
          });

          res.end(
            JSON.stringify({
              success: false,
              message: "Username and password are required.",
            }),
          );

          return;
        }

        const cleanUsername = username.trim();

        const accountsPath = path.join(__dirname, "data", "accounts.json");

        // Read existing accounts
        const accountsData = JSON.parse(fs.readFileSync(accountsPath, "utf8"));

        // Check duplicate username
        const exists = accountsData.accounts.some(
          (account) => account.username === cleanUsername,
        );

        if (exists) {
          res.writeHead(409, {
            "Content-Type": "application/json",
          });

          res.end(
            JSON.stringify({
              success: false,
              message: "Username already exists.",
            }),
          );

          return;
        }

        // Generate unique account ID
        const accountId = crypto.randomUUID();

        // Create account folder
        const accountFolder = path.join(
          __dirname,
          "data",
          "accounts",
          accountId,
        );

        fs.mkdirSync(accountFolder, {
          recursive: true,
        });

        // Create account JSON file
        const accountFile = {
          id: accountId,
          username: cleanUsername,
          password: password,
          createdAt: new Date().toISOString(),
          records: [],
        };

        fs.writeFileSync(
          path.join(accountFolder, "account.json"),
          JSON.stringify(accountFile, null, 2),
        );

        // Add account to Account List
        accountsData.accounts.push({
          id: accountId,
          username: cleanUsername,
          password: password,
          folder: accountId,
        });

        // Save updated Account List
        fs.writeFileSync(accountsPath, JSON.stringify(accountsData, null, 2));

        console.log("Account successfully created:");
        console.log("Username:", cleanUsername);
        console.log("Account ID:", accountId);
        console.log("Account folder:", accountFolder);

        console.log(
          "Account List updated:",
          accountsData.accounts.some((account) => account.id === accountId),
        );

        console.log(
          "Account JSON created:",
          fs.existsSync(path.join(accountFolder, "account.json")),
        );

        // Return success
        res.writeHead(201, {
          "Content-Type": "application/json",
        });

        res.end(
          JSON.stringify({
            success: true,
            message: "Account created successfully.",
          }),
        );
      } catch (error) {
        console.error(error);

        res.writeHead(500, {
          "Content-Type": "application/json",
        });

        res.end(
          JSON.stringify({
            success: false,
            message: "Server error.",
          }),
        );
      }
    });

    return;
  }
  // Handle login requests
  if (req.url === "/api/login" && req.method === "POST") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      try {
        const { username, password } = JSON.parse(body);

        // Read Account List JSON
        const accountsData = JSON.parse(
          fs.readFileSync(
            path.join(__dirname, "data", "accounts.json"),
            "utf8",
          ),
        );

        // Find matching account
        const account = accountsData.accounts.find(
          (user) => user.username === username && user.password === password,
        );

        res.writeHead(200, {
          "Content-Type": "application/json",
        });

        res.end(
          JSON.stringify({
            success: !!account,
          }),
        );
      } catch (error) {
        console.error(error);

        res.writeHead(500, {
          "Content-Type": "application/json",
        });

        res.end(
          JSON.stringify({
            success: false,
          }),
        );
      }
    });

    return;
  }

  // Only serve approved public files
  const publicFiles = {
    "/": ["index.html", "text/html"],
    "/index.html": ["index.html", "text/html"],
    "/style.css": ["style.css", "text/css"],
    "/login.js": ["login.js", "application/javascript"],
    "/records.html": ["records.html", "text/html"],
    "/register.html": ["register.html", "text/html"],
    "/register.js": ["register.js", "application/javascript"],
  };

  const requestedFile = publicFiles[req.url];

  if (!requestedFile || req.method !== "GET") {
    res.writeHead(404);
    res.end("404 - Not Found");
    return;
  }

  const [filename, contentType] = requestedFile;

  fs.readFile(path.join(__dirname, filename), (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("404 - File Not Found");
      return;
    }

    res.writeHead(200, {
      "Content-Type": contentType,
    });

    res.end(data);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
