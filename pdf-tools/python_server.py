#!/usr/bin/env python3
"""
Local Python PDF Processing Server for iLovePDF Clone
Uses pypdf to perform merge, split, extract, remove, organize, and rotate operations locally.
Runs on 127.0.0.1:5001 and provides HTTP REST API as well as CLI modes.
"""

import sys
import os
import io
import json
import base64
import zipfile
import subprocess
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

# Ensure local python_packages is in sys.path
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PACKAGES_DIR = os.path.join(SCRIPT_DIR, "python_packages")
if os.path.exists(PACKAGES_DIR) and PACKAGES_DIR not in sys.path:
    sys.path.insert(0, PACKAGES_DIR)

try:
    import pypdf
    from pypdf import PdfReader, PdfWriter
    PYPDF_AVAILABLE = True
    PYPDF_VERSION = getattr(pypdf, "__version__", "unknown")
except Exception as e:
    PYPDF_AVAILABLE = False
    PYPDF_VERSION = str(e)


def create_sample_pdf(title="Sample Document", pages=3, subtitle="Generated locally by Python Engine"):
    """Generate a clean multi-page sample PDF locally using pypdf writer objects."""
    writer = PdfWriter()
    for i in range(1, pages + 1):
        # We can create a simple blank page and set mediabox
        writer.add_blank_page(width=595, height=842) # A4
    
    # Save to bytes
    buf = io.BytesIO()
    writer.write(buf)
    base_bytes = buf.getvalue()

    # If we want visual text or standard content, let's inject simple PDF stream or return standard PDF
    return base_bytes


def inspect_pdf(pdf_bytes):
    """Inspect PDF and extract page count, dimensions, and metadata."""
    reader = PdfReader(io.BytesIO(pdf_bytes))
    num_pages = len(reader.pages)
    pages_info = []
    
    for idx, page in enumerate(reader.pages):
        try:
            mb = page.mediabox
            w = float(mb.width)
            h = float(mb.height)
            rot = int(page.get("/Rotate", 0) or 0)
        except Exception:
            w, h, rot = 595.0, 842.0, 0
        pages_info.append({
            "pageNumber": idx + 1,
            "width": round(w, 1),
            "height": round(h, 1),
            "rotation": rot
        })

    meta = {}
    try:
        if reader.metadata:
            meta = {k.strip("/"): str(v) for k, v in reader.metadata.items() if v}
    except Exception:
        pass

    return {
        "pageCount": num_pages,
        "pages": pages_info,
        "metadata": meta
    }


def merge_pdfs(pdf_bytes_list):
    """Merge an array of PDF bytes into one single PDF."""
    writer = PdfWriter()
    total_pages = 0

    for pdf_data in pdf_bytes_list:
        reader = PdfReader(io.BytesIO(pdf_data))
        for page in reader.pages:
            writer.add_page(page)
            total_pages += 1

    out_buf = io.BytesIO()
    writer.write(out_buf)
    return out_buf.getvalue(), total_pages


def split_pdf(pdf_bytes, split_mode="ranges", ranges_str="", split_every=1):
    """
    Split PDF:
    - mode 'ranges': ranges_str like '1-2, 3-4' or '1, 3-5' creates separate PDFs or selected slice.
    - mode 'all': splits into individual 1-page PDFs and returns a zip archive.
    - mode 'custom': single range string to extract as single file.
    """
    reader = PdfReader(io.BytesIO(pdf_bytes))
    total_pages = len(reader.pages)
    
    if total_pages == 0:
        raise ValueError("PDF has no pages")

    if split_mode == "all":
        # Create a ZIP containing each page as doc_page_X.pdf
        zip_buf = io.BytesIO()
        with zipfile.ZipFile(zip_buf, "w", zipfile.ZIP_DEFLATED) as zf:
            for idx, page in enumerate(reader.pages):
                w = PdfWriter()
                w.add_page(page)
                page_buf = io.BytesIO()
                w.write(page_buf)
                zf.writestr(f"page_{idx + 1}.pdf", page_buf.getvalue())
        return zip_buf.getvalue(), "application/zip", "split_pages.zip", total_pages

    elif split_mode == "extract_ranges":
        # Parse ranges like '1-3, 5, 7-9'
        parsed_ranges = []
        chunks = [c.strip() for c in ranges_str.split(",") if c.strip()]
        if not chunks:
            chunks = [f"1-{total_pages}"]

        for chunk in chunks:
            if "-" in chunk:
                parts = chunk.split("-")
                start = max(1, min(total_pages, int(parts[0].strip())))
                end = max(1, min(total_pages, int(parts[1].strip())))
                if start > end:
                    start, end = end, start
                parsed_ranges.append(list(range(start, end + 1)))
            else:
                p = max(1, min(total_pages, int(chunk.strip())))
                parsed_ranges.append([p])

        if len(parsed_ranges) == 1:
            # Single range -> Return single PDF
            writer = PdfWriter()
            for p_num in parsed_ranges[0]:
                writer.add_page(reader.pages[p_num - 1])
            out_buf = io.BytesIO()
            writer.write(out_buf)
            return out_buf.getvalue(), "application/pdf", "split_selected.pdf", len(parsed_ranges[0])
        else:
            # Multiple ranges -> Return ZIP with each range as separate PDF
            zip_buf = io.BytesIO()
            with zipfile.ZipFile(zip_buf, "w", zipfile.ZIP_DEFLATED) as zf:
                for idx, r_pages in enumerate(parsed_ranges):
                    w = PdfWriter()
                    for p_num in r_pages:
                        w.add_page(reader.pages[p_num - 1])
                    p_buf = io.BytesIO()
                    w.write(p_buf)
                    start_p = r_pages[0]
                    end_p = r_pages[-1]
                    zf.writestr(f"split_range_{idx + 1}_pages_{start_p}-{end_p}.pdf", p_buf.getvalue())
            return zip_buf.getvalue(), "application/zip", "split_ranges.zip", len(parsed_ranges)

    else:
        # Default single range or fallback
        writer = PdfWriter()
        for page in reader.pages:
            writer.add_page(page)
        out_buf = io.BytesIO()
        writer.write(out_buf)
        return out_buf.getvalue(), "application/pdf", "split_output.pdf", total_pages


