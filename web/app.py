from __future__ import annotations

import os
import base64
import sys
import tempfile
from pathlib import Path

from flask import Flask, jsonify, render_template, request, send_file
from werkzeug.utils import secure_filename

from markitdown import MarkItDown


PDF_TOOLS = Path(__file__).resolve().parent.parent / "pdf-tools"
if str(PDF_TOOLS) not in sys.path:
    sys.path.insert(0, str(PDF_TOOLS))
from python_server import (  # noqa: E402
    extract_pages,
    inspect_pdf,
    merge_pdfs,
    organize_pages,
    remove_pages,
    rotate_pages,
    split_pdf,
)


ROOT = Path(__file__).resolve().parent
MAX_UPLOAD_BYTES = 50 * 1024 * 1024

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = MAX_UPLOAD_BYTES
converter = MarkItDown()


@app.get("/")
def index():
    return render_template("index.html")


@app.post("/api/convert")
def convert_file():
    uploaded = request.files.get("file")
    if uploaded is None or not uploaded.filename:
        return jsonify(error="Choose a file to convert."), 400

    filename = secure_filename(uploaded.filename)
    if not filename:
        return jsonify(error="That filename cannot be processed."), 400

    suffix = Path(filename).suffix
    temporary_path: str | None = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temporary:
            temporary_path = temporary.name
            uploaded.save(temporary)

        result = converter.convert(temporary_path)
        markdown_filename = f"{Path(filename).stem or 'converted'}.md"
        return jsonify(
            filename=filename,
            markdown=result.markdown,
            download_name=markdown_filename,
        )
    except Exception as error:
        app.logger.exception("Conversion failed for %s", filename)
        return jsonify(error=str(error)), 422
    finally:
        if temporary_path:
            try:
                os.unlink(temporary_path)
            except FileNotFoundError:
                pass


def _decode_pdf(value: str) -> bytes:
    if not value:
        raise ValueError("Choose a PDF first.")
    return base64.b64decode(value, validate=True)


def _pdf_result(data: bytes, filename: str, mime_type: str = "application/pdf", **extra):
    return jsonify(
        success=True,
        filename=filename,
        mimeType=mime_type,
        dataBase64=base64.b64encode(data).decode("ascii"),
        sizeBytes=len(data),
        **extra,
    )


@app.get("/api/health")
def health():
    return jsonify(status="ok", server="kintsungi", features=["markitdown", "pdf-tools"])


@app.post("/api/pdf/info")
def pdf_info():
    try:
        return jsonify(success=True, info=inspect_pdf(_decode_pdf(request.json.get("pdfBase64", ""))))
    except Exception as error:
        return jsonify(success=False, error=str(error)), 422


@app.post("/api/pdf/merge")
def pdf_merge():
    try:
        files = request.json.get("files", [])
        merged, pages = merge_pdfs([_decode_pdf(item.get("base64", "")) for item in files])
        return _pdf_result(merged, request.json.get("outputFilename", "merged.pdf"), totalPages=pages)
    except Exception as error:
        return jsonify(success=False, error=str(error)), 422


@app.post("/api/pdf/split")
def pdf_split():
    try:
        result, mime_type, default_name, count = split_pdf(
            _decode_pdf(request.json.get("pdfBase64", "")),
            request.json.get("mode", "extract_ranges"),
            request.json.get("ranges", "1"),
        )
        return _pdf_result(
            result,
            request.json.get("outputFilename", default_name),
            mime_type,
            pagesOrFiles=count,
        )
    except Exception as error:
        return jsonify(success=False, error=str(error)), 422


@app.post("/api/pdf/extract")
def pdf_extract():
    try:
        result, count = extract_pages(
            _decode_pdf(request.json.get("pdfBase64", "")), request.json.get("pages", [])
        )
        return _pdf_result(result, request.json.get("outputFilename", "extracted_pages.pdf"), extractedPagesCount=count)
    except Exception as error:
        return jsonify(success=False, error=str(error)), 422


@app.post("/api/pdf/remove")
def pdf_remove():
    try:
        result, count = remove_pages(
            _decode_pdf(request.json.get("pdfBase64", "")), request.json.get("pagesToRemove", [])
        )
        return _pdf_result(result, request.json.get("outputFilename", "remaining_pages.pdf"), remainingPagesCount=count)
    except Exception as error:
        return jsonify(success=False, error=str(error)), 422


@app.post("/api/pdf/organize")
def pdf_organize():
    try:
        result, count = organize_pages(
            _decode_pdf(request.json.get("pdfBase64", "")), request.json.get("order", [])
        )
        return _pdf_result(result, request.json.get("outputFilename", "organized.pdf"), totalPages=count)
    except Exception as error:
        return jsonify(success=False, error=str(error)), 422


@app.post("/api/pdf/rotate")
def pdf_rotate():
    try:
        result, count = rotate_pages(
            _decode_pdf(request.json.get("pdfBase64", "")),
            request.json.get("angle", 0),
            request.json.get("pageRotations", {}),
        )
        return _pdf_result(result, request.json.get("outputFilename", "rotated.pdf"), totalPages=count)
    except Exception as error:
        return jsonify(success=False, error=str(error)), 422


@app.errorhandler(413)
def request_too_large(_error):
    return jsonify(error="That file is larger than the 50 MB limit."), 413


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=int(os.environ.get("PORT", "5000")), debug=True)