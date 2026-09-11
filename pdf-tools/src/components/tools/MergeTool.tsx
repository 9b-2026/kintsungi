import React, { useState } from "react";
import {
  Merge,
  Plus,
  ArrowUp,
  ArrowDown,
  Trash2,
  FileText,
  Loader2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { PDFFileItem, ProcessResult } from "../../types";
import { FileUploadArea } from "../FileUploadArea";
import { createSamplePdfDocument } from "../../utils/samplePdfs";

interface MergeToolProps {
  initialFiles?: PDFFileItem[];
  onResult: (result: ProcessResult) => void;
}

export const MergeTool: React.FC<MergeToolProps> = ({ initialFiles = [], onResult }) => {
  const [files, setFiles] = useState<PDFFileItem[]>(initialFiles);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFilesAdded = (newFiles: PDFFileItem[]) => {
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setFiles((prev) => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const handleMoveDown = (index: number) => {
    if (index === files.length - 1) return;
    setFiles((prev) => {
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  };

  const handleRemove = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const totalPagesCount = files.reduce((acc, f) => acc + (f.totalPages || 1), 0);

  const handleAddSample = async () => {
    try {
      const sample = await createSamplePdfDocument(
        `Supplementary Attachment #${files.length + 1}`,
        "Legal Contract",
        2,
        { r: 0.45, g: 0.25, b: 0.85 }
      );
      setFiles((prev) => [...prev, sample]);
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      setErrorMessage("Please select at least 2 PDF files to merge.");
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);
    const startTime = performance.now();

    try {
      const payload = {
        files: files.map((f) => ({
          name: f.name,
          base64: f.base64,
        })),
        outputFilename: `merged_${Date.now()}.pdf`,
      };

      const response = await fetch("/api/pdf/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to merge PDF files via Python server.");
      }

      const durationMs = Math.round(performance.now() - startTime);

      onResult({
        success: true,
        filename: data.filename || "merged_document.pdf",
        mimeType: "application/pdf",
        dataBase64: data.pdfBase64,
        dataUrl: `data:application/pdf;base64,${data.pdfBase64}`,
        totalPages: data.totalPages,
        sizeBytes: data.sizeBytes,
        durationMs,
        toolUsed: "merge",
      });
    } catch (err: any) {
      setErrorMessage(err.message || "An error occurred while communicating with Python server.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (files.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Merge PDF files</h2>
          <p className="mt-2 text-sm text-zinc-500">
            Combine PDFs in the order you want with the local Python PDF processing engine.
          </p>
        </div>

        <FileUploadArea
          multiple
          isMergeMode
          onFilesSelected={handleFilesAdded}
          title="Select PDF files to Merge"
          sampleLabel="Load 2 Sample Documents to Merge"
        />
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto py-6">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-zinc-200">
        <div>
          <h2 className="text-2xl font-black text-zinc-900 tracking-tight flex items-center gap-2.5">
            <Merge className="w-6 h-6 text-red-600" />
            <span>Merge PDF documents</span>
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            Reorder the files below to arrange the page sequence in the final merged PDF.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="add-sample-file-btn"
            type="button"
            onClick={handleAddSample}
            className="px-3.5 py-2 text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>+ Add Sample Document</span>
          </button>

          <label
            htmlFor="add-more-pdf-input"
            className="px-4 py-2 text-xs font-semibold text-white bg-zinc-900 hover:bg-zinc-800 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add More PDFs</span>
          </label>
          <input
            id="add-more-pdf-input"
            type="file"
            accept="application/pdf"
            multiple
            className="hidden"
            onChange={async (e) => {
              if (e.target.files && e.target.files.length > 0) {
                const { parsePdfFile } = await import("../../utils/samplePdfs");
                const newItems: PDFFileItem[] = [];
                const filesList = Array.from(e.target.files) as File[];
                for (const f of filesList) {
                  newItems.push(await parsePdfFile(f));
                }
                handleFilesAdded(newItems);
              }
            }}
          />
        </div>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Grid of Files to Merge */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-10">
        {files.map((file, idx) => (
          <div
            key={file.id}
            id={`merge-file-card-${idx}`}
            className="group relative bg-white rounded-2xl border border-zinc-200 p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[10px] font-bold uppercase bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded">
                    Order #{idx + 1}
                  </span>
                  <span className="text-[10px] font-semibold text-zinc-400">
                    {file.totalPages} pages
                  </span>
                </div>
                <h4 className="text-xs font-bold text-zinc-900 truncate" title={file.name}>
                  {file.name}
                </h4>
                <p className="text-[10px] text-zinc-400 mt-0.5">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>

            {/* Controls to Move / Delete */}
            <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={() => handleMoveUp(idx)}
                  className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-600 disabled:opacity-30 disabled:hover:bg-transparent"
                  title="Move earlier in sequence"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={idx === files.length - 1}
                  onClick={() => handleMoveDown(idx)}
                  className="p-1 rounded-lg hover:bg-zinc-100 text-zinc-600 disabled:opacity-30 disabled:hover:bg-transparent"
                  title="Move later in sequence"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleRemove(idx)}
                className="p-1 rounded-lg hover:bg-red-50 text-zinc-400 hover:text-red-600 transition-colors"
                title="Remove file"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Floating Bottom Sticky Action Bar (iLovePDF signature style) */}
      <div className="sticky bottom-4 z-30 bg-white/95 backdrop-blur-md border border-zinc-200 shadow-xl rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="text-left">
            <div className="text-xs font-medium text-zinc-500">Ready to Combine</div>
            <div className="text-sm font-black text-zinc-900">
              {files.length} PDF files • Total {totalPagesCount} pages
            </div>
          </div>
        </div>

        <button
          id="merge-action-button"
          type="button"
          disabled={files.length < 2 || isProcessing}
          onClick={handleMerge}
          className="w-full sm:w-auto px-8 py-3.5 bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:bg-zinc-300 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Processing on Python Engine...</span>
            </>
          ) : (
            <>
              <Merge className="w-4 h-4" />
              <span>Merge PDF ({files.length} files) →</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
