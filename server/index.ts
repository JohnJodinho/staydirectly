import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import http, { RequestOptions } from "http";
import https from "https";
import dotenv from "dotenv";
dotenv.config();

const app = express();



// Log full url:
app.use((req: Request, _res: Response, next: NextFunction) => {
  const fullUrl = `${req.method}: ${req.protocol}://${req.get("host")}${req.originalUrl}`;
  console.log("[request] Full URL:",  fullUrl);
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Log all external requests from server side:
const originalHttpRequest = http.request;
http.request = function (
  url: string | URL | RequestOptions,
  options?: RequestOptions | ((res: http.IncomingMessage) => void),
  callback?: (res: http.IncomingMessage) => void
) {
  const method = typeof url === "object" && "method" in url ? url.method : "GET";
  let fullUrl = "";

  if (typeof url === "string") {
    fullUrl = url;
  } else if (url instanceof URL) {
    fullUrl = url.href;
  } else if (typeof url === "object") {
    fullUrl = `${url.protocol || "http:"}//${url.hostname}${url.path || ""}`;
  }

  console.log(`[outgoing request] ${method} ${fullUrl}`);

  return typeof options === "function"
    ? originalHttpRequest.call(http, url, options)
    : originalHttpRequest.call(http, url, options as RequestOptions, callback);
};

const originalHttpsRequest = https.request;
https.request = function (
  url: string | URL | RequestOptions,
  options?: RequestOptions | ((res: http.IncomingMessage) => void),
  callback?: (res: http.IncomingMessage) => void
) {
  const method = typeof url === "object" && "method" in url ? url.method : "GET";
  let fullUrl = "";

  if (typeof url === "string") {
    fullUrl = url;
  } else if (url instanceof URL) {
    fullUrl = url.href;
  } else if (typeof url === "object") {
    fullUrl = `${url.protocol || "https:"}//${url.hostname}${url.path || ""}`;
  }

  console.log(`[outgoing request] ${method} ${fullUrl}`);

  return typeof options === "function"
    ? originalHttpsRequest.call(https, url, options)
    : originalHttpsRequest.call(https, url, options as RequestOptions, callback);
};

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
 

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  // serveStatic(app);
  

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);

  server.listen(
  {
    port,
    host: "0.0.0.0",
    // reusePort: true,
  },
  () => {
    log(`serving on port ${port}`);
  }
).on("error", (err) => {
  console.error(`❌ Failed to start server on port ${port}:`, err.message);
  console.error(err);
  process.exit(1);
});
})();

