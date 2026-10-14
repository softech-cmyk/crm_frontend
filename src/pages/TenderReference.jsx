import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { API_BASE, apiFetch } from "../api.js";
import ImportButton from "../components/ImportButton.jsx";
import "./TenderReference.css";

const IMPORT_COLUMNS = [
  { header: "Serial No.", field: "serialNo" },
  { header: "Tender Number", field: "tenderNumber" },
  { header: "Tender From", field: "tenderFrom" },
  { header: "Product Name", field: "productName" },
  { header: "EMD", field: "emd" },
  { header: "EMD Received Back", field: "emdReceivedBack" },
  { header: "Warranty", field: "warranty" },
  { header: "PBG", field: "pbg" },
  { header: "PBG Received Back", field: "pbgReceivedBack" },
  { header: "Instrument Details", field: "instrumentDetails" },
  { header: "Internal Tender ID", field: "internalTenderId" },
  { header: "RA Enabled", field: "raEnabled" },
  { header: "Award", field: "award" },
  { header: "Supply Order No.", field: "supplyOrderNo" },
  { header: "Order Date", field: "orderDate", date: true },
  { header: "To Be Supplied By", field: "toBeSuppliedBy", date: true },
  { header: "Installation Done", field: "installationDone" },
  { header: "Installation Date", field: "installationDate", date: true },
  { header: "Tentative Bid Value", field: "tentativeBidValue" },
  { header: "Remarks", field: "remarks" },
  { header: "Date", field: "date", date: true },
  { header: "Due On", field: "dueOn", date: true },
  { header: "Due Time", field: "dueTime" },
];

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

function formatDueTime(hour, minute, period) {
  return hour && minute ? `${hour}:${minute} ${period}` : "";
}

