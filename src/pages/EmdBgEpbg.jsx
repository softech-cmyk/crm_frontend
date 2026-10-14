import { useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { API_BASE, apiFetch } from "../api.js";
import "./EmdBgEpbg.css";

function EmdBgEpbg() {
  const [records, setRecords] = useState([]);
  const [nameOfInstitute, setNameOfInstitute] = useState("");
  const [contactDetails, setContactDetails] = useState("");
  const [tenderPoNo, setTenderPoNo] = useState("");
  const [item, setItem] = useState("");
  const [bank, setBank] = useState("");
  const [emdBg, setEmdBg] = useState("");
  const [guaranteeNoDd, setGuaranteeNoDd] = useState("");
  const [dateOfIssue, setDateOfIssue] = useState("");
  const [amount, setAmount] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [remarks, setRemarks] = useState("");
  const [status, setStatus] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [saveStatus, setSaveStatus] = useState("idle");

  const loadRecords = () => {
    apiFetch(`${API_BASE}/api/emd-bg-epbg`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load records");
        return res.json();
      })
      .then((data) => setRecords(data.emdBgEpbgs || []))
      .catch(() => {});
  };

  useEffect(loadRecords, []);

  const handleCancelEdit = () => {
    setEditingId(null);
    setNameOfInstitute("");
    setContactDetails("");
    setTenderPoNo("");
    setItem("");
    setBank("");
    setEmdBg("");
    setGuaranteeNoDd("");
    setDateOfIssue("");
    setAmount("");
    setExpiryDate("");
    setRemarks("");
    setStatus("");
    setSaveStatus("idle");
  };

  const handleEdit = (record) => {
    setEditingId(record._id);
    setNameOfInstitute(record.nameOfInstitute || "");
    setContactDetails(record.contactDetails || "");
    setTenderPoNo(record.tenderPoNo || "");
    setItem(record.item || "");
    setBank(record.bank || "");
    setEmdBg(record.emdBg || "");
    setGuaranteeNoDd(record.guaranteeNoDd || "");
    setDateOfIssue(record.dateOfIssue || "");
    setAmount(record.amount || "");
    setExpiryDate(record.expiryDate || "");
    setRemarks(record.remarks || "");
    setStatus(record.status || "");
  };

  const handleDelete = async (record) => {
    if (!window.confirm("Delete this record?")) return;
    try {
      const res = await apiFetch(`${API_BASE}/api/emd-bg-epbg/${record._id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete record");
      if (editingId === record._id) handleCancelEdit();
      loadRecords();
    } catch (err) {
      // ignore
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveStatus("saving");
    try {
      const url = editingId ? `${API_BASE}/api/emd-bg-epbg/${editingId}` : `${API_BASE}/api/emd-bg-epbg`;
      const res = await apiFetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nameOfInstitute,
          contactDetails,
          tenderPoNo,
          item,
          bank,
          emdBg,
          guaranteeNoDd,
          dateOfIssue,
          amount,
          expiryDate,
          remarks,
          status,
        }),
      });
      if (!res.ok) throw new Error("Failed to save record");
      setEditingId(null);
      setNameOfInstitute("");
      setContactDetails("");
      setTenderPoNo("");
      setItem("");
      setBank("");
      setEmdBg("");
      setGuaranteeNoDd("");
      setDateOfIssue("");
      setAmount("");
      setExpiryDate("");
      setRemarks("");
      setStatus("");
      setSaveStatus("idle");
      loadRecords();
    } catch (err) {
      setSaveStatus("error");
    }
  };

  return (
    <div className="emd-bg-epbg-page">
      <h1 className="emd-bg-epbg-title">EMD_BG_EPBG</h1>

      <form className="emd-bg-epbg-form" onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="nameOfInstitute">Name of Institute</label>
          <input
            id="nameOfInstitute"
            value={nameOfInstitute}
            onChange={(e) => setNameOfInstitute(e.target.value)}
            placeholder="Enter name of institute"
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="contactDetails">Contact Details</label>
          <input
            id="contactDetails"
            value={contactDetails}
            onChange={(e) => setContactDetails(e.target.value)}
            placeholder="Enter contact details"
          />
        </div>
        <div className="form-field">
          <label htmlFor="tenderPoNo">Tender / PO No.</label>
          <input
            id="tenderPoNo"
            value={tenderPoNo}
            onChange={(e) => setTenderPoNo(e.target.value)}
            placeholder="Enter tender / PO no."
          />
        </div>
        <div className="form-field">
          <label htmlFor="item">Item</label>
          <input id="item" value={item} onChange={(e) => setItem(e.target.value)} placeholder="Enter item" />
        </div>
        <div className="form-field">
          <label htmlFor="bank">Bank</label>
          <input id="bank" value={bank} onChange={(e) => setBank(e.target.value)} placeholder="Enter bank" />
        </div>
        <div className="form-field">
          <label htmlFor="emdBg">EMD / BG</label>
          <input id="emdBg" value={emdBg} onChange={(e) => setEmdBg(e.target.value)} placeholder="Enter EMD / BG" />
        </div>
        <div className="form-field">
          <label htmlFor="guaranteeNoDd">Guarantee No./DD</label>
          <input
            id="guaranteeNoDd"
            value={guaranteeNoDd}
            onChange={(e) => setGuaranteeNoDd(e.target.value)}
            placeholder="Enter guarantee no./DD"
          />
        </div>
        <div className="form-field">
          <label htmlFor="dateOfIssue">Date of Issue</label>
          <input
            id="dateOfIssue"
            type="date"
            value={dateOfIssue}
            onChange={(e) => setDateOfIssue(e.target.value)}
          />
        </div>
        <div className="form-field">
          <label htmlFor="amount">Amount</label>
          <input id="amount" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Enter amount" />
        </div>
        <div className="form-field">
          <label htmlFor="expiryDate">Expiry Date</label>
          <input
            id="expiryDate"
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
          />
        </div>
        <div className="form-field">
          <label htmlFor="remarks">Remarks</label>
          <textarea
            id="remarks"
            rows={2}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Enter remarks"
          />
        </div>
        <div className="form-field">
          <label htmlFor="status">Status</label>
          <select id="status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Select</option>
            <option value="Active">Active</option>
            <option value="Released">Released</option>
            <option value="Extended">Extended</option>
            <option value="Expired">Expired</option>
          </select>
        </div>
        <div className="emd-bg-epbg-form-actions">
          {saveStatus === "error" && <span className="emd-bg-epbg-error">Could not save record.</span>}
          {editingId && (
            <button type="button" className="btn-secondary" onClick={handleCancelEdit}>
              Cancel
            </button>
          )}
          <button type="submit" className="btn-primary" disabled={saveStatus === "saving"}>
            {saveStatus === "saving" ? "Saving..." : editingId ? "Update" : "Add"}
          </button>
        </div>
      </form>

      {records.length === 0 && <p className="emd-bg-epbg-empty">No records yet.</p>}

      {records.length > 0 && (
        <div className="emd-bg-epbg-table">
          <div className="emd-bg-epbg-row emd-bg-epbg-head">
            <span>Name of Institute</span>
            <span>Contact Details</span>
            <span>Tender / PO No.</span>
            <span>Item</span>
            <span>Bank</span>
            <span>EMD / BG</span>
            <span>Guarantee No./DD</span>
            <span>Date of Issue</span>
            <span>Amount</span>
            <span>Expiry Date</span>
            <span>Remarks</span>
            <span>Status</span>
            <span></span>
          </div>
          {records.map((record) => (
            <div
              key={record._id}
              className={`emd-bg-epbg-row ${editingId === record._id ? "editing" : ""}`}
            >
              <span>{record.nameOfInstitute || "-"}</span>
              <span>{record.contactDetails || "-"}</span>
              <span>{record.tenderPoNo || "-"}</span>
              <span>{record.item || "-"}</span>
              <span>{record.bank || "-"}</span>
              <span>{record.emdBg || "-"}</span>
              <span>{record.guaranteeNoDd || "-"}</span>
              <span>{record.dateOfIssue || "-"}</span>
              <span>{record.amount || "-"}</span>
              <span>{record.expiryDate || "-"}</span>
              <span>{record.remarks || "-"}</span>
              <span>{record.status || "-"}</span>
              <span className="emd-bg-epbg-row-actions">
                <button
                  type="button"
                  className="emd-bg-epbg-edit-btn"
                  onClick={() => handleEdit(record)}
                  aria-label="Edit record"
                >
                  <Pencil size={14} />
                </button>
                <button
                  type="button"
                  className="emd-bg-epbg-delete-btn"
                  onClick={() => handleDelete(record)}
                  aria-label="Delete record"
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

export default EmdBgEpbg;