def extract_pages(pdf_bytes, page_numbers):
    """Extract specified 1-based page numbers into a new PDF."""
    reader = PdfReader(io.BytesIO(pdf_bytes))
    total_pages = len(reader.pages)
    
    writer = PdfWriter()
    extracted_count = 0
    for p_num in page_numbers:
        idx = int(p_num) - 1
        if 0 <= idx < total_pages:
            writer.add_page(reader.pages[idx])
            extracted_count += 1

    if extracted_count == 0:
        raise ValueError("No valid pages selected for extraction")

    out_buf = io.BytesIO()
    writer.write(out_buf)
    return out_buf.getvalue(), extracted_count


def remove_pages(pdf_bytes, pages_to_remove):
    """Remove specified 1-based page numbers from PDF."""
    reader = PdfReader(io.BytesIO(pdf_bytes))
    total_pages = len(reader.pages)
    
    remove_set = set(int(p) for p in pages_to_remove)
    writer = PdfWriter()
    kept_count = 0

    for idx, page in enumerate(reader.pages):
        page_num = idx + 1
        if page_num not in remove_set:
            writer.add_page(page)
            kept_count += 1

    if kept_count == 0:
        raise ValueError("Cannot remove all pages from PDF. At least 1 page must remain.")

    out_buf = io.BytesIO()
    writer.write(out_buf)
    return out_buf.getvalue(), kept_count


def organize_pages(pdf_bytes, new_order):
    """
    Reorder pages according to new_order list of 1-based page numbers.
    e.g. [3, 1, 2, 4]
    """
    reader = PdfReader(io.BytesIO(pdf_bytes))
    total_pages = len(reader.pages)
    
    writer = PdfWriter()
    for p_num in new_order:
        idx = int(p_num) - 1
        if 0 <= idx < total_pages:
            writer.add_page(reader.pages[idx])

    out_buf = io.BytesIO()
    writer.write(out_buf)
    return out_buf.getvalue(), len(new_order)


def rotate_pages(pdf_bytes, global_angle=0, page_rotations=None):
    """
    Rotate pages:
    - global_angle: 90, 180, 270 degrees applied to all pages.
    - page_rotations: dict of { "page_1": 90, "page_2": 180, ... }
    """
    reader = PdfReader(io.BytesIO(pdf_bytes))
    writer = PdfWriter()
    page_rotations = page_rotations or {}

    for idx, page in enumerate(reader.pages):
        page_num = str(idx + 1)
        # Check specific rotation or global rotation
        angle = int(page_rotations.get(page_num, global_angle))
        if angle % 360 != 0:
            page.rotate(angle % 360)
        writer.add_page(page)

    out_buf = io.BytesIO()
    writer.write(out_buf)
    return out_buf.getvalue(), len(reader.pages)