function TenderReference() {
  const [tenderReferences, setTenderReferences] = useState([]);
  const [serialNo, setSerialNo] = useState("");
  const [tenderNumber, setTenderNumber] = useState("");
  const [tenderFrom, setTenderFrom] = useState("");
  const [productName, setProductName] = useState("");
  const [emd, setEmd] = useState("");
  const [emdReceivedBack, setEmdReceivedBack] = useState("");
  const [warranty, setWarranty] = useState("");
  const [pbg, setPbg] = useState("");
  const [pbgReceivedBack, setPbgReceivedBack] = useState("");
  const [instrumentDetails, setInstrumentDetails] = useState("");
  const [internalTenderId, setInternalTenderId] = useState("");
  const [raEnabled, setRaEnabled] = useState("");
  const [award, setAward] = useState("");
  const [supplyOrderNo, setSupplyOrderNo] = useState("");
  const [orderDate, setOrderDate] = useState("");
  const [toBeSuppliedBy, setToBeSuppliedBy] = useState("");
  const [installationDone, setInstallationDone] = useState("");
  const [installationDate, setInstallationDate] = useState("");
  const [tentativeBidValue, setTentativeBidValue] = useState("");
  const [remarks, setRemarks] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dueOn, setDueOn] = useState("");
  const [dueHour, setDueHour] = useState("");
  const [dueMinute, setDueMinute] = useState("");
  const [duePeriod, setDuePeriod] = useState("AM");
  const [editingId, setEditingId] = useState(null);
  const [saveStatus, setSaveStatus] = useState("idle");

  const loadTenderReferences = () => {
    apiFetch(`${API_BASE}/api/tender-references`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load tender references");
        return res.json();
      })
      .then((data) => setTenderReferences(data.tenderReferences || []))
      .catch(() => {});
  };

  useEffect(loadTenderReferences, []);

  const handleCancelEdit = () => {
    setEditingId(null);
    setSerialNo("");
    setTenderNumber("");
    setTenderFrom("");
    setProductName("");
    setEmd("");
    setEmdReceivedBack("");
    setWarranty("");
    setPbg("");
    setPbgReceivedBack("");
    setInstrumentDetails("");
    setInternalTenderId("");
    setRaEnabled("");
    setAward("");
    setSupplyOrderNo("");
    setOrderDate("");
    setToBeSuppliedBy("");
    setInstallationDone("");
    setInstallationDate("");
    setTentativeBidValue("");
    setRemarks("");
    setDate(new Date().toISOString().slice(0, 10));
    setDueOn("");
    setDueHour("");
    setDueMinute("");
    setDuePeriod("AM");
    setSaveStatus("idle");
  };

  const handleDelete = async (tenderReference) => {
    if (!window.confirm("Delete this tender reference?")) return;
    try {
      const res = await apiFetch(`${API_BASE}/api/tender-references/${tenderReference._id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete tender reference");
      if (editingId === tenderReference._id) handleCancelEdit();
      loadTenderReferences();
    } catch (err) {
      // ignore
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveStatus("saving");
    try {
      const url = editingId
        ? `${API_BASE}/api/tender-references/${editingId}`
        : `${API_BASE}/api/tender-references`;
      const res = await apiFetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serialNo,
          tenderNumber,
          tenderFrom,
          productName,
          emd,
          emdReceivedBack,
          warranty,
          pbg,
          pbgReceivedBack,
          instrumentDetails,
          internalTenderId,
          raEnabled,
          award,
          supplyOrderNo,
          orderDate,
          toBeSuppliedBy,
          installationDone,
          installationDate,
          tentativeBidValue,
          remarks,
          date,
          dueOn,
          dueTime: formatDueTime(dueHour, dueMinute, duePeriod),
        }),
      });
      if (!res.ok) throw new Error("Failed to save tender reference");
      setEditingId(null);
      setSerialNo("");
      setTenderNumber("");
      setTenderFrom("");
      setProductName("");
      setEmd("");
      setEmdReceivedBack("");
      setWarranty("");
      setPbg("");
      setPbgReceivedBack("");
      setInstrumentDetails("");
      setInternalTenderId("");
      setRaEnabled("");
      setAward("");
      setSupplyOrderNo("");
      setOrderDate("");
      setToBeSuppliedBy("");
      setInstallationDone("");
      setInstallationDate("");
      setTentativeBidValue("");
      setRemarks("");
      setDate(new Date().toISOString().slice(0, 10));
      setDueOn("");
      setDueHour("");
      setDueMinute("");
      setDuePeriod("AM");
      setSaveStatus("idle");
      loadTenderReferences();
    } catch (err) {
      setSaveStatus("error");
    }
  };

  return (
    <div className="tender-reference-page">
      <div className="page-title-row">
        <h1 className="tender-reference-title">Tender Reference</h1>
        <ImportButton
          columns={IMPORT_COLUMNS}
          endpoint="/api/tender-references/import"
          onImported={loadTenderReferences}
        />
      </div>

      <form className="tender-reference-form" onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="tenderSerialNo">Serial No.</label>
          <input
            id="tenderSerialNo"
            value={serialNo}
            onChange={(e) => setSerialNo(e.target.value)}
            placeholder="Enter serial no."
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="tenderNumber">Tender Number</label>
          <input
            id="tenderNumber"
            value={tenderNumber}
            onChange={(e) => setTenderNumber(e.target.value)}
            placeholder="Enter tender number"
          />
        </div>
        <div className="form-field">
          <label htmlFor="tenderFrom">Tender From</label>
          <input
            id="tenderFrom"
            value={tenderFrom}
            onChange={(e) => setTenderFrom(e.target.value)}
            placeholder="Enter tender from"
          />
        </div>
        <div className="form-field">
          <label htmlFor="productName">Product Name</label>
          <input
            id="productName"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="Enter product name"
          />
        </div>
        <div className="form-field">
          <label htmlFor="tenderEmd">EMD</label>
          <input id="tenderEmd" value={emd} onChange={(e) => setEmd(e.target.value)} placeholder="Enter EMD" />
        </div>
        <div className="form-field">
          <label htmlFor="emdReceivedBack">EMD Received Back</label>
          <select
            id="emdReceivedBack"
            value={emdReceivedBack}
            onChange={(e) => setEmdReceivedBack(e.target.value)}
          >
            <option value="">Select</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="tenderWarranty">Warranty</label>
          <input
            id="tenderWarranty"
            value={warranty}
            onChange={(e) => setWarranty(e.target.value)}
            placeholder="Enter warranty"
          />
        </div>
        <div className="form-field">
          <label htmlFor="tenderPbg">PBG</label>
          <input id="tenderPbg" value={pbg} onChange={(e) => setPbg(e.target.value)} placeholder="Enter PBG" />
        </div>
        <div className="form-field">
          <label htmlFor="pbgReceivedBack">PBG Received Back</label>
          <select
            id="pbgReceivedBack"
            value={pbgReceivedBack}
            onChange={(e) => setPbgReceivedBack(e.target.value)}
          >
            <option value="">Select</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="tenderInstrumentDetails">Instrument Details</label>
          <input
            id="tenderInstrumentDetails"
            value={instrumentDetails}
            onChange={(e) => setInstrumentDetails(e.target.value)}
            placeholder="Enter instrument details"
          />
        </div>
        <div className="form-field">
          <label htmlFor="internalTenderId">Internal Tender ID</label>
          <input
            id="internalTenderId"
            value={internalTenderId}
            onChange={(e) => setInternalTenderId(e.target.value)}
            placeholder="Enter internal tender ID"
          />
        </div>
        <div className="form-field">
          <label htmlFor="raEnabled">RA Enabled</label>
          <select id="raEnabled" value={raEnabled} onChange={(e) => setRaEnabled(e.target.value)}>
            <option value="">Select</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="award">Award</label>
          <select id="award" value={award} onChange={(e) => setAward(e.target.value)}>
            <option value="">Select</option>
            <option value="Pending">Pending</option>
            <option value="Won">Won</option>
            <option value="Lost">Lost</option>
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="supplyOrderNo">Supply Order No.</label>
          <input
            id="supplyOrderNo"
            value={supplyOrderNo}
            onChange={(e) => setSupplyOrderNo(e.target.value)}
            placeholder="Enter supply order no."
          />
        </div>
        <div className="form-field">
          <label htmlFor="orderDate">Order Date</label>
          <input id="orderDate" type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} />
        </div>
        <div className="form-field">
          <label htmlFor="toBeSuppliedBy">To Be Supplied By</label>
          <input
            id="toBeSuppliedBy"
            type="date"
            value={toBeSuppliedBy}
            onChange={(e) => setToBeSuppliedBy(e.target.value)}
          />
        </div>
        <div className="form-field">
          <label htmlFor="installationDone">Installation Done</label>
          <select
            id="installationDone"
            value={installationDone}
            onChange={(e) => setInstallationDone(e.target.value)}
          >
            <option value="">Select</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="installationDate">Installation Date</label>
          <input
            id="installationDate"
            type="date"
            value={installationDate}
            onChange={(e) => setInstallationDate(e.target.value)}
          />
        </div>
        <div className="form-field">
          <label htmlFor="tentativeBidValue">Tentative Bid Value</label>
          <input
            id="tentativeBidValue"
            value={tentativeBidValue}
            onChange={(e) => setTentativeBidValue(e.target.value)}
            placeholder="Enter tentative bid value"
          />
        </div>
        <div className="form-field">
          <label htmlFor="tenderRemarks">Remarks</label>
          <textarea
            id="tenderRemarks"
            rows={2}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Enter remarks"
          />
        </div>
        <div className="form-field">
          <label htmlFor="tenderDate">Date</label>
          <input id="tenderDate" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="form-field">
          <label htmlFor="tenderDueOn">Due On</label>
          <input id="tenderDueOn" type="date" value={dueOn} onChange={(e) => setDueOn(e.target.value)} />
        </div>
        <div className="form-field">
          <label htmlFor="tenderDueTimeHour">Due Time</label>
          <div className="tender-time-input">
            <select
              id="tenderDueTimeHour"
              value={dueHour}
              onChange={(e) => setDueHour(e.target.value)}
              aria-label="Hour"
            >
              <option value="">--</option>
              {HOURS.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
            <span>:</span>
            <select
              value={dueMinute}
              onChange={(e) => setDueMinute(e.target.value)}
              aria-label="Minute"
            >
              <option value="">--</option>
              {MINUTES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <select
              value={duePeriod}
              onChange={(e) => setDuePeriod(e.target.value)}
              aria-label="AM or PM"
            >
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>
          </div>
        </div>
        <div className="tender-reference-form-actions">
          {saveStatus === "error" && (
            <span className="tender-reference-error">Could not save tender reference.</span>
          )}
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

      {tenderReferences.length === 0 && (
        <p className="tender-reference-empty">No tender references yet.</p>
      )}

      {tenderReferences.length > 0 && (
        <div className="tender-reference-table">
          <div className="tender-reference-row tender-reference-head">
            <span>Serial No.</span>
            <span>Tender Number</span>
            <span>Tender From</span>
            <span>Product Name</span>
            <span>EMD</span>
            <span>EMD Received Back</span>
            <span>Warranty</span>
            <span>PBG</span>
            <span>PBG Received Back</span>
            <span>Instrument Details</span>
            <span>Internal Tender ID</span>
            <span>RA Enabled</span>
            <span>Award</span>
            <span>Supply Order No.</span>
            <span>Order Date</span>
            <span>To Be Supplied By</span>
            <span>Installation Done</span>
            <span>Installation Date</span>
            <span>Tentative Bid Value</span>
            <span>Remarks</span>
            <span>Date</span>
            <span>Due On</span>
            <span>Due Time</span>
            <span></span>
          </div>
          {tenderReferences.map((tenderReference) => (
            <div
              key={tenderReference._id}
              className={`tender-reference-row ${editingId === tenderReference._id ? "editing" : ""}`}
            >
              <span>{tenderReference.serialNo || "-"}</span>
              <span>{tenderReference.tenderNumber || "-"}</span>
              <span>{tenderReference.tenderFrom || "-"}</span>
              <span>{tenderReference.productName || "-"}</span>
              <span>{tenderReference.emd || "-"}</span>
              <span>{tenderReference.emdReceivedBack || "-"}</span>
              <span>{tenderReference.warranty || "-"}</span>
              <span>{tenderReference.pbg || "-"}</span>
              <span>{tenderReference.pbgReceivedBack || "-"}</span>
              <span>{tenderReference.instrumentDetails || "-"}</span>
              <span>{tenderReference.internalTenderId || "-"}</span>
              <span>{tenderReference.raEnabled || "-"}</span>
              <span>{tenderReference.award || "-"}</span>
              <span>{tenderReference.supplyOrderNo || "-"}</span>
              <span>{tenderReference.orderDate || "-"}</span>
              <span>{tenderReference.toBeSuppliedBy || "-"}</span>
              <span>{tenderReference.installationDone || "-"}</span>
              <span>{tenderReference.installationDate || "-"}</span>
              <span>{tenderReference.tentativeBidValue || "-"}</span>
              <span>{tenderReference.remarks || "-"}</span>
              <span>{tenderReference.date || "-"}</span>
              <span>{tenderReference.dueOn || "-"}</span>
              <span>{tenderReference.dueTime || "-"}</span>
              <span className="tender-reference-row-actions">
                <button
                  type="button"
                  className="tender-reference-delete-btn"
                  onClick={() => handleDelete(tenderReference)}
                  aria-label="Delete tender reference"
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

export default TenderReference;
