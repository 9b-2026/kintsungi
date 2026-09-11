import React, { useState } from "react";
import { Scissors, Check, Loader2, AlertCircle, Sparkles } from "lucide-react";
import { PDFFileItem, ProcessResult } from "../../types";
import { FileUploadArea } from "../FileUploadArea";
import { PageThumbnail } from "../PageThumbnail";

interface ExtractToolProps {
  initialFile?: PDFFileItem;
  onResult: (result: ProcessResult) => void;
}

export const ExtractTool: React.FC<ExtractToolProps> = ({ initialFile, onResult }) => {
  const [file, setFile] = useState<PDFFileItem | null>(initialFile || null);
  const [selectedPages, setSelectedPages] = useState<number[]>([1]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileSelected = (files: PDFFileItem[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      // Default select first page
      setSelectedPages([1]);
    }
  };

  const togglePage = (pageNum: number) => {
    setSelectedPages((prev) => {
      if (prev.includes(pageNum)) {
        return prev.filter((p) => p !== pageNum);
      } else {
        return [...prev, pageNum].sort((a, b) => a - b);
      }
    });
  };

  const selectAll = () => {
    if (!file) return;
    setSelectedPages(Array.from({ length: file.totalPages }, (_, i) => i + 1));
  };

  const clearSelection = () => {
    setSelectedPages([]);
  };

  const selectOdd = () => {
    if (!file) return;
    setSelectedPages(
      Array.from({ length: file.totalPages }, (_, i) => i + 1).filter((p) => p % 2 !== 0)
    );
  };

  const selectEven = () => {
    if (!file) return;
    setSelectedPages(
      Array.from({ length: file.totalPages }, (_, i) => i + 1).filter((p) => p % 2 === 0)
    );
  };

  const handleExtract = async () => {
    if (!file) return;
    if (selectedPages.length === 0) {
      setErrorMessage("Please select at least 1 page to extract.");
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    const startTime = performance.now();

    try {
      const payload = {
        pdfBase64: file.base64,
        pages: selectedPages,
        outputFilename: `${file.name.replace(".pdf", "")}_extracted.pdf`,
      };

      const response = await fetch("/api/pdf/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Python extract operation failed.");
      }

      const durationMs = Math.round(performance.now() - startTime);

      onResult({
        success: true,
        filename: data.filename,
        mimeType: "application/pdf",
        dataBase64: data.pdfBase64,
        dataUrl: `data:application/pdf;base64,${data.pdfBase64}`,
        totalPages: data.extractedPagesCount,
        sizeBytes: data.sizeBytes,
        durationMs,
        toolUsed: "extract",
      });
    } catch (err: any) {
      setErrorMessage(err.message || "Extract operation failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!file) {
    return (
      <div className="w-full max-w-4xl mx-auto py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Extract PDF Pages</h2>
          <p className="mt-2 text-sm text-zinc-500">
            Pick specific pages visually from your document and export them into a dedicated PDF file.
          </p>
        </div>

        <FileUploadArea
          onFilesSelected={handleFileSelected}
          title="Select PDF file to Extract"
          sampleLabel="Use 4-Page Sample Document"
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-zinc-200">
        <div>
          <h2 className="text-2xl font-black text-zinc-900 tracking-tight flex items-center gap-2.5">
            <Scissors className="w-6 h-6 text-amber-600" />
            <span>Extract pages from PDF</span>
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            Click on any page thumbnail to select or deselect it for extraction.
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

      {/* Filter / Quick Selection Toolbar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 p-3 bg-zinc-50 rounded-2xl border border-zinc-200">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-zinc-700">Selection:</span>
          <button
            type="button"
            onClick={selectAll}
            className="px-2.5 py-1 bg-white hover:bg-zinc-100 border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-700 transition-colors"
          >
            Select All
          </button>
          <button
            type="button"
            onClick={selectOdd}
            className="px-2.5 py-1 bg-white hover:bg-zinc-100 border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-700 transition-colors"
          >
            Odd Pages
          </button>
          <button
            type="button"
            onClick={selectEven}
            className="px-2.5 py-1 bg-white hover:bg-zinc-100 border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-700 transition-colors"
          >
            Even Pages
          </button>
          <button
            type="button"
            onClick={clearSelection}
            className="px-2.5 py-1 bg-white hover:bg-zinc-100 border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-500 hover:text-zinc-800 transition-colors"
          >
            Deselect All
          </button>
        </div>

        <div className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200/80 px-3 py-1 rounded-xl">
          {selectedPages.length} of {file.totalPages} pages chosen
        </div>
      </div>

      {/* Visual Page Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-10">
        {Array.from({ length: file.totalPages }, (_, i) => {
          const pageNum = i + 1;
          const isSelected = selectedPages.includes(pageNum);
          return (
            <PageThumbnail
              key={pageNum}
              pageNumber={pageNum}
              isSelected={isSelected}
              showSelectCheckbox
              onToggleSelect={() => togglePage(pageNum)}
            />
          );
        })}
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="sticky bottom-4 z-30 bg-white/95 backdrop-blur-md border border-zinc-200 shadow-xl rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-left">
          <div className="text-xs font-medium text-zinc-500">Extraction Plan</div>
          <div className="text-sm font-black text-zinc-900">
            {selectedPages.length === 0
              ? "Select pages above"
              : `Extract ${selectedPages.length} pages (${selectedPages.join(", ")})`}
          </div>
        </div>

        <button
          id="extract-action-button"
          type="button"
          disabled={selectedPages.length === 0 || isProcessing}
          onClick={handleExtract}
          className="w-full sm:w-auto px-8 py-3.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 disabled:bg-zinc-300 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Extracting via Python Engine...</span>
            </>
          ) : (
            <>
              <Scissors className="w-4 h-4" />
              <span>Extract {selectedPages.length} Pages →</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
