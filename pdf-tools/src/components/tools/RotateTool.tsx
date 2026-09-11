import React, { useState } from "react";
import { RotateCw, RotateCcw, Loader2, AlertCircle, Sparkles, RefreshCw } from "lucide-react";
import { PDFFileItem, ProcessResult } from "../../types";
import { FileUploadArea } from "../FileUploadArea";
import { PageThumbnail } from "../PageThumbnail";

interface RotateToolProps {
  initialFile?: PDFFileItem;
  onResult: (result: ProcessResult) => void;
}

export const RotateTool: React.FC<RotateToolProps> = ({ initialFile, onResult }) => {
  const [file, setFile] = useState<PDFFileItem | null>(initialFile || null);
  // Map of page number to accumulated rotation angle (0, 90, 180, 270)
  const [rotations, setRotations] = useState<Record<number, number>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileSelected = (files: PDFFileItem[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setRotations({});
    }
  };

  const rotateSinglePage = (pageNum: number) => {
    setRotations((prev) => {
      const current = prev[pageNum] || 0;
      return {
        ...prev,
        [pageNum]: (current + 90) % 360,
      };
    });
  };

  const rotateAllClockwise = () => {
    if (!file) return;
    setRotations((prev) => {
      const updated: Record<number, number> = {};
      for (let i = 1; i <= file.totalPages; i++) {
        const current = prev[i] || 0;
        updated[i] = (current + 90) % 360;
      }
      return updated;
    });
  };

  const rotateAllCounterClockwise = () => {
    if (!file) return;
    setRotations((prev) => {
      const updated: Record<number, number> = {};
      for (let i = 1; i <= file.totalPages; i++) {
        const current = prev[i] || 0;
        updated[i] = (current - 90 + 360) % 360;
      }
      return updated;
    });
  };

  const resetAllRotations = () => {
    setRotations({});
  };

  const hasAnyRotations = Object.values(rotations).some((angle) => angle !== 0);

  const handleRotate = async () => {
    if (!file) return;

    setIsProcessing(true);
    setErrorMessage(null);
    const startTime = performance.now();

    try {
      const payload = {
        pdfBase64: file.base64,
        angle: 0,
        pageRotations: rotations,
        outputFilename: `${file.name.replace(".pdf", "")}_rotated.pdf`,
      };

      const response = await fetch("/api/pdf/rotate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Python rotate operation failed.");
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
        toolUsed: "rotate",
      });
    } catch (err: any) {
      setErrorMessage(err.message || "Rotate operation failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!file) {
    return (
      <div className="w-full max-w-4xl mx-auto py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-black text-zinc-900 tracking-tight">Rotate PDF Pages</h2>
          <p className="mt-2 text-sm text-zinc-500">
            Rotate all or individual PDF pages 90°, 180°, or 270° degrees to fix landscape/portrait orientation.
          </p>
        </div>

        <FileUploadArea
          onFilesSelected={handleFileSelected}
          title="Select PDF file to Rotate"
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
            <RotateCw className="w-6 h-6 text-blue-600" />
            <span>Rotate PDF pages</span>
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            Rotate all pages at once or hover and click on individual pages to rotate them specifically.
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

      {/* Global Rotation Controls Toolbar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 p-3 bg-zinc-50 rounded-2xl border border-zinc-200">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-zinc-700">Rotate All:</span>
          <button
            id="rotate-all-cw-btn"
            type="button"
            onClick={rotateAllClockwise}
            className="px-3 py-1.5 bg-white hover:bg-zinc-100 border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5 text-blue-600" />
            <span>Right (+90°)</span>
          </button>
          <button
            id="rotate-all-ccw-btn"
            type="button"
            onClick={rotateAllCounterClockwise}
            className="px-3 py-1.5 bg-white hover:bg-zinc-100 border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
            <span>Left (-90°)</span>
          </button>
          {hasAnyRotations && (
            <button
              type="button"
              onClick={resetAllRotations}
              className="px-3 py-1.5 bg-white hover:bg-zinc-100 border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-500 hover:text-zinc-800 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>

        <div className="text-xs text-zinc-500">
          Tip: You can also click on individual page cards to rotate them individually.
        </div>
      </div>

      {/* Page Thumbnails with visual rotation */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-10">
        {Array.from({ length: file.totalPages }, (_, i) => {
          const pageNum = i + 1;
          const currentRotation = rotations[pageNum] || 0;
          return (
            <PageThumbnail
              key={pageNum}
              pageNumber={pageNum}
              rotation={currentRotation}
              showRotateAction
              onRotate={() => rotateSinglePage(pageNum)}
              onToggleSelect={() => rotateSinglePage(pageNum)}
            />
          );
        })}
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="sticky bottom-4 z-30 bg-white/95 backdrop-blur-md border border-zinc-200 shadow-xl rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-left">
          <div className="text-xs font-medium text-zinc-500">Ready to Apply</div>
          <div className="text-sm font-black text-zinc-900">
            {hasAnyRotations
              ? "Custom orientation adjustments applied"
              : "Rotate pages above or apply 90°"}
          </div>
        </div>

        <button
          id="rotate-action-button"
          type="button"
          disabled={isProcessing}
          onClick={handleRotate}
          className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-zinc-300 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Rotating via Python Engine...</span>
            </>
          ) : (
            <>
              <RotateCw className="w-4 h-4" />
              <span>Rotate PDF →</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
