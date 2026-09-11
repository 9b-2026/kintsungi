import React, { useState } from "react";
import {
  Layers,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Copy,
  Trash2,
  Loader2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { PDFFileItem, ProcessResult } from "../../types";
import { FileUploadArea } from "../FileUploadArea";
import { PageThumbnail } from "../PageThumbnail";

interface OrganizeToolProps {
  initialFile?: PDFFileItem;
  onResult: (result: ProcessResult) => void;
}

export const OrganizeTool: React.FC<OrganizeToolProps> = ({ initialFile, onResult }) => {
  const [file, setFile] = useState<PDFFileItem | null>(initialFile || null);
  // pageOrder is an array of original 1-based page numbers in current sequence
  const [pageOrder, setPageOrder] = useState<number[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileSelected = (files: PDFFileItem[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setPageOrder(Array.from({ length: files[0].totalPages }, (_, i) => i + 1));
    }
  };

  const moveLeft = (index: number) => {
    if (index === 0) return;
    setPageOrder((prev) => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const moveRight = (index: number) => {
    if (index === pageOrder.length - 1) return;
    setPageOrder((prev) => {
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const reverseOrder = () => {
    setPageOrder((prev) => [...prev].reverse());
  };

  const resetOriginal = () => {
    if (!file) return;
    setPageOrder(Array.from({ length: file.totalPages }, (_, i) => i + 1));
  };

  const duplicatePage = (index: number) => {
    setPageOrder((prev) => {
      const copy = [...prev];
      copy.splice(index + 1, 0, copy[index]);
      return copy;
    });
  };

  const deletePageFromOrder = (index: number) => {
    if (pageOrder.length <= 1) {
      setErrorMessage("At least 1 page must remain.");
      return;
    }
    setPageOrder((prev) => prev.filter((_, i) => i !== index));
  };

  const handleOrganize = async () => {
    if (!file) return;
    if (pageOrder.length === 0) {
      setErrorMessage("No pages to organize.");
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    const startTime = performance.now();

    try {
      const payload = {
        pdfBase64: file.base64,
        order: pageOrder,
        outputFilename: `${file.name.replace(".pdf", "")}_organized.pdf`,
      };

      const response = await fetch("/api/pdf/organize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Python organize operation failed.");
      }

      const durationMs = Math.round(performance.now() - startTime);

      onResult({
        success: true,
        filename: data.filename,
        mimeType: "application/pdf",
        dataBase64: data.pdfBase64,
        dataUrl: `data:application/pdf;base64,${data.pdfBase64}`,
        totalPages: data.totalPages,
        sizeBytes: data.sizeBytes,
        durationMs,
        toolUsed: "organize",
      });
    } catch (err: any) {
      setErrorMessage(err.message || "Organize operation failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!file) {
    return (
      <div className="w-full max-w-4xl mx-auto py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Organize PDF Pages</h2>
          <p className="mt-2 text-sm text-zinc-500">
            Sort, swap, duplicate, and reorder the pages of your PDF document in any custom sequence.
          </p>
        </div>

        <FileUploadArea
          onFilesSelected={handleFileSelected}
          title="Select PDF file to Organize"
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
            <Layers className="w-6 h-6 text-emerald-600" />
            <span>Organize and reorder pages</span>
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            Rearrange pages by moving them left or right, or reverse sequence.
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

      {/* Toolbar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 p-3 bg-zinc-50 rounded-2xl border border-zinc-200">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={reverseOrder}
            className="px-3 py-1.5 bg-white hover:bg-zinc-100 border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-700 transition-colors flex items-center gap-1.5"
          >
            <span>Reverse All</span>
          </button>
          <button
            type="button"
            onClick={resetOriginal}
            className="px-3 py-1.5 bg-white hover:bg-zinc-100 border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-600 hover:text-zinc-800 transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Original Order</span>
          </button>
        </div>

        <div className="text-xs font-mono text-zinc-600">
          Order: [{pageOrder.join(", ")}]
        </div>
      </div>

      {/* Reorderable Page Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-10">
        {pageOrder.map((origPageNum, idx) => (
          <div key={`${origPageNum}-${idx}`} className="flex flex-col items-center bg-white p-2 rounded-2xl border border-zinc-200 shadow-2xs">
            <PageThumbnail
              pageNumber={origPageNum}
              orderNumber={idx + 1}
            />

            {/* In-Card Positioning Controls */}
            <div className="w-full mt-2 pt-2 border-t border-zinc-100 flex items-center justify-between px-1">
              <button
                type="button"
                disabled={idx === 0}
                onClick={() => moveLeft(idx)}
                className="p-1 rounded hover:bg-zinc-100 text-zinc-600 disabled:opacity-20"
                title="Move earlier"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => duplicatePage(idx)}
                  className="p-1 rounded hover:bg-emerald-50 text-zinc-400 hover:text-emerald-600"
                  title="Duplicate page"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => deletePageFromOrder(idx)}
                  className="p-1 rounded hover:bg-red-50 text-zinc-400 hover:text-red-600"
                  title="Delete from document"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                disabled={idx === pageOrder.length - 1}
                onClick={() => moveRight(idx)}
                className="p-1 rounded hover:bg-zinc-100 text-zinc-600 disabled:opacity-20"
                title="Move later"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="sticky bottom-4 z-30 bg-white/95 backdrop-blur-md border border-zinc-200 shadow-xl rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-left">
          <div className="text-xs font-medium text-zinc-500">Target Output</div>
          <div className="text-sm font-black text-zinc-900">
            {pageOrder.length} pages arranged in sequence
          </div>
        </div>

        <button
          id="organize-action-button"
          type="button"
          disabled={pageOrder.length === 0 || isProcessing}
          onClick={handleOrganize}
          className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-zinc-300 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Organizing via Python Engine...</span>
            </>
          ) : (
            <>
              <Layers className="w-4 h-4" />
              <span>Save Organized PDF →</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
