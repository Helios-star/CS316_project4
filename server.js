const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
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
      res.end("404 - Not Found");
      return;
    }

    res.writeHead(200, {
      "Content-Type": contentType,
    });

    res.end(data);
  });

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, {
        "Content-Type": "text/plain",
      });

      res.end("404 - File Not Found");
      return;
    }

    res.writeHead(200, {
      "Content-Type": contentType,
    });

    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
