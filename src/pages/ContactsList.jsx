import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Filter, Pencil, Trash2 } from "lucide-react";
import { API_BASE, apiFetch } from "../api.js";
import "./Contacts.css";

const NO_DEPARTMENT = "__none__";

function ContactsList() {
  const navigate = useNavigate();
  const [contacts, setContacts] = useState([]);
  const [expandedIds, setExpandedIds] = useState(() => new Set());
  const [departmentFilter, setDepartmentFilter] = useState("");

  const departments = useMemo(() => {
    const set = new Set();
    contacts.forEach((c) => {
      if (c.department && c.department.trim()) set.add(c.department.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [contacts]);

  const hasNoDepartment = useMemo(
    () => contacts.some((c) => !c.department || !c.department.trim()),
    [contacts]
  );

  const filteredContacts = useMemo(() => {
    if (!departmentFilter) return contacts;
    if (departmentFilter === NO_DEPARTMENT) {
      return contacts.filter((c) => !c.department || !c.department.trim());
    }
    return contacts.filter((c) => c.department && c.department.trim() === departmentFilter);
  }, [contacts, departmentFilter]);

  const loadContacts = () => {
    apiFetch(`${API_BASE}/api/contacts`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load contacts");
        return res.json();
      })
      .then((data) => setContacts(data.contacts || []))
      .catch(() => {});
  };

  useEffect(loadContacts, []);

  const toggleExpanded = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDelete = async (contact) => {
    if (!window.confirm("Delete this contact?")) return;
    try {
      const res = await apiFetch(`${API_BASE}/api/contacts/${contact._id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete contact");
      loadContacts();
    } catch (err) {
      // ignore
    }
  };

  return (
    <div className="contacts-page">
      <h1 className="contacts-title">Contacts List</h1>

      {contacts.length > 0 && (
        <div className="contacts-filter-bar">
          <Filter size={16} className="contacts-filter-icon" />
          <label htmlFor="contactsDepartmentFilter">Organization Department</label>
          <select
            id="contactsDepartmentFilter"
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
          >
            <option value="">All departments</option>
            {departments.map((dep) => (
              <option key={dep} value={dep}>
                {dep}
              </option>
            ))}
            {hasNoDepartment && <option value={NO_DEPARTMENT}>No department</option>}
          </select>
        </div>
      )}

      {contacts.length === 0 ? (
        <p className="contacts-import-hint">No contacts yet.</p>
      ) : filteredContacts.length === 0 ? (
        <p className="contacts-import-hint">No contacts match this filter.</p>
      ) : (
        <div className="contacts-table">
          <div className="contacts-row contacts-head">
            <span>First Name</span>
            <span>Last Name</span>
            <span>Company</span>
            <span>Organization Department</span>
            <span>Phone</span>
            <span></span>
          </div>
          {filteredContacts.map((contact) => {
            const isExpanded = expandedIds.has(contact._id);
            return (
              <div key={contact._id} className="contacts-row-group">
                <div className="contacts-row">
                  <span>{contact.firstName || "-"}</span>
                  <span>{contact.lastName || "-"}</span>
                  <span>{contact.company || "-"}</span>
                  <span>{contact.department || "-"}</span>
                  <span>
                    {contact.phones && contact.phones.length
                      ? contact.phones.map((p) => `${p.code} ${p.number}`).join(", ")
                      : "-"}
                  </span>
                  <span className="contacts-row-actions">
                    <button
                      type="button"
                      className="contacts-edit-btn"
                      onClick={() => navigate(`/contacts?edit=${contact._id}`)}
                      aria-label="Edit contact"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      className="contacts-delete-btn"
                      onClick={() => handleDelete(contact)}
                      aria-label="Delete contact"
                    >
                      <Trash2 size={14} />
                    </button>
                  </span>
                </div>
                <button
                  type="button"
                  className="contacts-show-more-btn"
                  onClick={() => toggleExpanded(contact._id)}
                >
                  {isExpanded ? "Show less" : "Show more"}
                </button>
                {isExpanded && (
                  <div className="contacts-more-details">
                    <div className="contacts-detail-field">
                      <span className="contacts-detail-label">Job Title</span>
                      <span>{contact.jobTitle || "-"}</span>
                    </div>
                    <div className="contacts-detail-field">
                      <span className="contacts-detail-label">Organization Department</span>
                      <span>{contact.department || "-"}</span>
                    </div>
                    <div className="contacts-detail-field">
                      <span className="contacts-detail-label">Email</span>
                      <span>
                        {contact.emails && contact.emails.length
                          ? contact.emails.join(", ")
                          : "-"}
                      </span>
                    </div>
                    <div className="contacts-detail-field">
                      <span className="contacts-detail-label">Address</span>
                      <span>{contact.address || "-"}</span>
                    </div>
                    <div className="contacts-detail-field">
                      <span className="contacts-detail-label">Birthday</span>
                      <span>
                        {contact.birthday && contact.birthday.month
                          ? [contact.birthday.month, contact.birthday.day, contact.birthday.year]
                              .filter(Boolean)
                              .join(" ")
                          : "-"}
                      </span>
                    </div>
                    <div className="contacts-detail-field">
                      <span className="contacts-detail-label">Notes</span>
                      <span>{contact.notes || "-"}</span>
                    </div>
                    <div className="contacts-detail-field">
                      <span className="contacts-detail-label">Significant Dates</span>
                      <span>
                        {contact.significantDates && contact.significantDates.length
                          ? contact.significantDates
                              .map((d) =>
                                [d.label, d.month, d.day, d.year].filter(Boolean).join(" ")
                              )
                              .join(", ")
                          : "-"}
                      </span>
                    </div>
                    <div className="contacts-detail-field">
                      <span className="contacts-detail-label">Website</span>
                      <span>
                        {contact.websites && contact.websites.length
                          ? contact.websites.join(", ")
                          : "-"}
                      </span>
                    </div>
                    <div className="contacts-detail-field">
                      <span className="contacts-detail-label">Related People</span>
                      <span>
                        {contact.relatedPeople && contact.relatedPeople.length
                          ? contact.relatedPeople
                              .map((p) => `${p.name} (${p.relation})`)
                              .join(", ")
                          : "-"}
                      </span>
                    </div>
                    <div className="contacts-detail-field">
                      <span className="contacts-detail-label">Custom Fields</span>
                      <span>
                        {contact.customFields && contact.customFields.length
                          ? contact.customFields.map((f) => `${f.label}: ${f.value}`).join(", ")
                          : "-"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ContactsList;
