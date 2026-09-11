import React, { useState } from "react";
import {
  FileText,
  Merge,
  Split,
  Scissors,
  Trash2,
  Layers,
  RotateCw,
  Server,
  ShieldCheck,
  ChevronDown,
  Info,
  CheckCircle2,
  Cpu,
} from "lucide-react";
import { ToolType, PythonServerHealth } from "../types";

interface HeaderProps {
  currentTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  serverHealth: PythonServerHealth;
}

export const Header: React.FC<HeaderProps> = ({
  currentTool,
  onSelectTool,
  serverHealth,
}) => {
  const [showStatusModal, setShowStatusModal] = useState(false);

  const tools: { id: ToolType; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: "merge", label: "Merge PDF", icon: Merge },
    { id: "split", label: "Split PDF", icon: Split },
    { id: "extract", label: "Extract Pages", icon: Scissors },
    { id: "remove", label: "Remove Pages", icon: Trash2 },
    { id: "organize", label: "Organize", icon: Layers },
    { id: "rotate", label: "Rotate PDF", icon: RotateCw },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-zinc-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <div
            id="brand-logo-btn"
            onClick={() => onSelectTool("home")}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-sm group-hover:bg-red-700 transition-colors">
              <FileText className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black tracking-tight text-zinc-900">
                  iLove<span className="text-red-600">PDF</span>
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-zinc-100 text-zinc-600 border border-zinc-200 px-1.5 py-0.5 rounded">
                  Offline
                </span>
              </div>
              <span className="text-[10px] text-zinc-400 font-medium -mt-0.5">
                Local Python Engine
              </span>
            </div>
          </div>

          {/* Navigation Bar for Tools */}
          <nav className="hidden lg:flex items-center gap-1">
            <button
              id="nav-tool-home"
              onClick={() => onSelectTool("home")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                currentTool === "home"
                  ? "bg-zinc-100 text-zinc-900 font-bold"
                  : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
              }`}
            >
              All Tools
            </button>

            {tools.map((t) => {
              const Icon = t.icon;
              const isActive = currentTool === t.id;
              return (
                <button
                  id={`nav-tool-${t.id}`}
                  key={t.id}
                  onClick={() => onSelectTool(t.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                    isActive
                      ? "bg-red-50 text-red-600 font-bold"
                      : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Python Server Status Indicator */}
          <div className="flex items-center gap-2">
            <button
              id="python-server-status-pill"
              onClick={() => setShowStatusModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 transition-colors text-xs font-medium text-zinc-700 cursor-pointer"
              title="Click to view Local Python Processing Server status"
            >
              <div className="relative flex items-center justify-center">
                <span
                  className={`w-2 h-2 rounded-full ${
                    serverHealth.status === "connected"
                      ? "bg-emerald-500 animate-pulse"
                      : "bg-amber-500"
                  }`}
                />
              </div>
              <span className="hidden sm:inline font-semibold">
                Python 3.10 + PyPDF
              </span>
              <span className="text-[10px] text-zinc-400">127.0.0.1:{serverHealth.port}</span>
              <ChevronDown className="w-3 h-3 text-zinc-400" />
            </button>
          </div>
        </div>

        {/* Mobile secondary tab row */}
        <div className="lg:hidden flex items-center gap-1 overflow-x-auto px-4 py-2 border-t border-zinc-100 scrollbar-none bg-zinc-50/60">
          <button
            onClick={() => onSelectTool("home")}
            className={`px-3 py-1 text-xs font-semibold rounded-md whitespace-nowrap ${
              currentTool === "home" ? "bg-zinc-200 text-zinc-900" : "text-zinc-600"
            }`}
          >
            All Tools
          </button>
          {tools.map((t) => (
            <button
              key={t.id}
              onClick={() => onSelectTool(t.id)}
              className={`px-3 py-1 text-xs font-semibold rounded-md whitespace-nowrap ${
                currentTool === t.id
                  ? "bg-red-600 text-white"
                  : "text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      {/* Local Python Engine Status Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            id="python-status-dialog"
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-zinc-200 animate-in fade-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-zinc-900 text-white flex items-center justify-center">
                  <Server className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900 text-base">
                    Local Python PDF Processing Server
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Offline architecture & execution status
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-emerald-800">
                    100% Offline & Private
                  </div>
                  <div className="text-emerald-700 text-[11px] mt-0.5 leading-relaxed">
                    Your PDF files never leave your device. All merge, split, extract,
                    reorder, and rotate algorithms are executed locally on your machine
                    by the local Python daemon.
                  </div>
                </div>
              </div>

              <div className="bg-zinc-50 rounded-xl p-3.5 border border-zinc-200 space-y-2 font-mono text-[11px]">
                <div className="flex justify-between items-center text-zinc-600">
                  <span>Backend Engine:</span>
                  <span className="font-bold text-zinc-900">{serverHealth.engine}</span>
                </div>
                <div className="flex justify-between items-center text-zinc-600">
                  <span>Python Server Address:</span>
                  <span className="font-bold text-zinc-900">http://127.0.0.1:{serverHealth.port}</span>
                </div>
                <div className="flex justify-between items-center text-zinc-600">
                  <span>Processing Library:</span>
                  <span className="font-bold text-emerald-600">pypdf 6.18.0 (Pure-Python)</span>
                </div>
                <div className="flex justify-between items-center text-zinc-600">
                  <span>UI Web Server:</span>
                  <span className="font-bold text-zinc-900">Express + Vite (Port 3000)</span>
                </div>
                <div className="flex justify-between items-center text-zinc-600">
                  <span>Status:</span>
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Operational
                  </span>
                </div>
              </div>

              <div className="p-3 bg-zinc-100 rounded-xl text-zinc-600 text-[11px] leading-relaxed flex items-start gap-2">
                <Info className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                <span>
                  Supported operations: PDF Merging, Custom Range Splitting, Individual
                  Page Extraction to ZIP, Page Removal, Visual Sequence Reordering, and
                  Page Angle Rotation (90°, 180°, 270°).
                </span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                id="close-status-dialog-btn"
                type="button"
                onClick={() => setShowStatusModal(false)}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
