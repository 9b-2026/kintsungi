import React, { useState } from "react";
import {
  Download,
  CheckCircle2,
  FileCheck,
  Eye,
  RefreshCw,
  Cpu,
  ArrowRight,
  ExternalLink,
  X,
} from "lucide-react";
import { ProcessResult } from "../types";

interface ResultModalProps {
  result: ProcessResult;
  onReset: () => void;
  onBackToHome: () => void;
}

export const ResultModal: React.FC<ResultModalProps> = ({
  result,
  onReset,
  onBackToHome,
}) => {
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = result.dataUrl;
    link.download = result.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-3xl border border-zinc-200 shadow-sm p-8 flex flex-col items-center text-center animate-in fade-in duration-200">
      {/* Success Icon */}
      <div className="w-20 h-20 rounded-3xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-6 shadow-xs">
        <CheckCircle2 className="w-10 h-10 stroke-[2]" />
      </div>

      <h2 className="text-2xl font-black text-zinc-900 tracking-tight">
        PDF Processed Successfully!
      </h2>
      <p className="mt-1 text-sm text-zinc-500 max-w-md">
        Your document has been handled offline by the local Python server with
        pure-python speed and complete data privacy.
      </p>

      {/* Metadata Pill Card */}
      <div className="mt-6 w-full bg-zinc-50 rounded-2xl border border-zinc-200/80 p-4 grid grid-cols-3 gap-3 text-left">
        <div>
          <div className="text-[11px] text-zinc-400 font-medium">Output File</div>
          <div className="text-xs font-bold text-zinc-800 truncate" title={result.filename}>
            {result.filename}
          </div>
        </div>
        <div>
          <div className="text-[11px] text-zinc-400 font-medium">Output Size</div>
          <div className="text-xs font-bold text-zinc-800">
            {formatFileSize(result.sizeBytes)}
          </div>
        </div>
        <div>
          <div className="text-[11px] text-zinc-400 font-medium">Python Engine</div>
          <div className="text-xs font-bold text-emerald-600 flex items-center gap-1">
            <Cpu className="w-3 h-3" />
            <span>{result.durationMs}ms</span>
          </div>
        </div>
      </div>

      {/* Primary Actions */}
      <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
        <button
          id="download-result-pdf-btn"
          type="button"
          onClick={handleDownload}
          className="w-full sm:w-auto px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-bold text-base rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Download className="w-5 h-5" />
          <span>Download {result.mimeType === "application/zip" ? "ZIP Archive" : "PDF"}</span>
        </button>

        {result.mimeType !== "application/zip" && (
          <button
            id="preview-result-pdf-btn"
            type="button"
            onClick={() => setShowPreviewModal(true)}
            className="w-full sm:w-auto px-6 py-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-semibold text-base rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Eye className="w-5 h-5" />
            <span>Preview</span>
          </button>
        )}
      </div>

      {/* Secondary Row */}
      <div className="mt-8 pt-6 border-t border-zinc-100 w-full flex items-center justify-between text-xs text-zinc-500">
        <button
          id="process-another-btn"
          type="button"
          onClick={onReset}
          className="flex items-center gap-1.5 font-semibold text-zinc-700 hover:text-red-600 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Process Another File</span>
        </button>

        <button
          id="back-to-tools-btn"
          type="button"
          onClick={onBackToHome}
          className="flex items-center gap-1 font-semibold text-red-600 hover:underline cursor-pointer"
        >
          <span>All PDF Tools</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Embedded PDF Preview Modal */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl border border-zinc-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-red-600" />
                <span className="font-bold text-zinc-800 text-sm truncate max-w-md">
                  {result.filename}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-3 py-1.5 bg-red-600 text-white rounded-xl text-xs font-semibold hover:bg-red-700 flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
                <button
                  id="close-preview-modal-btn"
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  className="p-1.5 rounded-xl hover:bg-zinc-200 text-zinc-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-zinc-200 p-2 overflow-hidden flex items-center justify-center">
              <iframe
                src={`${result.dataUrl}#toolbar=1&navpanes=0`}
                className="w-full h-full rounded-xl border border-zinc-300 bg-white"
                title="PDF Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
