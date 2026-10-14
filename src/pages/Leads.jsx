import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Search, Trash2 } from "lucide-react";
import { API_BASE, apiFetch } from "../api.js";
import { LEAD_SOURCES as CHANNELS } from "../leadSources.js";
import "./Leads.css";

const STATUSES = ["New", "Contacted", "Qualified", "Converted", "Lost"];

const STATUS_STYLES = {
  New: { bg: "#dbeafe", text: "#1d4ed8" },
  Contacted: { bg: "#fef3c7", text: "#b45309" },
  Qualified: { bg: "#ede9fe", text: "#6d28d9" },
  Converted: { bg: "#dcfce7", text: "#15803d" },
  Lost: { bg: "#fee2e2", text: "#b91c1c" },
};

const PRIORITY_STYLES = {
  A: { bg: "#fee2e2", text: "#b91c1c" },
  B: { bg: "#ffedd5", text: "#c2410c" },
  C: { bg: "#dbeafe", text: "#1d4ed8" },
  D: { bg: "#f1f5f9", text: "#475569" },
};

function PriorityBadge({ priority }) {
  if (!priority) return <span className="leads-badge leads-badge-empty">-</span>;
  const style = PRIORITY_STYLES[priority] || { bg: "#f1f5f9", text: "#475569" };
  return (
    <span className="leads-badge leads-badge-priority" style={{ background: style.bg, color: style.text }}>
      {priority}
    </span>
  );
}

function Leads() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [loadStatus, setLoadStatus] = useState("loading");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [deletingId, setDeletingId] = useState(null);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);

  const loadLeads = () => {
    setLoadStatus("loading");
    apiFetch(`${API_BASE}/api/leads`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load leads");
        return res.json();
      })
      .then((data) => {
        setLeads(data.leads || []);
        setLoadStatus("ready");
      })
      .catch(() => setLoadStatus("error"));
  };

  useEffect(() => {
    loadLeads();
  }, []);

  const filteredLeads = useMemo(() => {
    const query = search.trim().toLowerCase();
    return leads.filter((lead) => {
      if (statusFilter !== "All" && lead.status !== statusFilter) return false;
      if (!query) return true;
      return [lead.name, lead.organisation, lead.email]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(query));
    });
  }, [leads, search, statusFilter]);

  const handleStatusChange = async (e, lead, newStatus) => {
    e.stopPropagation();
    if (newStatus === (lead.status || "")) return;
    setUpdatingStatusId(lead._id);
    try {
      const res = await apiFetch(`${API_BASE}/api/leads/${lead._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      setLeads((prev) => prev.map((l) => (l._id === lead._id ? { ...l, status: newStatus } : l)));
    } catch (err) {
      // ignore
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleDelete = async (e, lead) => {
    e.stopPropagation();
    if (!window.confirm(`Delete ${lead.name || "this lead"}? This cannot be undone.`)) return;
    setDeletingId(lead._id);
    try {
      const res = await apiFetch(`${API_BASE}/api/leads/${lead._id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete lead");
      setLeads((prev) => prev.filter((l) => l._id !== lead._id));
    } catch (err) {
      // ignore
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="leads-page">
      <h1 className="leads-empty-title">Enter the leads /Import it !</h1>
      <p className="leads-empty-subtitle">
        Add leads one at a time, or import them in bulk from a file.
      </p>

      <div className="leads-empty-body">
        <ul className="leads-channel-list">
          {CHANNELS.map((channel) => (
            <li key={channel}>
              <button
                type="button"
                className="leads-channel-btn"
                onClick={() => navigate(`/sales/leads/create?source=${encodeURIComponent(channel)}`)}
              >
                <ChevronRight size={16} />
                <span>{channel}</span>
              </button>
            </li>
          ))}
        </ul>

        <div className="leads-empty-divider">
          <span className="leads-empty-or">or</span>
        </div>

        <div className="leads-empty-actions">
          <button type="button" className="btn-primary" onClick={() => navigate("/sales/leads/create")}>
            Create
          </button>
          <button type="button" className="btn-primary">
            Import
          </button>
        </div>
      </div>

      <div className="leads-toolbar">
        <div className="leads-search">
          <Search size={15} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, organisation or email"
          />
        </div>
        <select
          className="leads-status-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">All statuses</option>
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <span className="leads-count">
          {filteredLeads.length} of {leads.length}
        </span>
      </div>

      <div className="leads-table leads-table-scroll">
        <div className="leads-table-row leads-table-head">
          <span>Name</span>
          <span>Organisation</span>
          <span>Status</span>
          <span>Priority</span>
          <span>Next Follow-up</span>
          <span />
        </div>
        {loadStatus === "loading" && <div className="leads-table-empty">Loading...</div>}
        {loadStatus === "error" && <div className="leads-table-empty">Could not load leads.</div>}
        {loadStatus === "ready" && filteredLeads.length === 0 && (
          <div className="leads-table-empty">
            {leads.length === 0 ? "No leads yet." : "No leads match your search."}
          </div>
        )}
        {filteredLeads.map((lead) => (
          <div
            key={lead._id}
            className="leads-table-row leads-table-row-interactive"
            onClick={() => navigate(`/sales/leads/${lead._id}`)}
          >
            <span className="leads-table-name">{lead.name || "-"}</span>
            <span>{lead.organisation || "-"}</span>
            <span onClick={(e) => e.stopPropagation()}>
              <select
                className="leads-status-select"
                value={lead.status || ""}
                disabled={updatingStatusId === lead._id}
                style={{
                  background: (STATUS_STYLES[lead.status] || { bg: "#f1f5f9" }).bg,
                  color: (STATUS_STYLES[lead.status] || { text: "#475569" }).text,
                }}
                onChange={(e) => handleStatusChange(e, lead, e.target.value)}
              >
                <option value="">-</option>
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </span>
            <span>
              <PriorityBadge priority={lead.priority} />
            </span>
            <span>{lead.nextFollowUpDate || "-"}</span>
            <span className="leads-row-actions">
              <button
                type="button"
                className="leads-delete-btn"
                onClick={(e) => handleDelete(e, lead)}
                disabled={deletingId === lead._id}
                aria-label={`Delete ${lead.name || "lead"}`}
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

export default Leads;
