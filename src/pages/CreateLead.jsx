import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Pencil, X } from "lucide-react";
import { API_BASE, apiFetch } from "../api.js";
import { LEAD_SOURCES } from "../leadSources.js";
import "./CreateLead.css";

const ACTIONS = ["Budgetary Quotation", "Product Information"];

const ACTION_LINKS = {
  "Budgetary Quotation": (leadId) => `/sales/quotations/new?leadId=${leadId}`,
  "Product Information": () => "/sales/product-information",
};

const FOLLOW_UP_TYPES = ["Call", "Email", "Meeting", "Site Visit", "Other"];

const STATUSES = ["New", "Contacted", "Qualified", "Converted", "Lost"];

const PRIORITIES = ["A", "B", "C", "D"];

function CreateLead() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedSource = searchParams.get("source") || "";
  const [designation, setDesignation] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [dateGenerated, setDateGenerated] = useState(() => new Date().toISOString().slice(0, 10));
  const [department, setDepartment] = useState("");
  const [organisation, setOrganisation] = useState("");
  const [address, setAddress] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [dob, setDob] = useState("");
  const [anniversary, setAnniversary] = useState("");
  const [projectInput, setProjectInput] = useState("");
  const [projects, setProjects] = useState([]);
  const [editingProjectIndex, setEditingProjectIndex] = useState(null);
  const [leadSources, setLeadSources] = useState(() =>
    preselectedSource ? [preselectedSource] : []
  );
  const [leadSourceDetails, setLeadSourceDetails] = useState({});
  const [actions, setActions] = useState([]);
  const [actionDetails, setActionDetails] = useState({});
  const [nextFollowUpDate, setNextFollowUpDate] = useState("");
  const [nextFollowUpType, setNextFollowUpType] = useState("");
  const [status, setStatus] = useState("");
  const [leadMaturity, setLeadMaturity] = useState("");
  const [priority, setPriority] = useState("");
  const [remarks, setRemarks] = useState("");
  const [saveStatus, setSaveStatus] = useState("idle");

  const toggleLeadSource = (source) => {
    setLeadSources((prev) =>
      prev.includes(source) ? prev.filter((s) => s !== source) : [...prev, source]
    );
  };

  const toggleAction = (action) => {
    setActions((prev) =>
      prev.includes(action) ? prev.filter((a) => a !== action) : [...prev, action]
    );
  };

  const updateActionDetail = (action, field, value) => {
    setActionDetails((prev) => ({
      ...prev,
      [action]: { status: "Pending", assignedTo: "", ...prev[action], [field]: value },
    }));
  };

  const handleAddProject = (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const value = projectInput.trim();
    if (!value) return;
    if (editingProjectIndex !== null) {
      setProjects((prev) =>
        prev.map((project, index) => (index === editingProjectIndex ? value : project))
      );
      setEditingProjectIndex(null);
    } else {
      setProjects((prev) => [...prev, value]);
    }
    setProjectInput("");
  };

  const handleEditProject = (index) => {
    setProjectInput(projects[index]);
    setEditingProjectIndex(index);
  };

  const handleDeleteProject = (index) => {
    setProjects((prev) => prev.filter((_, i) => i !== index));
    if (editingProjectIndex === index) {
      setEditingProjectIndex(null);
      setProjectInput("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveStatus("saving");
    try {
      const res = await apiFetch(`${API_BASE}/api/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          designation,
          name,
          email,
          dateGenerated,
          department,
          organisation,
          address,
          pinCode,
          dob,
          anniversary,
          projects,
          leadSources,
          leadSourceDetails,
          actions: actions.map((action) => ({
            type: action,
            status: actionDetails[action]?.status || "Pending",
            assignedTo: actionDetails[action]?.assignedTo || "",
          })),
          nextFollowUpDate,
          nextFollowUpType,
          status,
          leadMaturity: leadMaturity === "" ? null : Number(leadMaturity),
          priority,
          remarks,
        }),
      });
      if (!res.ok) throw new Error("Failed to save lead");
      const data = await res.json();
      const leadId = data.lead?._id;
      if (leadId && actions.length === 1) {
        navigate(ACTION_LINKS[actions[0]](leadId));
      } else if (leadId && actions.length > 1) {
        navigate(`/sales/leads/${leadId}`);
      } else {
        navigate("/sales/leads");
      }
    } catch (err) {
      setSaveStatus("error");
    }
  };

  return (
    <div className="create-lead-page">
      <button
        type="button"
        className="create-lead-back"
        onClick={() => navigate("/sales/leads")}
      >
        <ArrowLeft size={16} />
        <span>Leads</span>  
      </button>

      <h1 className="create-lead-title">Create Lead</h1>

      <form className="create-lead-form" onSubmit={handleSubmit}>
        <div className="create-lead-grid">
        <div className="form-field">
          <label htmlFor="dateGenerated">Date (Lead Generated)</label>
          <input
            id="dateGenerated"
            name="dateGenerated" 
            type="date"
            value={dateGenerated}
            onChange={(e) => setDateGenerated(e.target.value)}
          />
        </div>

        <div className="form-field">
          <label htmlFor="name">Name</label>
          <div className="name-group">
            <input
              id="designation"
              name="designation"
              className="designation-input"
              list="designation-options"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              placeholder="Mr."
            />
            <datalist id="designation-options">
              <option value="Mr." />
              <option value="Mrs." />
              <option value="Miss" />
              <option value="Dr." />
              <option value="Prof." />
            </datalist>
            <input
              id="name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter full name"
            />
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email address"
          />
        </div>

        <div className="form-field">
          <label htmlFor="department">Department</label>
          <input
            id="department"
            name="department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            placeholder="Enter department"
          />
        </div>

        <div className="form-field">
          <label htmlFor="organisation">Instititute/University/Organisation Name</label>
          <input
            id="organisation"
            name="organisation"
            value={organisation}
            onChange={(e) => setOrganisation(e.target.value)}
            placeholder="Enter Instititute/University/Organisation Name"
          />
        </div>

        <div className="form-field">
          <label htmlFor="address">Address</label>
          <input
            id="address"
            name="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter address"
          />
        </div>

        <div className="form-field">
          <label htmlFor="pinCode">Pin Code</label>
          <input
            id="pinCode"
            name="pinCode"
            value={pinCode}
            onChange={(e) => setPinCode(e.target.value)}
            placeholder="Enter pin code"
          />
        </div>

        <div className="form-field">
          <label htmlFor="dob">Date of Birth</label>
          <input
            id="dob"
            name="dob"
            type="date"
            value={dob}
            onChange={(e) => setDob(e.target.value)}
          />
        </div>

        <div className="form-field">
          <label htmlFor="anniversary">Anniversary Date</label>
          <input
            id="anniversary"
            name="anniversary"
            type="date"
            value={anniversary}
            onChange={(e) => setAnniversary(e.target.value)}
          />
        </div>

        <div className="form-field create-lead-span-2">
          <label htmlFor="projectsCompleted">Projects Completed</label>
          <input
            id="projectsCompleted"
            name="projectsCompleted"
            value={projectInput}
            onChange={(e) => setProjectInput(e.target.value)}
            onKeyDown={handleAddProject}
            placeholder="Enter a project and press Enter"
          />
          {projects.length > 0 && (
            <ul className="project-list">
              {projects.map((project, index) => (
                <li
                  key={`${project}-${index}`}
                  className={`project-chip ${index === editingProjectIndex ? "editing" : ""}`}
                >
                  <span className="project-chip-number">{index + 1}.</span>
                  <span className="project-chip-text">{project}</span>
                  <button
                    type="button"
                    className="project-chip-btn"
                    onClick={() => handleEditProject(index)}
                    aria-label="Edit project"
                  >
                    <Pencil size={13} />
                  </button>
                  <button
                    type="button"
                    className="project-chip-btn"
                    onClick={() => handleDeleteProject(index)}
                    aria-label="Delete project"
                  >
                    <X size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="form-field create-lead-span-2">
          <label>Lead Source</label>
          <div className="toggle-group">
            {LEAD_SOURCES.map((source) => {
              const active = leadSources.includes(source);
              return (
                <div key={source} className="toggle-item">
                  <button
                    type="button"
                    className={`toggle-btn ${active ? "active" : ""}`}
                    onClick={() => toggleLeadSource(source)}
                  >
                    {source}
                  </button>
                  {active && (
                    <input
                      className="toggle-detail-input"
                      value={leadSourceDetails[source] || ""}
                      onChange={(e) =>
                        setLeadSourceDetails((prev) => ({ ...prev, [source]: e.target.value }))
                      }
                      placeholder={`Add detail for ${source}`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="form-field create-lead-span-2">
          <label>Action</label>
          <div className="toggle-group">
            {ACTIONS.map((action) => {
              const active = actions.includes(action);
              const detail = actionDetails[action] || { status: "Pending", assignedTo: "" };
              return (
                <div key={action} className="toggle-item">
                  <button
                    type="button"
                    className={`toggle-btn ${active ? "active" : ""}`}
                    onClick={() => toggleAction(action)}
                  >
                    {action}
                  </button>
                  {active && (
                    <>
                      <input
                        className="toggle-detail-input"
                        value={detail.assignedTo}
                        onChange={(e) => updateActionDetail(action, "assignedTo", e.target.value)}
                        placeholder="Assigned to"
                      />
                      <select
                        className="toggle-detail-input"
                        value={detail.status}
                        onChange={(e) => updateActionDetail(action, "status", e.target.value)}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Sent">Sent</option>
                      </select>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="status">Status</label>
          <select
            id="status"
            name="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Select status</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="priority">Priority</label>
          <select
            id="priority"
            name="priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          >
            <option value="">Select priority</option>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div className="form-field">
          <label htmlFor="leadMaturity">Percentage of Lead Maturity</label>
          <div className="maturity-input-group">
            <input
              id="leadMaturity"
              name="leadMaturity"
              type="number"
              min="0"
              max="100"
              value={leadMaturity}
              onChange={(e) => setLeadMaturity(e.target.value)}
              placeholder="0"
            />
            <span className="maturity-suffix">%</span>
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="nextFollowUpDate">Next Follow-up Date</label>
          <div className="follow-up-group">
            <input
              id="nextFollowUpDate"
              name="nextFollowUpDate"
              type="date"
              value={nextFollowUpDate}
              onChange={(e) => setNextFollowUpDate(e.target.value)}
            />
            <select
              id="nextFollowUpType"
              name="nextFollowUpType"
              value={nextFollowUpType}
              onChange={(e) => setNextFollowUpType(e.target.value)}
            >
              <option value="">Type</option>
              {FOLLOW_UP_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>
        </div>

        <div className="form-field">
          <label htmlFor="remarks">Remarks</label>
          <textarea
            id="remarks"
            name="remarks"
            rows={3}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Brief discussion"
          />
        </div>

        <div className="create-lead-actions">
          {saveStatus === "error" && (
            <span className="create-lead-error">Could not save lead. Try again.</span>
          )}
          <button type="submit" className="btn-primary" disabled={saveStatus === "saving"}>
            {saveStatus === "saving" ? "Saving..." : "Save Lead"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateLead;
