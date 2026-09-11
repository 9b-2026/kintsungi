import React from "react";
import {
  Merge,
  Split,
  Scissors,
  Trash2,
  Layers,
  RotateCw,
  Sparkles,
  ShieldCheck,
  Server,
  Zap,
  ArrowRight,
} from "lucide-react";
import { ToolType } from "../types";

interface ToolGridProps {
  onSelectTool: (tool: ToolType) => void;
  onQuickSample: (tool: ToolType) => void;
}

export const ToolGrid: React.FC<ToolGridProps> = ({ onSelectTool, onQuickSample }) => {
  const tools = [
    {
      id: "merge" as ToolType,
      title: "Merge PDF",
      description: "Combine multiple PDFs in the order you want with the easiest PDF merger available.",
      icon: Merge,
      color: "bg-red-50 text-red-600 border-red-200 group-hover:bg-red-600 group-hover:text-white",
      tag: "Most Popular",
    },
    {
      id: "split" as ToolType,
      title: "Split PDF",
      description: "Separate one page or a whole set for easy conversion into independent PDF files.",
      icon: Split,
      color: "bg-orange-50 text-orange-600 border-orange-200 group-hover:bg-orange-600 group-hover:text-white",
      tag: "Range or Single",
    },
    {
      id: "extract" as ToolType,
      title: "Extract Pages",
      description: "Pick specific pages visually from your document and export them into a dedicated PDF file.",
      icon: Scissors,
      color: "bg-amber-50 text-amber-600 border-amber-200 group-hover:bg-amber-600 group-hover:text-white",
      tag: "Visual Select",
    },
    {
      id: "remove" as ToolType,
      title: "Remove Pages",
      description: "Delete unwanted pages from your document. Select individual pages to discard.",
      icon: Trash2,
      color: "bg-rose-50 text-rose-600 border-rose-200 group-hover:bg-rose-600 group-hover:text-white",
      tag: "Page Eraser",
    },
    {
      id: "organize" as ToolType,
      title: "Organize PDF",
      description: "Sort, swap, duplicate, and reorder the pages of your PDF document in any custom sequence.",
      icon: Layers,
      color: "bg-emerald-50 text-emerald-600 border-emerald-200 group-hover:bg-emerald-600 group-hover:text-white",
      tag: "Drag & Reorder",
    },
    {
      id: "rotate" as ToolType,
      title: "Rotate PDF",
      description: "Rotate all or individual PDF pages 90°, 180°, or 270° degrees to fix landscape/portrait orientation.",
      icon: RotateCw,
      color: "bg-blue-50 text-blue-600 border-blue-200 group-hover:bg-blue-600 group-hover:text-white",
      tag: "Angle Adjust",
    },
  ];

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 sm:py-12">
      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 border border-red-200/80 text-red-700 text-xs font-bold mb-4 shadow-2xs">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>100% Offline • Processed Locally via Python</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-zinc-900 tracking-tight leading-tight">
          Every tool you need to work with PDFs in one place
        </h1>
        <p className="mt-4 text-base sm:text-lg text-zinc-600 leading-relaxed">
          The offline clone of iLovePDF powered by a local Python server. Merge,
          split, extract, remove, organize, and rotate your PDF documents with
          complete privacy.
        </p>
      </div>

      {/* Grid of 6 Main PDF Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <div
              id={`tool-card-${tool.id}`}
              key={tool.id}
              onClick={() => onSelectTool(tool.id)}
              className="group relative bg-white rounded-3xl p-6 border border-zinc-200 hover:border-zinc-300 shadow-xs hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors duration-200 border ${tool.color}`}
                  >
                    <Icon className="w-7 h-7 stroke-[1.9]" />
                  </div>
                  <span className="text-[11px] font-bold tracking-wide uppercase px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-600 border border-zinc-200">
                    {tool.tag}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-zinc-900 group-hover:text-red-600 transition-colors">
                  {tool.title}
                </h3>
                <p className="mt-2 text-sm text-zinc-500 leading-relaxed line-clamp-3">
                  {tool.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between text-xs">
                <span className="font-bold text-red-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <span>Open tool</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuickSample(tool.id);
                  }}
                  className="font-medium text-zinc-400 hover:text-zinc-700 flex items-center gap-1 hover:underline p-1"
                  title="Quick load with sample document"
                >
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>Sample</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Feature Guarantee Banner */}
      <div className="mt-14 rounded-3xl bg-zinc-900 text-white p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center text-red-500 shrink-0">
            <Server className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base font-bold text-white">
              Local Python Subprocess & Pure Privacy Architecture
            </h4>
            <p className="mt-1 text-xs text-zinc-400 max-w-xl leading-relaxed">
              PDF bytes are streamed strictly to your local host at{" "}
              <code className="bg-zinc-800 text-emerald-400 px-1 py-0.5 rounded text-[11px]">
                127.0.0.1:5001
              </code>{" "}
              for Python processing. No tracking, no cloud storage, no rate limits.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center gap-2 text-xs">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="font-semibold text-zinc-300">Fast In-Memory</span>
          </div>
          <div className="px-3 py-2 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center gap-2 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-zinc-300">Offline Safe</span>
          </div>
        </div>
      </div>
    </div>
  );
};
