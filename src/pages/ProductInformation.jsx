import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as XLSX from "xlsx";
import { ArrowLeft, FileText, Trash2, Upload } from "lucide-react";
import { API_BASE, apiFetch, resolveAssetUrl } from "../api.js";
import { IMPORT_COLUMNS, parseWorkbookProducts } from "../utils/productImport.js";
import "./ProductInformation.css";

function deriveCompanyName(relativePath, fallback) {
  const segments = (relativePath || "").split("/").filter(Boolean);
  if (segments.length >= 2) return segments[segments.length - 2];
  return fallback || "Unassigned";
}

function readEntry(entry, path = "") {
  return new Promise((resolve) => {
    if (entry.isFile) {
      entry.file(
        (file) => {
          file.relativePath = path + file.name;
          resolve([file]);
        },
        () => resolve([])
      );
    } else if (entry.isDirectory) {
      const reader = entry.createReader();
      const collected = [];
      const readBatch = () => {
        reader.readEntries((entries) => {
          if (entries.length === 0) {
            Promise.all(collected.map((child) => readEntry(child, `${path}${entry.name}/`))).then((nested) =>
              resolve(nested.flat())
            );
          } else {
            collected.push(...entries);
            readBatch();
          }
        }, () => resolve([]));
      };
      readBatch();
    } else {
      resolve([]);
    }
  });
}

async function uploadPdfFiles(pdfFiles, getCompanyName, { setStatus, setProgress, setMessage }) {
  setStatus("uploading");
  setProgress({ done: 0, total: pdfFiles.length });
  setMessage("");

  let succeeded = 0;
  let failed = 0;

  for (const file of pdfFiles) {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("companyName", getCompanyName(file));
      const res = await apiFetch(`${API_BASE}/api/catalogues`, { method: "POST", body: formData });
      if (!res.ok) throw new Error();
      succeeded += 1;
    } catch (err) {
      failed += 1;
    }
    setProgress((prev) => ({ ...prev, done: prev.done + 1 }));
  }

  setStatus("done");
  return { succeeded, failed };
}