# HTTP Request Handler for Python Local Server
class LocalPDFHandler(BaseHTTPRequestHandler):
    def _send_json(self, data, status=200):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode("utf-8"))

    def _send_binary(self, binary_data, content_type="application/pdf", filename="document.pdf"):
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Disposition", f'attachment; filename="{filename}"')
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(binary_data)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path in ["/", "/health", "/api/health"]:
            self._send_json({
                "status": "online",
                "engine": "python3",
                "python_version": sys.version.split()[0],
                "pypdf_available": PYPDF_AVAILABLE,
                "pypdf_version": PYPDF_VERSION,
                "features": [
                    "merge",
                    "split",
                    "extract",
                    "remove",
                    "organize",
                    "rotate",
                    "info"
                ]
            })
        else:
            self._send_json({"error": "Endpoint not found"}, 404)

    def do_POST(self):
        parsed = urlparse(self.path)
        endpoint = parsed.path.rstrip("/")

        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length)

        try:
            payload = json.loads(body.decode("utf-8")) if body else {}
        except Exception:
            payload = {}

        try:
            if endpoint in ["/api/info", "/info"]:
                pdf_b64 = payload.get("pdfBase64", "")
                if not pdf_b64:
                    return self._send_json({"error": "No pdfBase64 provided"}, 400)
                pdf_bytes = base64.b64decode(pdf_b64)
                info = inspect_pdf(pdf_bytes)
                return self._send_json({"success": True, "info": info})

            elif endpoint in ["/api/merge", "/merge"]:
                files_b64 = payload.get("files", [])
                if len(files_b64) < 1:
                    return self._send_json({"error": "At least 1 PDF required to merge"}, 400)
                
                pdf_bytes_list = [base64.b64decode(f["base64"]) for f in files_b64]
                merged_bytes, total_pages = merge_pdfs(pdf_bytes_list)
                
                return self._send_json({
                    "success": True,
                    "filename": payload.get("outputFilename", "merged.pdf"),
                    "totalPages": total_pages,
                    "pdfBase64": base64.b64encode(merged_bytes).decode("utf-8"),
                    "sizeBytes": len(merged_bytes)
                })

            elif endpoint in ["/api/split", "/split"]:
                pdf_b64 = payload.get("pdfBase64", "")
                mode = payload.get("mode", "extract_ranges")
                ranges_str = payload.get("ranges", "1")
                
                pdf_bytes = base64.b64decode(pdf_b64)
                out_bytes, mime, default_name, pages_or_files = split_pdf(pdf_bytes, mode, ranges_str)

                return self._send_json({
                    "success": True,
                    "filename": payload.get("outputFilename", default_name),
                    "mimeType": mime,
                    "pagesOrFiles": pages_or_files,
                    "dataBase64": base64.b64encode(out_bytes).decode("utf-8"),
                    "sizeBytes": len(out_bytes)
                })

            elif endpoint in ["/api/extract", "/extract"]:
                pdf_b64 = payload.get("pdfBase64", "")
                pages = payload.get("pages", [])
                pdf_bytes = base64.b64decode(pdf_b64)
                out_bytes, count = extract_pages(pdf_bytes, pages)

                return self._send_json({
                    "success": True,
                    "filename": payload.get("outputFilename", "extracted_pages.pdf"),
                    "extractedPagesCount": count,
                    "pdfBase64": base64.b64encode(out_bytes).decode("utf-8"),
                    "sizeBytes": len(out_bytes)
                })

            elif endpoint in ["/api/remove", "/remove"]:
                pdf_b64 = payload.get("pdfBase64", "")
                remove_pages_list = payload.get("pagesToRemove", [])
                pdf_bytes = base64.b64decode(pdf_b64)
                out_bytes, remaining_count = remove_pages(pdf_bytes, remove_pages_list)

                return self._send_json({
                    "success": True,
                    "filename": payload.get("outputFilename", "remaining_pages.pdf"),
                    "remainingPagesCount": remaining_count,
                    "pdfBase64": base64.b64encode(out_bytes).decode("utf-8"),
                    "sizeBytes": len(out_bytes)
                })

            elif endpoint in ["/api/organize", "/organize"]:
                pdf_b64 = payload.get("pdfBase64", "")
                new_order = payload.get("order", [])
                pdf_bytes = base64.b64decode(pdf_b64)
                out_bytes, total_count = organize_pages(pdf_bytes, new_order)

                return self._send_json({
                    "success": True,
                    "filename": payload.get("outputFilename", "organized.pdf"),
                    "totalPages": total_count,
                    "pdfBase64": base64.b64encode(out_bytes).decode("utf-8"),
                    "sizeBytes": len(out_bytes)
                })

            elif endpoint in ["/api/rotate", "/rotate"]:
                pdf_b64 = payload.get("pdfBase64", "")
                global_angle = payload.get("angle", 0)
                page_rotations = payload.get("pageRotations", {})
                pdf_bytes = base64.b64decode(pdf_b64)
                out_bytes, total_count = rotate_pages(pdf_bytes, global_angle, page_rotations)

                return self._send_json({
                    "success": True,
                    "filename": payload.get("outputFilename", "rotated.pdf"),
                    "totalPages": total_count,
                    "pdfBase64": base64.b64encode(out_bytes).decode("utf-8"),
                    "sizeBytes": len(out_bytes)
                })

            else:
                return self._send_json({"error": f"Unknown endpoint: {endpoint}"}, 404)

        except Exception as err:
            return self._send_json({"success": False, "error": str(err)}, 500)


def start_server(port=5001):
    server_address = ("127.0.0.1", port)
    httpd = HTTPServer(server_address, LocalPDFHandler)
    print(f"[Python PDF Server] Running on http://127.0.0.1:{port} (pypdf: {PYPDF_VERSION})")
    sys.stdout.flush()
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[Python PDF Server] Stopping.")
        httpd.server_close()


if __name__ == "__main__":
    port = 5001
    if len(sys.argv) > 1 and sys.argv[1].isdigit():
        port = int(sys.argv[1])
    start_server(port)
