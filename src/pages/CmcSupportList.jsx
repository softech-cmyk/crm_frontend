import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import { API_BASE, apiFetch } from "../api.js";
import ImportButton from "../components/ImportButton.jsx";
import "./CmcSupportList.css";

// One row per machine; rows sharing a Reference Number become one CMC entry
// (the first row supplies the general fields, every row adds a schedule line).
const IMPORT_COLUMNS = [
  { header: "Reference Number", field: "referenceNumber" },
  { header: "Date", field: "date", date: true },
  { header: "Subject", field: "subject" },
  { header: "Deadline", field: "deadline", date: true },
  { header: "EMD Amount", field: "emdAmount" },
  { header: "EMD Mode", field: "emdMode" },
  { header: "EMD In Favour Of", field: "emdInFavourOf" },
  { header: "Security Deposit", field: "securityDeposit" },
  { header: "EMD Forfeiture", field: "emdForfeiture" },
  { header: "Rejection Clause", field: "rejectionClause" },
  { header: "Signatory", field: "signatory" },
  { header: "Handover Condition", field: "handoverCondition" },
  { header: "Servicing Frequency", field: "servicingFrequency" },
  { header: "BDS Frequency", field: "bdsFrequency" },
  { header: "Coverage", field: "coverage" },
  { header: "Breakdown Response", field: "breakdownResponse" },
  { header: "Breakdown Penalty", field: "breakdownPenalty" },
  { header: "Service Unit Penalty", field: "serviceUnitPenalty" },
  { header: "Technicians", field: "technicians" },
  { header: "Helpers", field: "helpers" },
  { header: "Payment", field: "payment" },
  { header: "Renewal", field: "renewal" },
  { header: "Termination", field: "termination" },
  { header: "Attention Note", field: "attentionNote" },
  { header: "Contractor Name", field: "contractorName" },
  { header: "Executive Engineer Name", field: "executiveEngineerName" },
  { header: "Machine Name", field: "machineName" },
  { header: "Quantity", field: "quantity" },
  { header: "Unit", field: "unit" },
  { header: "Rate", field: "rate" },
];

function getScheduleTotal(scheduleRows) {
  return (scheduleRows || []).reduce((sum, row) => {
    const quantity = Number(row.quantity) || 0;
    const rate = Number(row.rate) || 0;
    return sum + quantity * rate;
  }, 0);
}

function formatAmount(value) {
  return value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function CmcSupportList() {
  const navigate = useNavigate();
  const [entries, setEntries] = useState([]);
  const [loadStatus, setLoadStatus] = useState("loading");
  const [deletingId, setDeletingId] = useState(null);

  const loadEntries = () => {
    setLoadStatus("loading");
    apiFetch(`${API_BASE}/api/cmc-support`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load CMC Support entries");
        return res.json();
      })
      .then((data) => {
        setEntries(data.cmcSupportEntries || []);
        setLoadStatus("ready");
      })
      .catch(() => setLoadStatus("error"));
  };

  useEffect(loadEntries, []);

  const handleDelete = async (e, entry) => {
    e.stopPropagation();
    if (!window.confirm(`Delete CMC entry ${entry.referenceNumber || "this entry"}? This cannot be undone.`)) return;
    setDeletingId(entry._id);
    try {
      const res = await apiFetch(`${API_BASE}/api/cmc-support/${entry._id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete CMC Support entry");
      setEntries((prev) => prev.filter((item) => item._id !== entry._id));
    } catch (err) {
      // ignore
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="cmc-support-list-page">
      <div className="cmc-support-list-header">
        <h1 className="cmc-support-list-title">CMC Support</h1>
        <div className="cmc-support-list-actions">
          <ImportButton columns={IMPORT_COLUMNS} endpoint="/api/cmc-support/import" onImported={loadEntries} />
          <button type="button" className="btn-primary" onClick={() => navigate("/support/cmc/new")}>
            <Plus size={14} />
            New CMC
          </button>
        </div>
      </div>

      <div className="cmc-support-list-table">
        <div className="cmc-support-list-row cmc-support-list-head">
          <span>Reference Number</span>
          <span>Date</span>
          <span>Subject</span>
          <span>Contractor</span>
          <span>Total Amount</span>
          <span></span>
        </div>
        {loadStatus === "loading" && <div className="cmc-support-list-empty">Loading...</div>}
        {loadStatus === "error" && (
          <div className="cmc-support-list-empty">Could not load CMC Support entries.</div>
        )}
        {loadStatus === "ready" && entries.length === 0 && (
          <div className="cmc-support-list-empty">No CMC Support entries yet.</div>
        )}
        {entries.map((entry) => (
          <div
            key={entry._id}
            className="cmc-support-list-row cmc-support-list-row-interactive"
            onClick={() => navigate(`/support/cmc/${entry._id}`)}
          >
            <span>{entry.referenceNumber || "-"}</span>
            <span>{entry.date || "-"}</span>
            <span className="cmc-support-list-subject">{entry.subject || "-"}</span>
            <span>{entry.contractorName || "-"}</span>
            <span>₹ {formatAmount(getScheduleTotal(entry.scheduleRows))}</span>
            <span className="cmc-support-list-row-actions">
              <button
                type="button"
                className="cmc-support-list-delete-btn"
                onClick={(e) => handleDelete(e, entry)}
                disabled={deletingId === entry._id}
                aria-label="Delete CMC entry"
              >
                <Trash2 size={14} />
              </button>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CmcSupportList;
