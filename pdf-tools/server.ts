import express from "express";
import path from "path";
import { spawn, ChildProcess } from "child_process";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;
const PYTHON_PORT = 5001;

// Increase payload limit for PDF base64 handling (up to 50MB)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Child process manager for local Python server
let pythonProcess: ChildProcess | null = null;
let pythonHealthy = false;

function startPythonServer() {
  const scriptPath = path.join(process.cwd(), "python_server.py");
  const pythonPackagesPath = path.join(process.cwd(), "python_packages");

  console.log(`[Node] Spawning local Python server at port ${PYTHON_PORT}...`);
  pythonProcess = spawn("python3", [scriptPath, String(PYTHON_PORT)], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PYTHONPATH: `${pythonPackagesPath}:${process.env.PYTHONPATH || ""}`,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  pythonProcess.stdout?.on("data", (data) => {
    console.log(`[Python Server stdout]: ${data.toString().trim()}`);
  });

  pythonProcess.stderr?.on("data", (data) => {
    console.warn(`[Python Server stderr]: ${data.toString().trim()}`);
  });

  pythonProcess.on("exit", (code, signal) => {
    console.warn(`[Python Server exited] code=${code} signal=${signal}. Restarting in 2s...`);
    pythonHealthy = false;
    setTimeout(startPythonServer, 2000);
  });

  // Verify health
  setTimeout(checkPythonHealth, 1000);
}

async function checkPythonHealth() {
  try {
    const res = await fetch(`http://127.0.0.1:${PYTHON_PORT}/health`);
    if (res.ok) {
      const data = await res.json();
      pythonHealthy = true;
      console.log(`[Node] Python server verified healthy:`, data);
      return true;
    }
  } catch (err) {
    pythonHealthy = false;
  }
  return false;
}

// Proxy helper with fallback and retry
async function forwardToPython(endpoint: string, method: string = "POST", payload: any = null) {
  const url = `http://127.0.0.1:${PYTHON_PORT}${endpoint}`;
  try {
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: payload ? JSON.stringify(payload) : undefined,
    });
    return await response.json();
  } catch (err: any) {
    console.error(`[Node] Error calling Python server at ${url}:`, err.message);
    throw new Error(`Local Python processing server error: ${err.message}`);
  }
}

// ================= API ROUTES =================

// Health check endpoint
app.get("/api/health", async (req, res) => {
  const pyOk = await checkPythonHealth();
  res.json({
    status: "ok",
    nodeServer: "running",
    port: PORT,
    pythonServer: {
      status: pyOk ? "connected" : "starting",
      port: PYTHON_PORT,
      engine: "Python 3.10 + pypdf 6.18.0",
      offlineMode: true,
    },
  });
});

// Sample PDF generator for immediate testing
app.get("/api/pdf/sample/:type", async (req, res) => {
  const sampleType = req.params.type || "basic";
  try {
    // Generate sample PDF via python
    const pagesCount = sampleType === "large" ? 6 : sampleType === "two" ? 2 : 4;
    const title =
      sampleType === "invoice"
        ? "Invoice_Document_2026.pdf"
        : sampleType === "report"
        ? "Quarterly_Analytics_Report.pdf"
        : `Sample_Document_${pagesCount}p.pdf`;

    // Forward to python or use python_server CLI/import
    const pyResult = await forwardToPython("/api/merge", "POST", {
      files: [], // If none, python can return a sample or we create one
      sampleType,
      pagesCount,
      outputFilename: title,
    }).catch(async () => {
      // Fallback direct creation
      return null;
    });

    if (pyResult && pyResult.pdfBase64) {
      res.json(pyResult);
    } else {
      // Fallback simple 3-page PDF via script
      const { execSync } = await import("child_process");
      const out = execSync(
        `python3 -c "import sys, io, base64; sys.path.insert(0, './python_packages'); import python_server; b = python_server.create_sample_pdf(pages=${pagesCount}); print(base64.b64encode(b).decode())"`
      ).toString().trim();
      res.json({
        success: true,
        filename: title,
        totalPages: pagesCount,
        pdfBase64: out,
      });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PDF Info / Inspect
app.post("/api/pdf/info", async (req, res) => {
  try {
    const result = await forwardToPython("/api/info", "POST", req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 1. Merge PDF
app.post("/api/pdf/merge", async (req, res) => {
  try {
    const result = await forwardToPython("/api/merge", "POST", req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Split PDF
app.post("/api/pdf/split", async (req, res) => {
  try {
    const result = await forwardToPython("/api/split", "POST", req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Extract Pages
app.post("/api/pdf/extract", async (req, res) => {
  try {
    const result = await forwardToPython("/api/extract", "POST", req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Remove Pages
app.post("/api/pdf/remove", async (req, res) => {
  try {
    const result = await forwardToPython("/api/remove", "POST", req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Organize / Reorder Pages
app.post("/api/pdf/organize", async (req, res) => {
  try {
    const result = await forwardToPython("/api/organize", "POST", req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Rotate PDF
app.post("/api/pdf/rotate", async (req, res) => {
  try {
    const result = await forwardToPython("/api/rotate", "POST", req.body);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ================= VITE / FRONTEND SERVING =================

async function startServer() {
  // Launch local python backend
  startPythonServer();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Express] iLovePDF offline clone running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
