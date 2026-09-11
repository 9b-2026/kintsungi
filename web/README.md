# Kintsungi

Kintsungi is a local web UI combining the repository's `MarkItDown` converter with the extracted PDF tools. It accepts supported documents for Markdown conversion and can merge, split, extract, remove, organize, rotate, or inspect PDF files.

## Run locally

From the repository root, double-click `run-kintsungi.bat`, or run these commands in PowerShell:

```powershell
.\.venv\Scripts\python.exe -m pip install -e ".\packages\markitdown[all]"
.\.venv\Scripts\python.exe -m pip install flask
.\.venv\Scripts\python.exe .\kintsungi_server.py
```

Open `http://127.0.0.1:5000`. The combined server binds to localhost and limits uploads to 50 MB. The PDF engine uses the extracted `pdf-tools/python_packages/pypdf` package locally.