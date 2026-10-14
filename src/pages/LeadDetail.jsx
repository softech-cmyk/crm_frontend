import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, FileText, Package, Trash2 } from "lucide-react";
import { API_BASE, apiFetch } from "../api.js";
import "./LeadDetail.css";

const ACTION_LINKS = {
  "Budgetary Quotation": (leadId) => `/sales/quotations/new?leadId=${leadId}`,
  "Product Information": (leadId) => `/sales/leads/${leadId}/product-info`,
};

const ACTION_ICONS = {
  "Budgetary Quotation": FileText,
  "Product Information": Package,
};

function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [loadStatus, setLoadStatus] = useState("loading");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoadStatus("loading");
    apiFetch(`${API_BASE}/api/leads/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load lead");
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        setLead(data.lead);
        setLoadStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setLoadStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loadStatus === "loading") {
    return <div className="lead-detail-page">Loading...</div>;
  }

  if (loadStatus === "error" || !lead) {
    return (
      <div className="lead-detail-page">
        <p>Could not load this lead.</p>
      </div>
    );
  }

  const handleDelete = async () => {
    if (!window.confirm(`Delete ${lead.name || "this lead"}? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const res = await apiFetch(`${API_BASE}/api/leads/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete lead");
      navigate("/sales/leads");
    } catch (err) {
      setDeleting(false);
    }
  };

  return (
    <div className="lead-detail-page">
      <button type="button" className="lead-detail-back" onClick={() => navigate("/sales/leads")}>
        <ArrowLeft size={16} />
        <span>Leads</span>
      </button>

      <div className="lead-detail-header">
        <h1 className="lead-detail-title">
          {lead.designation ? `${lead.designation} ` : ""}
          {lead.name}
        </h1>
        <button
          type="button"
          className="lead-detail-delete-btn"
          onClick={handleDelete}
          disabled={deleting}
        >
          <Trash2 size={14} />
          <span>{deleting ? "Deleting..." : "Delete"}</span>
        </button>
      </div>

      <div className="lead-detail-grid">
        <div className="lead-detail-field">
          <span className="lead-detail-label">Email</span>
          <span>{lead.email || "-"}</span>
        </div>
        <div className="lead-detail-field">
          <span className="lead-detail-label">Organisation</span>
          <span>{lead.organisation || "-"}</span>
        </div>
        <div className="lead-detail-field">
          <span className="lead-detail-label">Department</span>
          <span>{lead.department || "-"}</span>
        </div>
        <div className="lead-detail-field">
          <span className="lead-detail-label">Status</span>
          <span>{lead.status || "-"}</span>
        </div>
        <div className="lead-detail-field">
          <span className="lead-detail-label">Priority</span>
          <span>{lead.priority || "-"}</span>
        </div>
        <div className="lead-detail-field">
          <span className="lead-detail-label">Lead Maturity</span>
          <span>{lead.leadMaturity != null ? `${lead.leadMaturity}%` : "-"}</span>
        </div>
      </div>

      <h2 className="lead-detail-section-title">Next Steps</h2>
      <div className="lead-detail-actions">
        {(lead.actions || []).length === 0 && (
          <p className="lead-detail-empty">No actions selected for this lead yet.</p>
        )}
        {(lead.actions || []).map((action) => {
          const Icon = ACTION_ICONS[action.type] || FileText;
          const linkFor = ACTION_LINKS[action.type];
          return (
            <div key={action.type} className="lead-detail-action-card">
              <div className="lead-detail-action-info">
                <Icon size={18} />
                <div>
                  <div className="lead-detail-action-title">{action.type}</div>
                  <div className="lead-detail-action-meta">
                    {action.status || "Pending"}
                    {action.assignedTo ? ` · ${action.assignedTo}` : ""}
                  </div>
                </div>
              </div>
              {linkFor && (
                <Link className="btn-primary lead-detail-action-btn" to={linkFor(lead._id)}>
                  Open
                </Link>
              )}
            </div>
          );
        })}
      </div>

      {lead.remarks && (
        <>
          <h2 className="lead-detail-section-title">Remarks</h2>
          <p className="lead-detail-remarks">{lead.remarks}</p>
        </>
      )}
    </div>
  );
}

export default LeadDetail;
