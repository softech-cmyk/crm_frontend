import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { FileText, Trash2, Upload } from "lucide-react";
import { API_BASE, apiFetch, resolveAssetUrl } from "../api.js";
import { deriveCompanyName, filesFromDrop, uploadPdfFiles } from "../utils/pdfUpload.js";
import "./ProductInformation.css";

function ShareQuotation() {
  const [searchParams] = useSearchParams();
  const preselectId = searchParams.get("select");
  const [files, setFiles] = useState([]);
  const [company, setCompany] = useState("");
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("idle");
  const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 });
  const [uploadMessage, setUploadMessage] = useState("");
  const [selectedIds, setSelectedIds] = useState(preselectId ? [preselectId] : []);
  const [sendEmails, setSendEmails] = useState("");
  const [sendCc, setSendCc] = useState("");
  const [sendBcc, setSendBcc] = useState("");
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [sendSubject, setSendSubject] = useState("");
  const [sendBody, setSendBody] = useState("");
  const [sendStatus, setSendStatus] = useState("idle");
  const [sendMessage, setSendMessage] = useState("");

  const loadFiles = () => {
    apiFetch(`${API_BASE}/api/quotation-files`)
      .then((res) => res.json())
      .then((data) => setFiles(data.files || []))
      .catch(() => {});
  };

  useEffect(loadFiles, []);

  const setters = { setStatus: setUploadStatus, setProgress: setUploadProgress, setMessage: setUploadMessage };

  const finishUpload = async (picked, getCompanyName) => {
    const pdfFiles = picked.filter((f) => f.name.toLowerCase().endsWith(".pdf"));
    const skippedCount = picked.length - pdfFiles.length;

    if (pdfFiles.length === 0) {
      setUploadStatus("error");
      setUploadMessage("No PDF files found.");
      return;
    }

    const { succeeded, failed } = await uploadPdfFiles("/api/quotation-files", pdfFiles, getCompanyName, setters);
    const skippedNote = skippedCount > 0 ? ` Skipped ${skippedCount} non-PDF file(s).` : "";
    setUploadMessage(`Uploaded ${succeeded} quotation(s)${failed > 0 ? `, ${failed} failed` : ""}.${skippedNote}`);
    loadFiles();
  };

  const handleChoosePdfs = async (e) => {
    await finishUpload(Array.from(e.target.files || []), () => company || "Unassigned");
    e.target.value = "";
  };

  const handleChooseFolder = async (e) => {
    await finishUpload(Array.from(e.target.files || []), (file) =>
      deriveCompanyName(file.webkitRelativePath, "Unassigned")
    );
    e.target.value = "";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    const dropped = await filesFromDrop(e.dataTransfer);
    await finishUpload(dropped, (file) => deriveCompanyName(file.relativePath, company || "Unassigned"));
  };

  const handleDelete = async (fileId) => {
    if (!window.confirm("Delete this quotation?")) return;
    try {
      const res = await apiFetch(`${API_BASE}/api/quotation-files/${fileId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete quotation");
      setSelectedIds((prev) => prev.filter((id) => id !== fileId));
      loadFiles();
    } catch (err) {
      // ignore
    }
  };

  const toggleSelect = (fileId) => {
    setSelectedIds((prev) => (prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId]));
  };

  const handleSend = async () => {
    const recipients = sendEmails
      .split(/[,\n]/)
      .map((e) => e.trim())
      .filter(Boolean);

    if (recipients.length === 0) {
      setSendStatus("error");
      setSendMessage("Enter at least one email address.");
      return;
    }
    if (selectedIds.length === 0) {
      setSendStatus("error");
      setSendMessage("Select at least one PDF to send.");
      return;
    }

    setSendStatus("sending");
    setSendMessage("");
    try {
      const res = await apiFetch(`${API_BASE}/api/quotation-files/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: recipients,
          cc: sendCc,
          bcc: sendBcc,
          subject: sendSubject,
          message: sendBody,
          fileIds: selectedIds,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to send email");
      setSendStatus("success");
      setSendMessage(`Sent ${selectedIds.length} quotation(s) to ${recipients.length} recipient(s).`);
      setSelectedIds([]);
      setSendEmails("");
      setSendCc("");
      setSendBcc("");
      setShowCcBcc(false);
      setSendSubject("");
      setSendBody("");
    } catch (err) {
      setSendStatus("error");
      setSendMessage(err.message || "Failed to send email");
    }
  };

  return (
    <div className="product-info-page">
      <h1 className="product-info-title">Share Quotation</h1>
      <p className="product-info-subtitle">Import quotation PDFs and email them to customers.</p>

      <div className="product-info-catalogues">
        <h2 className="product-info-catalogues-title">Quotations</h2>

        <div
          className={`product-info-dropzone ${isDraggingOver ? "active" : ""}`}
          onDragOver={handleDragOver}
          onDragEnter={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload size={20} className="product-info-dropzone-icon" />
          <p className="product-info-dropzone-text">Drag and drop PDF files or folders here</p>
          <p className="product-info-import-hint">
            A dropped or chosen folder has every PDF inside its subfolders uploaded, filed under its immediate parent
            folder name as the company/vendor. Loose PDFs use the company name below. Non-PDF files are skipped.
          </p>

          <div className="product-info-dropzone-actions">
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Company / vendor name (for loose PDFs)"
              className="product-info-catalogue-company-input"
            />
            <label className="btn-secondary product-info-import-file-btn">
              <Upload size={14} />
              Choose PDF(s)
              <input
                type="file"
                accept="application/pdf"
                multiple
                onChange={handleChoosePdfs}
                className="product-info-import-file-input"
              />
            </label>
            <label className="btn-secondary product-info-import-file-btn">
              <Upload size={14} />
              Choose folder
              <input
                type="file"
                webkitdirectory=""
                directory=""
                multiple
                onChange={handleChooseFolder}
                className="product-info-import-file-input"
              />
            </label>
          </div>
        </div>

        {uploadStatus === "uploading" && (
          <span className="product-info-import-status">
            Uploading {uploadProgress.done}/{uploadProgress.total}...
          </span>
        )}
        {uploadStatus === "error" && <span className="product-info-error">{uploadMessage}</span>}
        {uploadStatus === "done" && <span className="product-info-import-success">{uploadMessage}</span>}

        <div className="product-info-send">
          <div className="product-info-send-field">
            <label htmlFor="send-to">To</label>
            <input
              id="send-to"
              type="text"
              value={sendEmails}
              onChange={(e) => setSendEmails(e.target.value)}
              placeholder="Recipient emails, separated by commas"
            />
            {!showCcBcc && (
              <button type="button" className="product-info-send-cc-toggle" onClick={() => setShowCcBcc(true)}>
                Cc Bcc
              </button>
            )}
          </div>

          {showCcBcc && (
            <>
              <div className="product-info-send-field">
                <label htmlFor="send-cc">Cc</label>
                <input
                  id="send-cc"
                  type="text"
                  value={sendCc}
                  onChange={(e) => setSendCc(e.target.value)}
                  placeholder="Cc emails, separated by commas"
                />
              </div>
              <div className="product-info-send-field">
                <label htmlFor="send-bcc">Bcc</label>
                <input
                  id="send-bcc"
                  type="text"
                  value={sendBcc}
                  onChange={(e) => setSendBcc(e.target.value)}
                  placeholder="Bcc emails, separated by commas"
                />
              </div>
            </>
          )}

          <div className="product-info-send-field">
            <label htmlFor="send-subject">Subject</label>
            <input
              id="send-subject"
              type="text"
              value={sendSubject}
              onChange={(e) => setSendSubject(e.target.value)}
              placeholder="Quotation"
            />
          </div>

          <textarea
            value={sendBody}
            onChange={(e) => setSendBody(e.target.value)}
            placeholder="Message (leave blank to auto-list the selected quotations)"
            rows={3}
            className="product-info-send-input"
          />

          <div className="product-info-send-row">
            <span className="product-info-send-count">{selectedIds.length} PDF(s) selected</span>
            <button type="button" className="btn-primary" onClick={handleSend} disabled={sendStatus === "sending"}>
              {sendStatus === "sending" ? "Sending..." : "Send"}
            </button>
          </div>
          {sendStatus === "error" && <span className="product-info-error">{sendMessage}</span>}
          {sendStatus === "success" && <span className="product-info-import-success">{sendMessage}</span>}
        </div>

        {files.length === 0 && <p className="product-info-empty">No quotations uploaded yet.</p>}
        {files.length > 0 && (
          <ul className="product-info-catalogue-list">
            {files.map((file) => (
              <li
                key={file._id}
                className={`product-info-catalogue-card ${selectedIds.includes(file._id) ? "selected" : ""}`}
              >
                <input
                  type="checkbox"
                  className="product-info-catalogue-select"
                  checked={selectedIds.includes(file._id)}
                  onChange={() => toggleSelect(file._id)}
                  aria-label={`Select ${file.fileName}`}
                />
                <button
                  type="button"
                  className="product-info-catalogue-delete"
                  onClick={() => handleDelete(file._id)}
                  aria-label="Delete quotation"
                >
                  <Trash2 size={14} />
                </button>
                <FileText size={22} className="product-info-catalogue-icon" />
                <a
                  href={resolveAssetUrl(file.url)}
                  target="_blank"
                  rel="noreferrer"
                  className="product-info-catalogue-name"
                  title={file.fileName}
                >
                  {file.fileName}
                </a>
                <span className="product-info-catalogue-company">{file.companyName || "Unassigned"}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default ShareQuotation;
