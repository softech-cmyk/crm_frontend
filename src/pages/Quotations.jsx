import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { API_BASE, apiFetch } from "../api.js";
import "./Quotations.css";

function Quotations() {
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState([]);
  const [loadStatus, setLoadStatus] = useState("loading");
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    apiFetch(`${API_BASE}/api/quotations`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load quotations");
        return res.json();
      })
      .then((data) => {
        setQuotations(data.quotations || []);
        setLoadStatus("ready");
      })
      .catch(() => setLoadStatus("error"));
  }, []);

  const handleDelete = async (quotation) => {
    const label = quotation.lead ? quotation.lead.name : quotation.refNo || "this quotation";
    if (!window.confirm(`Delete quotation for ${label}? This cannot be undone.`)) return;
    setDeletingId(quotation._id);
    try {
      const res = await apiFetch(`${API_BASE}/api/quotations/${quotation._id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete quotation");
      setQuotations((prev) => prev.filter((q) => q._id !== quotation._id));
    } catch (err) {
      window.alert(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="quotations-page">
      <div className="quotations-header">
        <h1 className="quotations-title">Quotations</h1>
        <button type="button" className="btn-primary" onClick={() => navigate("/sales/quotations/new")}>
          New Quotation
        </button>
      </div>

      {loadStatus === "ready" && quotations.length === 0 && (
        <p className="quotations-empty">No quotations yet.</p>
      )}

      {loadStatus === "error" && (
        <p className="quotations-empty">Could not load quotations. Is the backend running?</p>
      )}

      {quotations.length > 0 && (
        <div className="quotations-table">
          <div className="quotations-table-row quotations-table-head">
            <span>Sr. No.</span>
            <span>Lead</span>
            <span>Total</span>
            <span>Status</span>
            <span>Valid Until</span>
            <span></span>
            <span></span>
          </div>
          {quotations.map((quotation, index) => (
            <div key={quotation._id} className="quotations-table-row">
              <span>{index + 1}</span>
              <span>
                {quotation.lead ? (
                  <Link to={`/sales/leads/${quotation.lead._id}`}>{quotation.lead.name}</Link>
                ) : (
                  "-"
                )}
              </span>
              <span>{quotation.grandTotal != null ? quotation.grandTotal.toFixed(2) : "-"}</span>
              <span>{quotation.status || "-"}</span>
              <span>{quotation.validUntil || "-"}</span>
              <span>
                <Link to={`/sales/quotations/${quotation._id}/preview`}>View</Link>
              </span>
              <span>
                <button
                  type="button"
                  className="quotations-delete-btn"
                  onClick={() => handleDelete(quotation)}
                  disabled={deletingId === quotation._id}
                  title="Delete quotation"
                >
                  <Trash2 size={16} />
                </button>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Quotations;
