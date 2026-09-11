import React, { useRef, useState } from "react";
import { Upload, FileUp, Sparkles, AlertCircle } from "lucide-react";
import { parsePdfFile, createSamplePdfDocument } from "../utils/samplePdfs";
import { PDFFileItem } from "../types";

interface FileUploadAreaProps {
  multiple?: boolean;
  onFilesSelected: (files: PDFFileItem[]) => void;
  title?: string;
  subtitle?: string;
  acceptLabel?: string;
  sampleLabel?: string;
  isMergeMode?: boolean;
}

export const FileUploadArea: React.FC<FileUploadAreaProps> = ({
  multiple = false,
  onFilesSelected,
  title = "Select PDF files",
  subtitle = "or drop PDFs here",
  acceptLabel = "Supported format: PDF",
  sampleLabel = "Use Sample Document",
  isMergeMode = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isGeneratingSample, setIsGeneratingSample] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const processFileList = async (fileList: FileList | File[]) => {
    setErrorMessage(null);
    const validPdfs = Array.from(fileList).filter(
      (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
    );

    if (validPdfs.length === 0) {
      setErrorMessage("Please upload valid PDF document(s).");
      return;
    }

    try {
      const items: PDFFileItem[] = [];
      for (const file of validPdfs) {
        const item = await parsePdfFile(file);
        items.push(item);
      }
      onFilesSelected(items);
    } catch (err: any) {
      setErrorMessage(`Failed to read PDF: ${err.message}`);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processFileList(e.dataTransfer.files);
    }
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFileList(e.target.files);
    }
  };

  const handleGenerateSample = async () => {
    setIsGeneratingSample(true);
    setErrorMessage(null);
    try {
      if (isMergeMode) {
        // Generate two distinct sample PDFs for merging
        const doc1 = await createSamplePdfDocument(
          "Project Proposal & Overview",
          "Business Report",
          3,
          { r: 0.15, g: 0.38, b: 0.92 } // Royal blue
        );
        const doc2 = await createSamplePdfDocument(
          "Financial Forecast & Budget",
          "Financial Summary",
          2,
          { r: 0.88, g: 0.34, b: 0.15 } // Amber/coral
        );
        onFilesSelected([doc1, doc2]);
      } else {
        // Generate 4-page sample PDF with rich distinct sections
        const sampleDoc = await createSamplePdfDocument(
          "Quarterly Analytics Dossier",
          "Business Report",
          4,
          { r: 0.08, g: 0.62, b: 0.52 } // Emerald
        );
        onFilesSelected([sampleDoc]);
      }
    } catch (err: any) {
      setErrorMessage(`Could not synthesize sample PDF: ${err.message}`);
    } finally {
      setIsGeneratingSample(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        multiple={multiple}
        className="hidden"
        onChange={handleInputChange}
      />

      <div
        id="file-dropzone-container"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`w-full max-w-2xl py-14 px-8 rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center ${
          isDragging
            ? "border-red-500 bg-red-50/60 scale-[1.01]"
            : "border-zinc-300 hover:border-zinc-400 bg-white shadow-sm"
        }`}
      >
        <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 mb-5 shadow-xs">
          <Upload className="w-8 h-8 stroke-[1.8]" />
        </div>

        <button
          id="select-pdf-files-button"
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-8 py-4 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-base rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
        >
          <FileUp className="w-5 h-5" />
          <span>{title}</span>
        </button>

        <p className="mt-3 text-sm text-zinc-500 font-medium">{subtitle}</p>

        <div className="mt-6 pt-5 border-t border-zinc-100 w-full flex flex-wrap items-center justify-center gap-4 text-xs text-zinc-400">
          <span>{acceptLabel}</span>
          <span>•</span>
          <span>100% Offline Processing</span>
          <span>•</span>
          <button
            id="use-sample-pdf-button"
            type="button"
            onClick={handleGenerateSample}
            disabled={isGeneratingSample}
            className="inline-flex items-center gap-1.5 font-semibold text-red-600 hover:text-red-700 hover:underline cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {isGeneratingSample ? "Generating Sample..." : sampleLabel}
            </span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2 max-w-md">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
