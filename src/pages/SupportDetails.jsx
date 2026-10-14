import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { Trash2, Upload } from "lucide-react";
import { API_BASE, apiFetch } from "../api.js";
import { normalizeDate } from "../utils/excelDate.js";
import "./SupportDetails.css";

const IMPORT_COLUMNS = [
  { header: "Sr No.", field: "serialNo" },
  { header: "Installation Date", field: "installationDate" },
  { header: "Ticket Date", field: "ticketDate" },
  { header: "Ticket Number", field: "ticketNumber" },
  { header: "Product", field: "product" },
  { header: "Serial No.", field: "serialNumber" },
  { header: "Warranty", field: "warranty" },
  { header: "Customer", field: "customer" },
  { header: "Institute", field: "institute" },
  { header: "Place", field: "place" },
  { header: "State", field: "state" },
  { header: "Email Id", field: "emailId" },
  { header: "Solution", field: "solution" },
  { header: "Phone No.", field: "phoneNo" },
  { header: "Problems", field: "problems" },
  { header: "Status", field: "status" },
];

const DATE_FIELDS = new Set(["installationDate", "ticketDate"]);

const STATUSES = ["Open", "In Progress", "Resolved", "Closed"];

const STATUS_STYLES = {
  Open: { bg: "#fee2e2", text: "#b91c1c" },
  "In Progress": { bg: "#fef3c7", text: "#b45309" },
  Resolved: { bg: "#dcfce7", text: "#15803d" },
  Closed: { bg: "#f1f5f9", text: "#475569" },
};

function getTimeTaken(supportEntry) {
  const ticketDate = normalizeDate(supportEntry.ticketDate);
  const resolvedDate = normalizeDate(supportEntry.resolvedDate);
  if (!ticketDate) return "-";
  const start = new Date(ticketDate);
  if (Number.isNaN(start.getTime())) return "-";
  const end = resolvedDate ? new Date(resolvedDate) : new Date();
  const days = Math.max(0, Math.round((end - start) / (1000 * 60 * 60 * 24)));
  const label = `${days} day${days === 1 ? "" : "s"}`;
  return resolvedDate ? label : `${label} (ongoing)`;
}

