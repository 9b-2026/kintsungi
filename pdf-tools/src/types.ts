export type ToolType =
  | "home"
  | "merge"
  | "split"
  | "extract"
  | "remove"
  | "organize"
  | "rotate";

export interface PDFFileItem {
  id: string;
  name: string;
  size: number;
  totalPages: number;
  base64: string; // pure base64 without prefix
  dataUrl: string; // data:application/pdf;base64,...
  pagesInfo?: PageInfo[];
}

export interface PageInfo {
  pageNumber: number;
  width: number;
  height: number;
  rotation: number;
}

export interface ProcessResult {
  success: boolean;
  filename: string;
  mimeType?: string;
  dataBase64: string;
  dataUrl: string;
  totalPages?: number;
  pagesOrFiles?: number;
  sizeBytes: number;
  durationMs: number;
  toolUsed: ToolType;
}

export interface PythonServerHealth {
  status: "connected" | "starting" | "offline";
  port: number;
  engine: string;
  offlineMode: boolean;
  latencyMs?: number;
}
