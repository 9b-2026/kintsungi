import React, { useState } from "react";
import {
  Split,
  Layers,
  FileArchive,
  Loader2,
  AlertCircle,
  Sparkles,
  Info,
} from "lucide-react";
import { PDFFileItem, ProcessResult } from "../../types";
import { FileUploadArea } from "../FileUploadArea";
import { PageThumbnail } from "../PageThumbnail";

interface SplitToolProps {
  initialFile?: PDFFileItem;
  onResult: (result: ProcessResult) => void;
}

export const SplitTool: React.FC<SplitToolProps> = ({ initialFile, onResult }) => {
  const [file, setFile] = useState<PDFFileItem | null>(initialFile || null);
  const [splitMode, setSplitMode] = useState<"extract_ranges" | "all">("extract_ranges");
  const [rangesInput, setRangesInput] = useState<string>("1-2");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileSelected = (files: PDFFileItem[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      const total = files[0].totalPages || 2;
      setRangesInput(`1-${Math.max(1, Math.floor(total / 2))}`);
    }
  };

  const handleSplit = async () => {
    if (!file) return;
    setIsProcessing(true);
    setErrorMessage(null);
    const startTime = performance.now();

    try {
      const payload = {
        pdfBase64: file.base64,
        mode: splitMode,
        ranges: rangesInput,
        outputFilename:
          splitMode === "all"
            ? `${file.name.replace(".pdf", "")}_all_pages.zip`
            : `${file.name.replace(".pdf", "")}_split.pdf`,
      };

      const response = await fetch("/api/pdf/split", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Python server split operation failed.");
      }

      const durationMs = Math.round(performance.now() - startTime);

      onResult({
        success: true,
        filename: data.filename,
        mimeType: data.mimeType,
        dataBase64: data.dataBase64,
        dataUrl: `data:${data.mimeType};base64,${data.dataBase64}`,
        pagesOrFiles: data.pagesOrFiles,
        sizeBytes: data.sizeBytes,
        durationMs,
        toolUsed: "split",
      });
    } catch (err: any) {
      setErrorMessage(err.message || "Split operation failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!file) {
    return (
      <div className="w-full max-w-4xl mx-auto py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Split PDF file</h2>
          <p className="mt-2 text-sm text-zinc-500">
            Separate one page or a whole set for easy conversion into independent PDF files.
          </p>
        </div>

        <FileUploadArea
          onFilesSelected={handleFileSelected}
          title="Select PDF file to Split"
          sampleLabel="Use 4-Page Sample Document"
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto py-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-zinc-200">
        <div>
          <h2 className="text-2xl font-black text-zinc-900 tracking-tight flex items-center gap-2.5">
            <Split className="w-6 h-6 text-orange-600" />
            <span>Split PDF document</span>
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            File: <span className="font-bold text-zinc-800">{file.name}</span> ({file.totalPages} pages)
          </p>
        </div>

        <button
          id="change-file-btn"
          type="button"
          onClick={() => setFile(null)}
          className="px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors"
        >
          Change File
        </button>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Split Mode Selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <div
          id="split-mode-ranges"
          onClick={() => setSplitMode("extract_ranges")}
          className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
            splitMode === "extract_ranges"
              ? "border-orange-500 bg-orange-50/30 shadow-xs"
              : "border-zinc-200 bg-white hover:border-zinc-300"
          }`}
        >
          <div className="flex items-center gap-2.5 mb-2">
            <Layers className="w-5 h-5 text-orange-600" />
            <span className="font-bold text-sm text-zinc-900">Custom Page Ranges</span>
          </div>
          <p className="text-xs text-zinc-500 mb-4">
            Extract selected page spans (e.g. 1-2, or multiple ranges) into new PDF document(s).
          </p>

          {splitMode === "extract_ranges" && (
            <div className="space-y-2 pt-2 border-t border-orange-100" onClick={(e) => e.stopPropagation()}>
              <label className="text-[11px] font-bold text-zinc-700 block">
                Page Range(s):
              </label>
              <input
                id="split-range-input"
                type="text"
                value={rangesInput}
                onChange={(e) => setRangesInput(e.target.value)}
                placeholder="e.g. 1-2, 3-4"
                className="w-full px-3 py-2 text-xs border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white font-mono"
              />
              <div className="flex gap-2 pt-1 text-[10px]">
                <button
                  type="button"
                  onClick={() => setRangesInput(`1-${Math.max(1, Math.floor(file.totalPages / 2))}`)}
                  className="px-2 py-0.5 bg-zinc-100 hover:bg-zinc-200 rounded text-zinc-600"
                >
                  First Half
                </button>
                <button
                  type="button"
                  onClick={() => setRangesInput(`${Math.ceil(file.totalPages / 2)}-${file.totalPages}`)}
                  className="px-2 py-0.5 bg-zinc-100 hover:bg-zinc-200 rounded text-zinc-600"
                >
                  Second Half
                </button>
                <button
                  type="button"
                  onClick={() => setRangesInput(`1, ${file.totalPages}`)}
                  className="px-2 py-0.5 bg-zinc-100 hover:bg-zinc-200 rounded text-zinc-600"
                >
                  First & Last
                </button>
              </div>
            </div>
          )}
        </div>

        <div
          id="split-mode-all"
          onClick={() => setSplitMode("all")}
          className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
            splitMode === "all"
              ? "border-orange-500 bg-orange-50/30 shadow-xs"
              : "border-zinc-200 bg-white hover:border-zinc-300"
          }`}
        >
          <div className="flex items-center gap-2.5 mb-2">
            <FileArchive className="w-5 h-5 text-orange-600" />
            <span className="font-bold text-sm text-zinc-900">Extract All Pages into ZIP</span>
          </div>
          <p className="text-xs text-zinc-500 mb-4">
            Converts every page into an individual 1-page PDF file and archives them into a ZIP download.
          </p>

          <div className="text-[11px] text-zinc-500 bg-zinc-50 p-2.5 rounded-xl border border-zinc-200">
            Will generate <strong>{file.totalPages} single-page PDFs</strong> (page_1.pdf ... page_{file.totalPages}.pdf).
          </div>
        </div>
      </div>

      {/* Visual Page Preview Strip */}
      <div className="mb-10">
        <div className="text-xs font-bold text-zinc-600 mb-3 flex items-center gap-1.5">
          <span>Document Pages ({file.totalPages}):</span>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-thin">
          {Array.from({ length: file.totalPages }, (_, i) => (
            <div key={i + 1} className="shrink-0">
              <PageThumbnail pageNumber={i + 1} />
            </div>
          ))}
        </div>
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="sticky bottom-4 z-30 bg-white/95 backdrop-blur-md border border-zinc-200 shadow-xl rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-left">
          <div className="text-xs font-medium text-zinc-500">Selected Split Plan</div>
          <div className="text-sm font-black text-zinc-900">
            {splitMode === "all"
              ? `Extract all ${file.totalPages} pages into a ZIP bundle`
              : `Extract range: "${rangesInput}"`}
          </div>
        </div>

        <button
          id="split-action-button"
          type="button"
          disabled={isProcessing}
          onClick={handleSplit}
          className="w-full sm:w-auto px-8 py-3.5 bg-orange-600 hover:bg-orange-700 active:bg-orange-800 disabled:bg-zinc-300 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Splitting via Python Engine...</span>
            </>
          ) : (
            <>
              <Split className="w-4 h-4" />
              <span>Split PDF →</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
