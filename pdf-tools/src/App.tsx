import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { ToolGrid } from "./components/ToolGrid";
import { ResultModal } from "./components/ResultModal";
import { MergeTool } from "./components/tools/MergeTool";
import { SplitTool } from "./components/tools/SplitTool";
import { ExtractTool } from "./components/tools/ExtractTool";
import { RemoveTool } from "./components/tools/RemoveTool";
import { OrganizeTool } from "./components/tools/OrganizeTool";
import { RotateTool } from "./components/tools/RotateTool";
import { ToolType, ProcessResult, PythonServerHealth, PDFFileItem } from "./types";
import { createSamplePdfDocument } from "./utils/samplePdfs";

export default function App() {
  const [currentTool, setCurrentTool] = useState<ToolType>("home");
  const [currentResult, setCurrentResult] = useState<ProcessResult | null>(null);
  const [stagedFiles, setStagedFiles] = useState<PDFFileItem[]>([]);
  const [serverHealth, setServerHealth] = useState<PythonServerHealth>({
    status: "connected",
    port: 5001,
    engine: "Python 3.10 + pypdf 6.18.0",
    offlineMode: true,
  });

  // Check health on mount and periodically
  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await fetch("/api/health");
        if (res.ok) {
          const data = await res.json();
          if (data.pythonServer) {
            setServerHealth({
              status: data.pythonServer.status === "connected" ? "connected" : "starting",
              port: data.pythonServer.port || 5001,
              engine: data.pythonServer.engine || "Python 3.10 + pypdf 6.18.0",
              offlineMode: true,
            });
          }
        }
      } catch (e) {
        console.warn("Server health poll error:", e);
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectTool = (tool: ToolType) => {
    setCurrentTool(tool);
    setCurrentResult(null);
    setStagedFiles([]);
  };

  const handleQuickSample = async (tool: ToolType) => {
    try {
      if (tool === "merge") {
        const doc1 = await createSamplePdfDocument(
          "Project Proposal & Specs",
          "Business Report",
          3,
          { r: 0.15, g: 0.38, b: 0.92 }
        );
        const doc2 = await createSamplePdfDocument(
          "Financial Forecast 2026",
          "Financial Summary",
          2,
          { r: 0.88, g: 0.34, b: 0.15 }
        );
        setStagedFiles([doc1, doc2]);
      } else {
        const doc = await createSamplePdfDocument(
          "Enterprise Operations Audit",
          "Business Report",
          4,
          { r: 0.08, g: 0.62, b: 0.52 }
        );
        setStagedFiles([doc]);
      }
      setCurrentTool(tool);
      setCurrentResult(null);
    } catch (e) {
      console.error("Error generating quick sample:", e);
      setCurrentTool(tool);
    }
  };

  const handleResult = (result: ProcessResult) => {
    setCurrentResult(result);
  };

  const handleResetCurrent = () => {
    setCurrentResult(null);
    setStagedFiles([]);
  };

  const renderActiveTool = () => {
    if (currentResult) {
      return (
        <ResultModal
          result={currentResult}
          onReset={handleResetCurrent}
          onBackToHome={() => handleSelectTool("home")}
        />
      );
    }

    switch (currentTool) {
      case "merge":
        return (
          <MergeTool
            key={`merge-${stagedFiles.length}`}
            initialFiles={stagedFiles}
            onResult={handleResult}
          />
        );
      case "split":
        return (
          <SplitTool
            key={`split-${stagedFiles[0]?.id || "none"}`}
            initialFile={stagedFiles[0]}
            onResult={handleResult}
          />
        );
      case "extract":
        return (
          <ExtractTool
            key={`extract-${stagedFiles[0]?.id || "none"}`}
            initialFile={stagedFiles[0]}
            onResult={handleResult}
          />
        );
      case "remove":
        return (
          <RemoveTool
            key={`remove-${stagedFiles[0]?.id || "none"}`}
            initialFile={stagedFiles[0]}
            onResult={handleResult}
          />
        );
      case "organize":
        return (
          <OrganizeTool
            key={`organize-${stagedFiles[0]?.id || "none"}`}
            initialFile={stagedFiles[0]}
            onResult={handleResult}
          />
        );
      case "rotate":
        return (
          <RotateTool
            key={`rotate-${stagedFiles[0]?.id || "none"}`}
            initialFile={stagedFiles[0]}
            onResult={handleResult}
          />
        );
      case "home":
      default:
        return (
          <ToolGrid
            onSelectTool={handleSelectTool}
            onQuickSample={handleQuickSample}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-zinc-900 flex flex-col font-sans antialiased selection:bg-red-100 selection:text-red-900">
      <Header
        currentTool={currentTool}
        onSelectTool={handleSelectTool}
        serverHealth={serverHealth}
      />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col items-center">
        {renderActiveTool()}
      </main>

      {/* Footer */}
      <footer className="w-full bg-white border-t border-zinc-200 py-6 text-center text-xs text-zinc-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-zinc-700">iLovePDF Offline Clone</span>
            <span>•</span>
            <span>Local Python Engine (pypdf 6.18.0)</span>
          </div>
          <div className="flex items-center gap-4 text-zinc-500">
            <span>Merge PDF</span>
            <span>Split PDF</span>
            <span>Extract Pages</span>
            <span>Remove Pages</span>
            <span>Organize</span>
            <span>Rotate</span>
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>100% Offline & Private</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