function ProductInformation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState([]);
  const [note, setNote] = useState("");
  const [saveStatus, setSaveStatus] = useState("idle");
  const [importStatus, setImportStatus] = useState("idle");
  const [importMessage, setImportMessage] = useState("");
  const [catalogues, setCatalogues] = useState([]);
  const [catalogueCompany, setCatalogueCompany] = useState("");
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [catalogueUploadStatus, setCatalogueUploadStatus] = useState("idle");
  const [catalogueUploadProgress, setCatalogueUploadProgress] = useState({ done: 0, total: 0 });
  const [catalogueUploadMessage, setCatalogueUploadMessage] = useState("");
  const [selectedCatalogueIds, setSelectedCatalogueIds] = useState([]);
  const [sendEmails, setSendEmails] = useState("");
  const [sendCc, setSendCc] = useState("");
  const [sendBcc, setSendBcc] = useState("");
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [sendSubject, setSendSubject] = useState("");
  const [sendBody, setSendBody] = useState("");
  const [sendStatus, setSendStatus] = useState("idle");
  const [sendMessage, setSendMessage] = useState("");

  const loadProducts = () => {
    apiFetch(`${API_BASE}/api/products`)
      .then((res) => res.json())
      .then((data) => setProducts(data.products || []))
      .catch(() => {});
  };

  const loadCatalogues = () => {
    apiFetch(`${API_BASE}/api/catalogues`)
      .then((res) => res.json())
      .then((data) => setCatalogues(data.catalogues || []))
      .catch(() => {});
  };

  useEffect(() => {
    if (id) {
      apiFetch(`${API_BASE}/api/leads/${id}`)
        .then((res) => res.json())
        .then((data) => {
          setLead(data.lead);
          setSelected((data.lead?.sharedProducts || []).map((sp) => sp.product?._id).filter(Boolean));
        })
        .catch(() => {});
      loadProducts();
    } else {
      loadCatalogues();
    }
  }, [id]);

  const catalogueSetters = {
    setStatus: setCatalogueUploadStatus,
    setProgress: setCatalogueUploadProgress,
    setMessage: setCatalogueUploadMessage,
  };

  const finishCatalogueUpload = async (files, getCompanyName) => {
    const pdfFiles = files.filter((f) => f.name.toLowerCase().endsWith(".pdf"));
    const skippedCount = files.length - pdfFiles.length;

    if (pdfFiles.length === 0) {
      setCatalogueUploadStatus("error");
      setCatalogueUploadMessage("No PDF files found.");
      return;
    }

    const { succeeded, failed } = await uploadPdfFiles(pdfFiles, getCompanyName, catalogueSetters);
    const skippedNote = skippedCount > 0 ? ` Skipped ${skippedCount} non-PDF file(s).` : "";
    setCatalogueUploadMessage(
      `Uploaded ${succeeded} catalogue(s)${failed > 0 ? `, ${failed} failed` : ""}.${skippedNote}`
    );
    loadCatalogues();
  };

  const handleChoosePdfs = async (e) => {
    await finishCatalogueUpload(Array.from(e.target.files || []), () => catalogueCompany || "Unassigned");
    e.target.value = "";
  };

  const handleChooseFolder = async (e) => {
    await finishCatalogueUpload(Array.from(e.target.files || []), (file) =>
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

    const items = e.dataTransfer?.items;
    let files = [];

    if (items && items.length > 0 && items[0].webkitGetAsEntry) {
      const entries = Array.from(items)
        .map((item) => item.webkitGetAsEntry())
        .filter(Boolean);
      const nested = await Promise.all(entries.map((entry) => readEntry(entry)));
      files = nested.flat();
    } else {
      files = Array.from(e.dataTransfer?.files || []);
    }

    await finishCatalogueUpload(files, (file) => deriveCompanyName(file.relativePath, catalogueCompany || "Unassigned"));
  };

  const handleDeleteCatalogue = async (catalogueId) => {
    if (!window.confirm("Delete this catalogue?")) return;
    try {
      const res = await apiFetch(`${API_BASE}/api/catalogues/${catalogueId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete catalogue");
      setSelectedCatalogueIds((prev) => prev.filter((cid) => cid !== catalogueId));
      loadCatalogues();
    } catch (err) {
      // ignore
    }
  };

  const toggleCatalogueSelect = (catalogueId) => {
    setSelectedCatalogueIds((prev) =>
      prev.includes(catalogueId) ? prev.filter((cid) => cid !== catalogueId) : [...prev, catalogueId]
    );
  };

  const handleSendCatalogues = async () => {
    const recipients = sendEmails
      .split(/[,\n]/)
      .map((e) => e.trim())
      .filter(Boolean);

    if (recipients.length === 0) {
      setSendStatus("error");
      setSendMessage("Enter at least one email address.");
      return;
    }
    if (selectedCatalogueIds.length === 0) {
      setSendStatus("error");
      setSendMessage("Select at least one PDF to send.");
      return;
    }

    setSendStatus("sending");
    setSendMessage("");
    try {
      const res = await apiFetch(`${API_BASE}/api/catalogues/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: recipients,
          cc: sendCc,
          bcc: sendBcc,
          subject: sendSubject,
          message: sendBody,
          catalogueIds: selectedCatalogueIds,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Failed to send email");
      setSendStatus("success");
      setSendMessage(`Sent ${selectedCatalogueIds.length} catalogue(s) to ${recipients.length} recipient(s).`);
      setSelectedCatalogueIds([]);
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

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportStatus("importing");
    setImportMessage("");
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });

      const { sheetResults, skippedSheets } = parseWorkbookProducts(workbook);

      if (sheetResults.length === 0) {
        throw new Error("No sheet had a recognizable header row (Make / Instrument Name / Model).");
      }

      const importedProducts = sheetResults.flatMap((r) => r.products);
      const companies = Array.from(new Set(sheetResults.flatMap((r) => r.companies)));

      const res = await apiFetch(`${API_BASE}/api/products/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: importedProducts }),
      });
      if (!res.ok) throw new Error("Failed to import products");
      const data = await res.json();
      setImportStatus("success");
      const skippedNote =
        skippedSheets.length > 0 ? ` Skipped sheet(s) with no matching header: ${skippedSheets.join(", ")}.` : "";
      setImportMessage(
        `Imported ${data.count} product(s) across ${companies.length} compan${
          companies.length === 1 ? "y" : "ies"
        } from ${sheetResults.length} sheet(s).${skippedNote}`
      );
      loadProducts();
    } catch (err) {
      setImportStatus("error");
      setImportMessage(err.message || "Failed to import file.");
    } finally {
      e.target.value = "";
    }
  };

  const toggleProduct = (productId) => {
    setSelected((prev) =>
      prev.includes(productId) ? prev.filter((p) => p !== productId) : [...prev, productId]
    );
  };

  const handleSave = async () => {
    setSaveStatus("saving");
    try {
      const sharedProducts = selected.map((productId) => ({
        product: productId,
        note,
        sharedAt: new Date().toISOString(),
      }));

      const actions = (lead.actions || []).map((action) =>
        action.type === "Product Information" ? { ...action, status: "Sent" } : action
      );

      const res = await apiFetch(`${API_BASE}/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sharedProducts, actions }),
      });
      if (!res.ok) throw new Error("Failed to save");
      navigate(`/sales/leads/${id}`);
    } catch (err) {
      setSaveStatus("error");
    }
  };

  if (id && !lead) {
    return <div className="product-info-page">Loading...</div>;
  }

  return (
    <div className="product-info-page">
      {id && (
        <button type="button" className="product-info-back" onClick={() => navigate(`/sales/leads/${id}`)}>
          <ArrowLeft size={16} />
          <span>{lead.name}</span>
        </button>
      )}

      <h1 className="product-info-title">Product Information</h1>
      <p className="product-info-subtitle">
        {id ? `Select the products to share with ${lead.name}.` : "Browse the product catalog."}
      </p>

      {!id && (
        <div className="product-info-catalogues">
          <h2 className="product-info-catalogues-title">Catalogues</h2>

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
              A dropped or chosen folder has every PDF inside its subfolders uploaded, filed under its immediate
              parent folder name as the company/vendor. Loose PDFs use the company name below. Non-PDF files are
              skipped.
            </p>

            <div className="product-info-dropzone-actions">
              <input
                type="text"
                value={catalogueCompany}
                onChange={(e) => setCatalogueCompany(e.target.value)}
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

          {catalogueUploadStatus === "uploading" && (
            <span className="product-info-import-status">
              Uploading {catalogueUploadProgress.done}/{catalogueUploadProgress.total}...
            </span>
          )}
          {catalogueUploadStatus === "error" && <span className="product-info-error">{catalogueUploadMessage}</span>}
          {catalogueUploadStatus === "done" && (
            <span className="product-info-import-success">{catalogueUploadMessage}</span>
          )}

          {catalogues.length > 0 && (
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
                  <button
                    type="button"
                    className="product-info-send-cc-toggle"
                    onClick={() => setShowCcBcc(true)}
                  >
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
                  placeholder="Product Catalogues"
                />
              </div>

              <textarea
                value={sendBody}
                onChange={(e) => setSendBody(e.target.value)}
                placeholder="Message (leave blank to auto-list the selected catalogues)"
                rows={3}
                className="product-info-send-input"
              />

              <div className="product-info-send-row">
                <span className="product-info-send-count">{selectedCatalogueIds.length} PDF(s) selected</span>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleSendCatalogues}
                  disabled={sendStatus === "sending"}
                >
                  {sendStatus === "sending" ? "Sending..." : "Send"}
                </button>
              </div>
              {sendStatus === "error" && <span className="product-info-error">{sendMessage}</span>}
              {sendStatus === "success" && <span className="product-info-import-success">{sendMessage}</span>}
            </div>
          )}

          {catalogues.length === 0 && <p className="product-info-empty">No catalogues uploaded yet.</p>}
          {catalogues.length > 0 && (
            <ul className="product-info-catalogue-list">
              {catalogues.map((catalogue) => (
                <li
                  key={catalogue._id}
                  className={`product-info-catalogue-card ${
                    selectedCatalogueIds.includes(catalogue._id) ? "selected" : ""
                  }`}
                >
                  <input
                    type="checkbox"
                    className="product-info-catalogue-select"
                    checked={selectedCatalogueIds.includes(catalogue._id)}
                    onChange={() => toggleCatalogueSelect(catalogue._id)}
                    aria-label={`Select ${catalogue.fileName}`}
                  />
                  <button
                    type="button"
                    className="product-info-catalogue-delete"
                    onClick={() => handleDeleteCatalogue(catalogue._id)}
                    aria-label="Delete catalogue"
                  >
                    <Trash2 size={14} />
                  </button>
                  <FileText size={22} className="product-info-catalogue-icon" />
                  <a
                    href={resolveAssetUrl(catalogue.url)}
                    target="_blank"
                    rel="noreferrer"
                    className="product-info-catalogue-name"
                    title={catalogue.fileName}
                  >
                    {catalogue.fileName}
                  </a>
                  <span className="product-info-catalogue-company">{catalogue.companyName || "Unassigned"}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {!id && (
        <div className="product-info-import">
          <label className="btn-secondary product-info-import-file-btn">
            <Upload size={14} />
            Import products (.xlsx, .xls, .csv)
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleImportFile}
              className="product-info-import-file-input"
            />
          </label>
          <p className="product-info-import-hint">
            Every sheet in the file is scanned; each row is filed under the company name in its own Make column.
            Sheets without an Instrument Name / Model / Make header are skipped. Columns used:{" "}
            {IMPORT_COLUMNS.map((c) => c.header).join(", ")}
          </p>
          {importStatus === "importing" && <span className="product-info-import-status">Importing...</span>}
          {importStatus === "error" && <span className="product-info-error">{importMessage}</span>}
          {importStatus === "success" && <span className="product-info-import-success">{importMessage}</span>}
        </div>
      )}

      {id && (
        <>
          <div className="product-info-list">
            {products.length === 0 && <p className="product-info-empty">No products in the catalog yet.</p>}
            {products.map((product, index) => (
              <label key={product._id} className="product-info-item">
                <span className="product-info-item-sno">{index + 1}</span>
                <input
                  type="checkbox"
                  checked={selected.includes(product._id)}
                  onChange={() => toggleProduct(product._id)}
                />
                <div>
                  <div className="product-info-item-name">
                    {product.instrumentName || "-"}
                    {product.model ? ` (${product.model})` : ""}
                  </div>
                  <div className="product-info-item-meta">
                    {product.companyName || "-"}
                    {product.nutechPrice ? ` · Nutech Price: ${product.nutechPrice}` : ""}
                    {product.splPrice ? ` · SPL Price: ${product.splPrice}` : ""}
                    {product.phenotecPrice ? ` · Phenotec Price: ${product.phenotecPrice}` : ""}
                  </div>
                </div>
              </label>
            ))}
          </div>

          <div className="form-field">
            <label htmlFor="note">Note</label>
            <textarea
              id="note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Note to include when sharing this information"
            />
          </div>

          <div className="product-info-actions">
            {saveStatus === "error" && <span className="product-info-error">Could not save. Try again.</span>}
            <button type="button" className="btn-primary" onClick={handleSave} disabled={saveStatus === "saving"}>
              {saveStatus === "saving" ? "Saving..." : "Save & Mark Sent"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default ProductInformation;
