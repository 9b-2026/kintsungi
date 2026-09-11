import React, { useState } from "react";
import { Trash2, Undo2, Loader2, AlertCircle, AlertTriangle } from "lucide-react";
import { PDFFileItem, ProcessResult } from "../../types";
import { FileUploadArea } from "../FileUploadArea";
import { PageThumbnail } from "../PageThumbnail";

interface RemoveToolProps {
  initialFile?: PDFFileItem;
  onResult: (result: ProcessResult) => void;
}

export const RemoveTool: React.FC<RemoveToolProps> = ({ initialFile, onResult }) => {
  const [file, setFile] = useState<PDFFileItem | null>(initialFile || null);
  const [pagesToRemove, setPagesToRemove] = useState<number[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileSelected = (files: PDFFileItem[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setPagesToRemove([]);
    }
  };

  const togglePageRemoval = (pageNum: number) => {
    setPagesToRemove((prev) => {
      if (prev.includes(pageNum)) {
        return prev.filter((p) => p !== pageNum);
      } else {
        return [...prev, pageNum].sort((a, b) => a - b);
      }
    });
  };

  const removeFirst = () => {
    if (!file) return;
    setPagesToRemove((prev) => Array.from(new Set([...prev, 1])));
  };

  const removeLast = () => {
    if (!file) return;
    setPagesToRemove((prev) => Array.from(new Set([...prev, file.totalPages])));
  };

  const removeEven = () => {
    if (!file) return;
    const even = Array.from({ length: file.totalPages }, (_, i) => i + 1).filter(
      (p) => p % 2 === 0
    );
    setPagesToRemove(even);
  };

  const clearRemovals = () => {
    setPagesToRemove([]);
  };

  const remainingPagesCount = file ? file.totalPages - pagesToRemove.length : 0;

  const handleRemove = async () => {
    if (!file) return;
    if (pagesToRemove.length === 0) {
      setErrorMessage("Please click at least 1 page to mark for removal.");
      return;
    }
    if (remainingPagesCount <= 0) {
      setErrorMessage("Cannot remove all pages. At least 1 page must remain in the document.");
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    const startTime = performance.now();

    try {
      const payload = {
        pdfBase64: file.base64,
        pagesToRemove,
        outputFilename: `${file.name.replace(".pdf", "")}_cleaned.pdf`,
      };

      const response = await fetch("/api/pdf/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Python remove operation failed.");
      }

      const durationMs = Math.round(performance.now() - startTime);

      onResult({
        success: true,
        filename: data.filename,
        mimeType: "application/pdf",
        dataBase64: data.pdfBase64,
        dataUrl: `data:application/pdf;base64,${data.pdfBase64}`,
        totalPages: data.remainingPagesCount,
        sizeBytes: data.sizeBytes,
        durationMs,
        toolUsed: "remove",
      });
    } catch (err: any) {
      setErrorMessage(err.message || "Remove operation failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!file) {
    return (
      <div className="w-full max-w-4xl mx-auto py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Remove PDF Pages</h2>
          <p className="mt-2 text-sm text-zinc-500">
            Delete unwanted pages from your document. Select individual pages to discard.
          </p>
        </div>

        <FileUploadArea
          onFilesSelected={handleFileSelected}
          title="Select PDF file to Remove Pages"
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
            <Trash2 className="w-6 h-6 text-rose-600" />
            <span>Remove pages from PDF</span>
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            Click on any page you want to discard. Click again to unmark.
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

      {/* Action Presets */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 p-3 bg-zinc-50 rounded-2xl border border-zinc-200">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-zinc-700">Quick Filters:</span>
          <button
            type="button"
            onClick={removeFirst}
            className="px-2.5 py-1 bg-white hover:bg-zinc-100 border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-700 transition-colors"
          >
            Remove 1st Page
          </button>
          <button
            type="button"
            onClick={removeLast}
            className="px-2.5 py-1 bg-white hover:bg-zinc-100 border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-700 transition-colors"
          >
            Remove Last Page
          </button>
          <button
            type="button"
            onClick={removeEven}
            className="px-2.5 py-1 bg-white hover:bg-zinc-100 border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-700 transition-colors"
          >
            Remove Even Pages
          </button>
          <button
            type="button"
            onClick={clearRemovals}
            className="px-2.5 py-1 bg-white hover:bg-zinc-100 border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-500 hover:text-zinc-800 transition-colors flex items-center gap-1"
          >
            <Undo2 className="w-3 h-3" />
            <span>Reset All</span>
          </button>
        </div>

        <div className="text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200/80 px-3 py-1 rounded-xl">
          {pagesToRemove.length} marked for deletion • {remainingPagesCount} pages will remain
        </div>
      </div>

      {/* Visual Page Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-10">
        {Array.from({ length: file.totalPages }, (_, i) => {
          const pageNum = i + 1;
          const isMarked = pagesToRemove.includes(pageNum);
          return (
            <PageThumbnail
              key={pageNum}
              pageNumber={pageNum}
              isMarkedForRemoval={isMarked}
              onToggleSelect={() => togglePageRemoval(pageNum)}
            />
          );
        })}
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="sticky bottom-4 z-30 bg-white/95 backdrop-blur-md border border-zinc-200 shadow-xl rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-left">
          <div className="text-xs font-medium text-zinc-500">Summary</div>
          <div className="text-sm font-black text-zinc-900">
            {pagesToRemove.length === 0
              ? "Click pages above to mark them for removal"
              : `Removing ${pagesToRemove.length} pages (${pagesToRemove.join(", ")})`}
          </div>
        </div>

        <button
          id="remove-action-button"
          type="button"
          disabled={pagesToRemove.length === 0 || remainingPagesCount <= 0 || isProcessing}
          onClick={handleRemove}
          className="w-full sm:w-auto px-8 py-3.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 disabled:bg-zinc-300 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Removing via Python Engine...</span>
            </>
          ) : (
            <>
              <Trash2 className="w-4 h-4" />
              <span>Remove {pagesToRemove.length} Pages →</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
