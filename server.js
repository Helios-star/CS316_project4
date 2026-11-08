const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {

    let filePath;

    // Default page
    if (req.url === "/") {
        filePath = "index.html";
    } else {
        filePath = req.url.substring(1);
    }

    const ext = path.extname(filePath);

    const contentTypes = {
        ".html": "text/html",
        ".css": "text/css",
        ".js": "application/javascript",
        ".json": "application/json",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg"
    };

    const contentType =
        contentTypes[ext] || "text/plain";

    fs.readFile(filePath, (err, data) => {

        if (err) {
            res.writeHead(404, {
                "Content-Type": "text/plain"
            });

            res.end("404 - File Not Found");
            return;
        }

        res.writeHead(200, {
            "Content-Type": contentType
        });

        res.end(data);

    });

});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});