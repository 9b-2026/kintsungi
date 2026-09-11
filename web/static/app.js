const form = document.querySelector("#upload-form");
const input = document.querySelector("#file-input");
const dropzone = document.querySelector(".dropzone");
const browseButton = document.querySelector("#browse-button");
const convertButton = document.querySelector("#convert-button");
const selectedFile = document.querySelector("#selected-file");
const selectedName = document.querySelector("#selected-name");
const removeFile = document.querySelector("#remove-file");
const status = document.querySelector("#status");
const resultSection = document.querySelector("#result-section");
const output = document.querySelector("#markdown-output");
const resultTitle = document.querySelector("#result-title");
const copyButton = document.querySelector("#copy-button");
const downloadButton = document.querySelector("#download-button");
const modeTabs = document.querySelectorAll(".mode-tab");
const markdownMode = document.querySelector("#markdown-mode");
const pdfMode = document.querySelector("#pdf-mode");
const pdfInput = document.querySelector("#pdf-input");
const pdfSelected = document.querySelector("#pdf-selected");
const pdfOperation = document.querySelector("#pdf-operation");
const pdfPages = document.querySelector("#pdf-pages");
const pdfPagesField = document.querySelector("#pdf-pages-field");
const pdfAngleField = document.querySelector("#pdf-angle-field");
const pdfAngle = document.querySelector("#pdf-angle");
const pdfRun = document.querySelector("#pdf-run");
const pdfStatus = document.querySelector("#pdf-status");
const pdfInfo = document.querySelector("#pdf-info");
const pdfDownload = document.querySelector("#pdf-download");
let convertedMarkdown = "";
let downloadName = "converted.md";

modeTabs.forEach((tab) => tab.addEventListener("click", () => {
  const isPdf = tab.dataset.mode === "pdf";
  modeTabs.forEach((item) => item.classList.toggle("active", item === tab));
  markdownMode.hidden = isPdf;
  pdfMode.hidden = !isPdf;
}));

function setFile(file) {
  if (!file) return;
  const transfer = new DataTransfer();
  transfer.items.add(file);
  input.files = transfer.files;
  selectedName.textContent = file.name;
  selectedFile.hidden = false;
  convertButton.disabled = false;
  status.textContent = "";
}

browseButton.addEventListener("click", () => input.click());
input.addEventListener("change", () => setFile(input.files[0]));
removeFile.addEventListener("click", () => {
  input.value = "";
  selectedFile.hidden = true;
  convertButton.disabled = true;
  status.textContent = "";
});
["dragenter", "dragover"].forEach((eventName) => dropzone.addEventListener(eventName, (event) => {
  event.preventDefault();
  dropzone.classList.add("dragover");
}));
["dragleave", "drop"].forEach((eventName) => dropzone.addEventListener(eventName, (event) => {
  event.preventDefault();
  dropzone.classList.remove("dragover");
}));
dropzone.addEventListener("drop", (event) => setFile(event.dataTransfer.files[0]));

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!input.files[0]) return;
  convertButton.disabled = true;
  status.textContent = "Converting...";
  resultSection.hidden = true;
  try {
    const response = await fetch("/api/convert", { method: "POST", body: new FormData(form) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Conversion failed.");
    convertedMarkdown = data.markdown;
    downloadName = data.download_name;
    output.textContent = convertedMarkdown;
    resultTitle.textContent = data.filename;
    resultSection.hidden = false;
    status.textContent = "Converted successfully.";
    resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    status.textContent = error.message;
  } finally {
    convertButton.disabled = false;
  }
});

copyButton.addEventListener("click", async () => {
  await navigator.clipboard.writeText(convertedMarkdown);
  copyButton.textContent = "Copied";
  setTimeout(() => { copyButton.textContent = "Copy"; }, 1400);
});
downloadButton.addEventListener("click", () => {
  const blob = new Blob([convertedMarkdown], { type: "text/markdown;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = downloadName;
  link.click();
  URL.revokeObjectURL(link.href);
});

pdfOperation.addEventListener("change", () => {
  const operation = pdfOperation.value;
  pdfPagesField.hidden = operation === "merge" || operation === "info";
  pdfAngleField.hidden = operation !== "rotate";
  pdfPages.placeholder = operation === "organize" ? "Example: 3, 1, 2" : "Example: 1-3, 5";
});
pdfInput.addEventListener("change", () => {
  pdfSelected.textContent = [...pdfInput.files].map((file) => file.name).join(", ") || "No PDF selected.";
});

const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result.split(",")[1]);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

pdfRun.addEventListener("click", async () => {
  const files = [...pdfInput.files];
  const operation = pdfOperation.value;
  if (!files.length) { pdfStatus.textContent = "Choose at least one PDF."; return; }
  if (operation !== "merge" && operation !== "info" && !pdfPages.value.trim() && operation !== "rotate") {
    pdfStatus.textContent = "Enter the page numbers first."; return;
  }
  pdfRun.disabled = true;
  pdfStatus.textContent = "Processing locally...";
  pdfDownload.hidden = true;
  pdfInfo.hidden = true;
  try {
    const encoded = await Promise.all(files.map(async (file) => ({ name: file.name, base64: await fileToBase64(file) })));
    const first = encoded[0].base64;
    const pageValues = pdfPages.value.split(",").flatMap((part) => {
      const [start, end] = part.trim().split("-").map(Number);
      return end ? Array.from({ length: end - start + 1 }, (_, index) => start + index) : Number.isNaN(start) ? [] : [start];
    });
    const payload = { pdfBase64: first };
    if (operation === "merge") payload.files = encoded;
    if (["extract", "remove"].includes(operation)) payload[operation === "extract" ? "pages" : "pagesToRemove"] = pageValues;
    if (operation === "organize") payload.order = pageValues;
    if (operation === "split") { payload.mode = "extract_ranges"; payload.ranges = pdfPages.value; }
    if (operation === "rotate") payload.angle = Number(pdfAngle.value);
    const response = await fetch(`/api/pdf/${operation}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await response.json();
    if (!response.ok || !data.success) throw new Error(data.error || "PDF operation failed.");
    if (operation === "info") {
      pdfInfo.textContent = JSON.stringify(data.info, null, 2);
      pdfInfo.hidden = false;
    } else {
      const binary = atob(data.dataBase64);
      const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
      pdfDownload.href = URL.createObjectURL(new Blob([bytes], { type: data.mimeType }));
      pdfDownload.download = data.filename;
      pdfDownload.textContent = `Download ${data.filename}`;
      pdfDownload.hidden = false;
    }
    pdfStatus.textContent = "Done.";
  } catch (error) {
    pdfStatus.textContent = error.message;
  } finally {
    pdfRun.disabled = false;
  }
});