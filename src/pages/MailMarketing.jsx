import { useEffect, useMemo, useRef, useState } from "react";
import { Import, Search, Send, Upload, Users, X } from "lucide-react";
import { API_BASE, apiFetch } from "../api.js";
import "./MailMarketing.css";

function MailMarketing() {
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sendStatus, setSendStatus] = useState("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [catalogues, setCatalogues] = useState([]);
  const [showCataloguePicker, setShowCataloguePicker] = useState(false);
  const [selectedCatalogueIds, setSelectedCatalogueIds] = useState([]);
  const [catalogueSearch, setCatalogueSearch] = useState("");
  const [uploadStatus, setUploadStatus] = useState("idle");
  const [uploadMessage, setUploadMessage] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);
  const [contacts, setContacts] = useState([]);
  const [showDepartmentPicker, setShowDepartmentPicker] = useState(false);
  const [selectedDepartments, setSelectedDepartments] = useState([]);

  useEffect(() => {
    apiFetch(`${API_BASE}/api/catalogues`)
      .then((res) => (res.ok ? res.json() : { catalogues: [] }))
      .then((data) => setCatalogues(data.catalogues || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    apiFetch(`${API_BASE}/api/contacts`)
      .then((res) => (res.ok ? res.json() : { contacts: [] }))
      .then((data) => setContacts(data.contacts || []))
      .catch(() => {});
  }, []);

  const departmentEmailMap = useMemo(() => {
    const map = new Map();
    for (const contact of contacts) {
      const department = (contact.department || "").trim();
      if (!department) continue;
      const emails = (contact.emails || []).map((email) => email.trim()).filter(Boolean);
      if (emails.length === 0) continue;
      if (!map.has(department)) map.set(department, new Set());
      emails.forEach((email) => map.get(department).add(email));
    }
    return map;
  }, [contacts]);

  const departmentOptions = useMemo(
    () =>
      Array.from(departmentEmailMap.keys())
        .sort((a, b) => a.localeCompare(b))
        .map((name) => ({ name, count: departmentEmailMap.get(name).size })),
    [departmentEmailMap]
  );

  const toggleDepartment = (name) => {
    setSelectedDepartments((prev) =>
      prev.includes(name) ? prev.filter((d) => d !== name) : [...prev, name]
    );
  };

  const departmentRecipientCount = useMemo(() => {
    const emails = new Set();
    selectedDepartments.forEach((department) => {
      departmentEmailMap.get(department)?.forEach((email) => emails.add(email));
    });
    return emails.size;
  }, [selectedDepartments, departmentEmailMap]);

  const toggleCatalogueSelect = (id) => {
    setSelectedCatalogueIds((prev) =>
      prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id]
    );
  };

  const selectedCatalogues = catalogues.filter((c) => selectedCatalogueIds.includes(c._id));

  const filteredCatalogues = useMemo(() => {
    const query = catalogueSearch.trim().toLowerCase();
    if (!query) return catalogues;
    return catalogues.filter(
      (c) =>
        c.fileName.toLowerCase().includes(query) ||
        (c.companyName || "").toLowerCase().includes(query)
    );
  }, [catalogues, catalogueSearch]);

  const uploadFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    if (files.length === 0) return;

    setUploadStatus("uploading");
    setUploadMessage("");

    const uploaded = [];
    let failed = 0;
    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await apiFetch(`${API_BASE}/api/catalogues`, { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok) throw new Error();
        uploaded.push(data.catalogue);
      } catch (err) {
        failed += 1;
      }
    }

    if (uploaded.length > 0) {
      setCatalogues((prev) => [...uploaded, ...prev]);
      setSelectedCatalogueIds((prev) => [...prev, ...uploaded.map((c) => c._id)]);
    }
    setUploadStatus(failed > 0 ? "error" : "success");
    setUploadMessage(
      failed > 0
        ? `Uploaded ${uploaded.length}, ${failed} failed (PDF only, up to 20MB).`
        : `Uploaded and attached ${uploaded.length} file(s).`
    );
  };

  const handleUploadFromComputer = (e) => {
    const files = e.target.files;
    e.target.value = "";
    uploadFiles(files);
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    if (!e.dataTransfer.types.includes("Files")) return;
    dragCounter.current += 1;
    setIsDragging(true);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    dragCounter.current = Math.max(0, dragCounter.current - 1);
    if (dragCounter.current === 0) setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragging(false);

    const dropped = Array.from(e.dataTransfer.files || []);
    if (dropped.length === 0) return;

    const pdfFiles = dropped.filter((file) => file.type === "application/pdf");
    if (pdfFiles.length === 0) {
      setUploadStatus("error");
      setUploadMessage("Only PDF files can be attached.");
      return;
    }
    setShowCataloguePicker(true);
    uploadFiles(pdfFiles);
  };

  const handleSend = async (e) => {
    e.preventDefault();

    const manualRecipients = to.split(",").map((email) => email.trim()).filter(Boolean);
    const departmentRecipients = new Set();
    selectedDepartments.forEach((department) => {
      departmentEmailMap.get(department)?.forEach((email) => departmentRecipients.add(email));
    });
    const allRecipients = Array.from(new Set([...manualRecipients, ...departmentRecipients]));

    if (allRecipients.length === 0) {
      setSendStatus("error");
      setStatusMessage("Add at least one recipient or select a department.");
      return;
    }

    setSendStatus("sending");
    setStatusMessage("");
    try {
      const res = await apiFetch(`${API_BASE}/api/mail-marketing/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: allRecipients.join(","),
          cc,
          bcc,
          subject,
          message,
          catalogueIds: selectedCatalogueIds,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send email");
      setSendStatus("success");
      setStatusMessage(`Sent to ${data.sent} recipient(s).`);
      setTo("");
      setCc("");
      setBcc("");
      setShowCcBcc(false);
      setSubject("");
      setMessage("");
      setSelectedCatalogueIds([]);
      setShowCataloguePicker(false);
      setSelectedDepartments([]);
      setShowDepartmentPicker(false);
    } catch (err) {
      setSendStatus("error");
      setStatusMessage(err.message || "Failed to send email");
    }
  };

  return (
    <div className="mail-marketing-page">
      <h1 className="mail-marketing-title">Mail Marketing</h1>

      <form
        className={`mail-marketing-compose${isDragging ? " mail-marketing-compose--dragging" : ""}`}
        onSubmit={handleSend}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isDragging && (
          <div className="mail-marketing-dropzone-overlay">
            <Upload size={28} />
            <span>Drop PDF files to attach</span>
          </div>
        )}
        <div className="mail-marketing-field">
          <label htmlFor="mailTo">To</label>
          <input
            id="mailTo"
            type="text"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="Recipient emails, separated by commas"
            required={selectedDepartments.length === 0}
          />
          {!showCcBcc && (
            <button
              type="button"
              className="mail-marketing-ccbcc-toggle"
              onClick={() => setShowCcBcc(true)}
            >
              Cc Bcc
            </button>
          )}
        </div>
        {showCcBcc && (
          <>
            <div className="mail-marketing-field">
              <label htmlFor="mailCc">Cc</label>
              <input
                id="mailCc"
                type="text"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                placeholder="Cc emails, separated by commas"
              />
            </div>
            <div className="mail-marketing-field">
              <label htmlFor="mailBcc">Bcc</label>
              <input
                id="mailBcc"
                type="text"
                value={bcc}
                onChange={(e) => setBcc(e.target.value)}
                placeholder="Bcc emails, separated by commas"
              />
            </div>
          </>
        )}

        <div className="mail-marketing-departments">
          <button
            type="button"
            className="btn-secondary mail-marketing-import-btn"
            onClick={() => setShowDepartmentPicker((prev) => !prev)}
          >
            <Users size={14} />
            Send to Department
          </button>

          {selectedDepartments.length > 0 && (
            <ul className="mail-marketing-attachments">
              {selectedDepartments.map((department) => (
                <li key={department} className="mail-marketing-attachment-chip">
                  <span>
                    {department} ({departmentEmailMap.get(department)?.size || 0})
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleDepartment(department)}
                    aria-label={`Remove ${department}`}
                  >
                    <X size={12} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {selectedDepartments.length > 0 && (
            <span className="mail-marketing-upload-status">
              {departmentRecipientCount} recipient(s) from selected department(s).
            </span>
          )}

          {showDepartmentPicker && (
            <div className="mail-marketing-catalogue-picker">
              {departmentOptions.length === 0 ? (
                <p className="mail-marketing-empty">No contacts with a department set yet.</p>
              ) : (
                departmentOptions.map((department) => (
                  <label key={department.name} className="mail-marketing-catalogue-option">
                    <input
                      type="checkbox"
                      checked={selectedDepartments.includes(department.name)}
                      onChange={() => toggleDepartment(department.name)}
                    />
                    <span>{department.name}</span>
                    <span className="mail-marketing-catalogue-company">
                      {department.count} email(s)
                    </span>
                  </label>
                ))
              )}
            </div>
          )}
        </div>

        <div className="mail-marketing-field">
          <label htmlFor="mailSubject">Subject</label>
          <input
            id="mailSubject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject"
          />
        </div>
        <textarea
          className="mail-marketing-input mail-marketing-message"
          rows={10}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write your message..."
          required
        />

        <div className="mail-marketing-attach">
          <div className="mail-marketing-attach-actions">
            <button
              type="button"
              className="btn-secondary mail-marketing-import-btn"
              onClick={() => {
                setShowCataloguePicker((prev) => !prev);
                setCatalogueSearch("");
              }}
            >
              <Import size={14} />
              Import from Catalogues
            </button>

            <label className="mail-marketing-upload-btn">
              <Upload size={13} />
              Upload from computer
              <input
                type="file"
                accept="application/pdf"
                multiple
                onChange={handleUploadFromComputer}
                className="mail-marketing-upload-input"
              />
            </label>
          </div>

          {uploadStatus === "uploading" && (
            <span className="mail-marketing-upload-status">Uploading...</span>
          )}
          {uploadStatus === "success" && (
            <span className="mail-marketing-success">{uploadMessage}</span>
          )}
          {uploadStatus === "error" && (
            <span className="mail-marketing-error">{uploadMessage}</span>
          )}

          {selectedCatalogues.length > 0 && (
            <ul className="mail-marketing-attachments">
              {selectedCatalogues.map((catalogue) => (
                <li key={catalogue._id} className="mail-marketing-attachment-chip">
                  <span>{catalogue.fileName}</span>
                  <button
                    type="button"
                    onClick={() => toggleCatalogueSelect(catalogue._id)}
                    aria-label={`Remove ${catalogue.fileName}`}
                  >
                    <X size={12} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {showCataloguePicker && (
            <div className="mail-marketing-catalogue-picker">
              {catalogues.length > 0 && (
                <div className="mail-marketing-catalogue-toolbar">
                  <div className="mail-marketing-catalogue-search">
                    <Search size={14} />
                    <input
                      type="text"
                      value={catalogueSearch}
                      onChange={(e) => setCatalogueSearch(e.target.value)}
                      placeholder="Search catalogues..."
                    />
                  </div>
                </div>
              )}
              {catalogues.length === 0 ? (
                <p className="mail-marketing-empty">No catalogues uploaded yet.</p>
              ) : filteredCatalogues.length === 0 ? (
                <p className="mail-marketing-empty">No catalogues match your search.</p>
              ) : (
                filteredCatalogues.map((catalogue) => (
                  <label key={catalogue._id} className="mail-marketing-catalogue-option">
                    <input
                      type="checkbox"
                      checked={selectedCatalogueIds.includes(catalogue._id)}
                      onChange={() => toggleCatalogueSelect(catalogue._id)}
                    />
                    <span>{catalogue.fileName}</span>
                    <span className="mail-marketing-catalogue-company">
                      {catalogue.companyName || "Unassigned"}
                    </span>
                  </label>
                ))
              )}
            </div>
          )}
        </div>

        <div className="mail-marketing-actions">
          {sendStatus === "error" && (
            <span className="mail-marketing-error">{statusMessage}</span>
          )}
          {sendStatus === "success" && (
            <span className="mail-marketing-success">{statusMessage}</span>
          )}
          <button type="submit" className="btn-primary" disabled={sendStatus === "sending"}>
            <Send size={14} />
            {sendStatus === "sending" ? "Sending..." : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default MailMarketing;