function SupportDetails() {
  const [supportEntries, setSupportEntries] = useState([]);
  const [serialNo, setSerialNo] = useState("");
  const [installationDate, setInstallationDate] = useState("");
  const [ticketDate, setTicketDate] = useState("");
  const [ticketNumber, setTicketNumber] = useState("");
  const [product, setProduct] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [warranty, setWarranty] = useState("");
  const [customer, setCustomer] = useState("");
  const [institute, setInstitute] = useState("");
  const [place, setPlace] = useState("");
  const [state, setState] = useState("");
  const [emailId, setEmailId] = useState("");
  const [solution, setSolution] = useState("");
  const [phoneNo, setPhoneNo] = useState("");
  const [problems, setProblems] = useState("");
  const [status, setStatus] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [saveStatus, setSaveStatus] = useState("idle");
  const [importStatus, setImportStatus] = useState("idle");
  const [importMessage, setImportMessage] = useState("");
  const [updatingStatusId, setUpdatingStatusId] = useState(null);

  const loadSupportEntries = () => {
    apiFetch(`${API_BASE}/api/support`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load support entries");
        return res.json();
      })
      .then((data) => setSupportEntries(data.supportEntries || []))
      .catch(() => {});
  };

  useEffect(loadSupportEntries, []);

  const handleCancelEdit = () => {
    setEditingId(null);
    setSerialNo("");
    setInstallationDate("");
    setTicketDate("");
    setTicketNumber("");
    setProduct("");
    setSerialNumber("");
    setWarranty("");
    setCustomer("");
    setInstitute("");
    setPlace("");
    setState("");
    setEmailId("");
    setSolution("");
    setPhoneNo("");
    setProblems("");
    setStatus("");
    setSaveStatus("idle");
  };

  const handleStatusChange = async (supportEntry, newStatus) => {
    if (newStatus === (supportEntry.status || "")) return;
    setUpdatingStatusId(supportEntry._id);
    try {
      const res = await apiFetch(`${API_BASE}/api/support/${supportEntry._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      const data = await res.json();
      setSupportEntries((prev) =>
        prev.map((entry) => (entry._id === supportEntry._id ? data.supportEntry : entry))
      );
    } catch (err) {
      // ignore
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleDelete = async (supportEntry) => {
    if (!window.confirm("Delete this support entry?")) return;
    try {
      const res = await apiFetch(`${API_BASE}/api/support/${supportEntry._id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete support entry");
      if (editingId === supportEntry._id) handleCancelEdit();
      loadSupportEntries();
    } catch (err) {
      // ignore
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveStatus("saving");
    try {
      const url = editingId ? `${API_BASE}/api/support/${editingId}` : `${API_BASE}/api/support`;
      const res = await apiFetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serialNo,
          installationDate,
          ticketDate,
          ticketNumber,
          product,
          serialNumber,
          warranty,
          customer,
          institute,
          place,
          state,
          emailId,
          solution,
          phoneNo,
          problems,
          status,
        }),
      });
      if (!res.ok) throw new Error("Failed to save support entry");
      setEditingId(null);
      setSerialNo("");
      setInstallationDate("");
      setTicketDate("");
      setTicketNumber("");
      setProduct("");
      setSerialNumber("");
      setWarranty("");
      setCustomer("");
      setInstitute("");
      setPlace("");
      setState("");
      setEmailId("");
      setSolution("");
      setPhoneNo("");
      setProblems("");
      setStatus("");
      setSaveStatus("idle");
      loadSupportEntries();
    } catch (err) {
      setSaveStatus("error");
    }
  };

  const handleImportFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportStatus("importing");
    setImportMessage("");
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      const entriesToImport = rows
        .map((row) =>
          Object.fromEntries(
            IMPORT_COLUMNS.map(({ header, field }) => {
              const raw = row[header];
              if (DATE_FIELDS.has(field) && raw instanceof Date && !Number.isNaN(raw.getTime())) {
                return [field, raw.toISOString().slice(0, 10)];
              }
              return [field, String(raw ?? "").trim()];
            })
          )
        )
        .filter((entry) => Object.values(entry).some((value) => value));
      if (entriesToImport.length === 0) {
        throw new Error("No valid support entries found in file.");
      }
      const res = await apiFetch(`${API_BASE}/api/support/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supportEntries: entriesToImport }),
      });
      if (!res.ok) throw new Error("Failed to import support entries");
      const data = await res.json();
      setImportStatus("success");
      setImportMessage(`Imported ${data.count} support entr${data.count === 1 ? "y" : "ies"}.`);
      loadSupportEntries();
    } catch (err) {
      setImportStatus("error");
      setImportMessage(err.message || "Failed to import file.");
    } finally {
      e.target.value = "";
    }
  };

  return (
    <div className="support-page">
      <h1 className="support-title">Support Details</h1>

      <form className="support-form" onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="supportSerialNo">Sr No.</label>
          <input
            id="supportSerialNo"
            value={serialNo}
            onChange={(e) => setSerialNo(e.target.value)}
            placeholder="Enter sr no."
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="supportInstallationDate">Installation Date</label>
          <input
            id="supportInstallationDate"
            type="date"
            value={installationDate}
            onChange={(e) => setInstallationDate(e.target.value)}
          />
        </div>
        <div className="form-field">
          <label htmlFor="supportTicketDate">Ticket Date</label>
          <input
            id="supportTicketDate"
            type="date"
            value={ticketDate}
            onChange={(e) => setTicketDate(e.target.value)}
          />
        </div>
        <div className="form-field">
          <label htmlFor="supportTicketNumber">Ticket Number</label>
          <input
            id="supportTicketNumber"
            value={ticketNumber}
            onChange={(e) => setTicketNumber(e.target.value)}
            placeholder="Enter ticket number"
          />
        </div>
        <div className="form-field">
          <label htmlFor="supportProduct">Product</label>
          <input
            id="supportProduct"
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            placeholder="Enter product"
          />
        </div>
        <div className="form-field">
          <label htmlFor="supportSerialNumber">Serial No.</label>
          <input
            id="supportSerialNumber"
            value={serialNumber}
            onChange={(e) => setSerialNumber(e.target.value)}
            placeholder="Enter serial no."
          />
        </div>
        <div className="form-field">
          <label htmlFor="supportWarranty">Warranty</label>
          <input
            id="supportWarranty"
            value={warranty}
            onChange={(e) => setWarranty(e.target.value)}
            placeholder="Enter warranty"
          />
        </div>
        <div className="form-field">
          <label htmlFor="supportCustomer">Customer</label>
          <input
            id="supportCustomer"
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            placeholder="Enter customer"
          />
        </div>
        <div className="form-field">
          <label htmlFor="supportInstitute">Institute</label>
          <input
            id="supportInstitute"
            value={institute}
            onChange={(e) => setInstitute(e.target.value)}
            placeholder="Enter institute"
          />
        </div>
        <div className="form-field">
          <label htmlFor="supportPlace">Place</label>
          <input
            id="supportPlace"
            value={place}
            onChange={(e) => setPlace(e.target.value)}
            placeholder="Enter place"
          />
        </div>
        <div className="form-field">
          <label htmlFor="supportState">State</label>
          <input
            id="supportState"
            value={state}
            onChange={(e) => setState(e.target.value)}
            placeholder="Enter state"
          />
        </div>
        <div className="form-field">
          <label htmlFor="supportEmailId">Email Id</label>
          <input
            id="supportEmailId"
            type="email"
            value={emailId}
            onChange={(e) => setEmailId(e.target.value)}
            placeholder="Enter email id"
          />
        </div>
        <div className="form-field">
          <label htmlFor="supportSolution">Solution</label>
          <textarea
            id="supportSolution"
            rows={2}
            value={solution}
            onChange={(e) => setSolution(e.target.value)}
            placeholder="Enter solution"
          />
        </div>
        <div className="form-field">
          <label htmlFor="supportPhoneNo">Phone No.</label>
          <input
            id="supportPhoneNo"
            value={phoneNo}
            onChange={(e) => setPhoneNo(e.target.value)}
            placeholder="Enter phone no."
          />
        </div>
        <div className="form-field">
          <label htmlFor="supportProblems">Problems</label>
          <textarea
            id="supportProblems"
            rows={2}
            value={problems}
            onChange={(e) => setProblems(e.target.value)}
            placeholder="Enter problems"
          />
        </div>
        <div className="form-field">
          <label htmlFor="supportStatus">Status</label>
          <select id="supportStatus" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Select</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="support-form-actions">
          {saveStatus === "error" && <span className="support-error">Could not save support entry.</span>}
          {editingId && (
            <button type="button" className="btn-secondary" onClick={handleCancelEdit}>
              Cancel
            </button>
          )}
          <button type="submit" className="btn-primary" disabled={saveStatus === "saving"}>
            {saveStatus === "saving" ? "Saving..." : "Save"}
          </button>
        </div>
      </form>

      <div className="support-import">
        <h2 className="support-import-title">Import Support Entries</h2>
        <label className="btn-secondary support-import-file-btn">
          <Upload size={14} />
          Choose file (.xlsx, .xls, .csv)
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleImportFile}
            className="support-import-file-input"
          />
        </label>
        <p className="support-import-hint">
          Columns used: {IMPORT_COLUMNS.map((c) => c.header).join(", ")}
        </p>
        {importStatus === "importing" && <span className="support-upload-status">Importing...</span>}
        {importStatus === "error" && <span className="support-error">{importMessage}</span>}
        {importStatus === "success" && <span className="support-import-success">{importMessage}</span>}
      </div>

      {supportEntries.length === 0 && <p className="support-empty">No support entries yet.</p>}

      {supportEntries.length > 0 && (
        <div className="support-table">
          <div className="support-row support-head">
            <span>Sr No.</span>
            <span>Installation Date</span>
            <span>Ticket Date</span>
            <span>Ticket Number</span>
            <span>Product</span>
            <span>Serial No.</span>
            <span>Warranty</span>
            <span>Customer</span>
            <span>Institute</span>
            <span>Place</span>
            <span>State</span>
            <span>Email Id</span>
            <span>Solution</span>
            <span>Phone No.</span>
            <span>Problems</span>
            <span>Status</span>
            <span>Time Taken</span>
            <span></span>
          </div>
          {supportEntries.map((supportEntry) => (
            <div
              key={supportEntry._id}
              className={`support-row ${editingId === supportEntry._id ? "editing" : ""}`}
            >
              <span>{supportEntry.serialNo || "-"}</span>
              <span>{normalizeDate(supportEntry.installationDate) || "-"}</span>
              <span>{normalizeDate(supportEntry.ticketDate) || "-"}</span>
              <span>{supportEntry.ticketNumber || "-"}</span>
              <span>{supportEntry.product || "-"}</span>
              <span>{supportEntry.serialNumber || "-"}</span>
              <span>{supportEntry.warranty || "-"}</span>
              <span>{supportEntry.customer || "-"}</span>
              <span>{supportEntry.institute || "-"}</span>
              <span>{supportEntry.place || "-"}</span>
              <span>{supportEntry.state || "-"}</span>
              <span>{supportEntry.emailId || "-"}</span>
              <span>{supportEntry.solution || "-"}</span>
              <span>{supportEntry.phoneNo || "-"}</span>
              <span>{supportEntry.problems || "-"}</span>
              <span>
                <select
                  className="support-status-select"
                  value={supportEntry.status || ""}
                  disabled={editingId === supportEntry._id || updatingStatusId === supportEntry._id}
                  style={{
                    background: (STATUS_STYLES[supportEntry.status] || { bg: "#f1f5f9" }).bg,
                    color: (STATUS_STYLES[supportEntry.status] || { text: "#475569" }).text,
                  }}
                  onChange={(e) => handleStatusChange(supportEntry, e.target.value)}
                >
                  <option value="">-</option>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </span>
              <span>{getTimeTaken(supportEntry)}</span>
              <span className="support-row-actions">
                <button
                  type="button"
                  className="support-delete-btn"
                  onClick={() => handleDelete(supportEntry)}
                  aria-label="Delete support entry"
                >
                  <Trash2 size={14} />
                </button>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SupportDetails;
