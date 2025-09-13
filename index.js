import http from "http";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";

const PORT = 3002;

// Load existing URLs if file exists
let url = {};
if (fs.existsSync("url.json")) {
  url = JSON.parse(fs.readFileSync("url.json", "utf-8"));
}

function saveUrl(url) {
  fs.writeFileSync("url.json", JSON.stringify(url, null, 2));
}

const server = http.createServer((req, res) => {
  if (req.method === "POST" && req.url === "/api/v1/shorten") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      try {
        const { originalUrl } = JSON.parse(body);

        if (!originalUrl) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Invalid request" }));
          return;
        }

        let shortId = uuidv4().slice(0, 6);
        url[shortId] = originalUrl;
        saveUrl(url);

        res.writeHead(201, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({ shortUrl: `http://localhost:${PORT}/${shortId}` })
        );
      } catch (error) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Internal server error" }));
        console.log(error);
      }
    });
  } else if (req.method === "GET") {
    const shortId = req.url.slice(1); // ✅ Extract shortId from path

    if (url[shortId]) {
      res.writeHead(302, { Location: url[shortId] });
      res.end();
    } else {
      res.writeHead(404, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Not found" }));
    }
  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Route not found" }));
  }
});

server.listen(PORT, () => {
  console.log(`Server started at http://localhost:${PORT}`);
});

console.log("Server started", uuidv4());
