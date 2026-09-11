import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { PDFFileItem } from "../types";

export async function createSamplePdfDocument(
  title: string,
  category: "Business Report" | "Legal Contract" | "Financial Summary",
  pageCount: number = 3,
  themeColor: { r: number; g: number; b: number } = { r: 0.15, g: 0.38, b: 0.92 }
): Promise<PDFFileItem> {
  const pdfDoc = await PDFDocument.create();
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const colors = [
    themeColor,
    { r: 0.08, g: 0.62, b: 0.52 },
    { r: 0.88, g: 0.34, b: 0.15 },
    { r: 0.45, g: 0.25, b: 0.85 },
  ];

  for (let i = 1; i <= pageCount; i++) {
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 portrait
    const { width, height } = page.getSize();
    const c = colors[(i - 1) % colors.length];

    // Top Header Banner
    page.drawRectangle({
      x: 0,
      y: height - 110,
      width,
      height: 110,
      color: rgb(c.r, c.g, c.b),
    });

    // Subheader strip
    page.drawRectangle({
      x: 0,
      y: height - 125,
      width,
      height: 15,
      color: rgb(c.r * 0.7, c.g * 0.7, c.b * 0.7),
    });

    // Title Text
    page.drawText(title, {
      x: 40,
      y: height - 60,
      size: 22,
      font: helveticaBold,
      color: rgb(1, 1, 1),
    });

    page.drawText(`${category.toUpperCase()} • PAGE ${i} OF ${pageCount}`, {
      x: 40,
      y: height - 88,
      size: 11,
      font: helvetica,
      color: rgb(0.92, 0.94, 0.98),
    });

    // Decorative page stamp
    page.drawRectangle({
      x: width - 110,
      y: height - 85,
      width: 70,
      height: 32,
      color: rgb(1, 1, 1),
    });
    page.drawText(`P. ${i}`, {
      x: width - 96,
      y: height - 73,
      size: 16,
      font: helveticaBold,
      color: rgb(c.r, c.g, c.b),
    });

    // Body content simulation
    page.drawText(`Section ${i}: Document Intelligence & Processing`, {
      x: 40,
      y: height - 170,
      size: 16,
      font: helveticaBold,
      color: rgb(0.12, 0.15, 0.2),
    });

    const lines = [
      "This document was synthesized for testing the offline local Python PDF engine.",
      "Merge, Split, Extract, Remove, Organize, and Rotate features process this document offline.",
      "No file bytes are transmitted across any public internet connection.",
      `Security Protocol: Python 3.10 Subprocess running pypdf 6.18.0 on localhost.`,
      `Verification Hash: SHA256-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      "All pages support independent angle rotation, extraction slicing, and re-sequencing.",
    ];

    let currentY = height - 205;
    for (const line of lines) {
      page.drawText(line, {
        x: 40,
        y: currentY,
        size: 10.5,
        font: helvetica,
        color: rgb(0.3, 0.35, 0.42),
      });
      currentY -= 24;
    }

    // Visual placeholder table/chart box
    page.drawRectangle({
      x: 40,
      y: currentY - 140,
      width: width - 80,
      height: 120,
      color: rgb(0.96, 0.97, 0.99),
      borderColor: rgb(0.85, 0.88, 0.93),
      borderWidth: 1,
    });

    page.drawText(`Sample Content Block #${i} [A4 - 595 x 842 pt]`, {
      x: 60,
      y: currentY - 50,
      size: 12,
      font: helveticaBold,
      color: rgb(0.2, 0.25, 0.32),
    });

    page.drawText(
      `Timestamp: ${new Date().toLocaleDateString()} | Ready for Merge / Split / Extract / Rotate`,
      {
        x: 60,
        y: currentY - 80,
        size: 9.5,
        font: helvetica,
        color: rgb(0.45, 0.5, 0.58),
      }
    );

    // Footer
    page.drawLine({
      start: { x: 40, y: 50 },
      end: { x: width - 40, y: 50 },
      thickness: 1,
      color: rgb(0.85, 0.88, 0.92),
    });

    page.drawText("iLovePDF Offline Clone • Local Python Server Edition", {
      x: 40,
      y: 35,
      size: 9,
      font: helvetica,
      color: rgb(0.55, 0.6, 0.68),
    });

    page.drawText(`Page ${i} of ${pageCount}`, {
      x: width - 90,
      y: 35,
      size: 9,
      font: helveticaBold,
      color: rgb(0.4, 0.45, 0.52),
    });
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const base64 = uint8ArrayToBase64(pdfBytes);

  return {
    id: `sample-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: `${title.replace(/\s+/g, "_")}.pdf`,
    size: blob.size,
    totalPages: pageCount,
    base64,
    dataUrl: `data:application/pdf;base64,${base64}`,
    pagesInfo: Array.from({ length: pageCount }, (_, idx) => ({
      pageNumber: idx + 1,
      width: 595,
      height: 842,
      rotation: 0,
    })),
  };
}

export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function parsePdfFile(file: File): Promise<PDFFileItem> {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  const base64 = uint8ArrayToBase64(bytes);

  let totalPages = 1;
  let pagesInfo: any[] = [];

  try {
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    totalPages = pdfDoc.getPageCount();
    pagesInfo = Array.from({ length: totalPages }, (_, i) => {
      const p = pdfDoc.getPage(i);
      const { width, height } = p.getSize();
      return {
        pageNumber: i + 1,
        width: Math.round(width),
        height: Math.round(height),
        rotation: p.getRotation().angle || 0,
      };
    });
  } catch (err) {
    console.warn("Could not read internal PDF layout via client, will parse on server:", err);
  }

  return {
    id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: file.name,
    size: file.size,
    totalPages,
    base64,
    dataUrl: `data:application/pdf;base64,${base64}`,
    pagesInfo,
  };
}
