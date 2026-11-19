import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { API_BASE, apiFetch } from "../api.js";
import "./CreateLead.css";

export const DISTRIBUTOR_IMPORT_COLUMNS = [
  { header: "First Name", field: "firstName" },
  { header: "Middle Name", field: "middleName" },
  { header: "Last Name", field: "lastName" },
  { header: "Company Name", field: "companyName" },
  { header: "Address", field: "address" },
  { header: "Email id", field: "email" },
  { header: "Contact No", field: "contactNo" },
  { header: "GST No.", field: "gstNo" },
  { header: "End User Name", field: "endUserName" },
  { header: "End User Orgainsation Name", field: "endUserOrganisationName" },
  { header: "End User Address", field: "endUserAddress" },
  { header: "Requirement item name", field: "requirementItemName" },
  { header: "model NO.", field: "modelNo" },
  { header: "Budget Available (Yes/No)", field: "budgetAvailable" },
  { header: "Budget Amount", field: "budgetAmount" },
  { header: "Tentative Purchase Duration", field: "tentativePurchaseDuration" },
  { header: "Direct Purchase/Gem Portal/Eprocurement Portal", field: "purchaseMode" },
  { header: "Dealer Margin", field: "dealerMargin" },
  { header: "Payment Terms (100% Advance)", field: "paymentTerms" },
];

const PURCHASE_MODES = ["Direct Purchase", "Gem Portal", "Eprocurement Portal"];

const EMPTY = Object.fromEntries(DISTRIBUTOR_IMPORT_COLUMNS.map((c) => [c.field, ""]));

function CreateDistributorLead() {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [saveStatus, setSaveStatus] = useState("idle");

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const text = (field, label, props = {}) => (
    <div className="form-field">
      <label htmlFor={field}>{label}</label>
      <input id={field} name={field} value={form[field]} onChange={set(field)} {...props} />
    </div>
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveStatus("saving");
    try {
      const res = await apiFetch(`${API_BASE}/api/distributor-leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to save lead");
      navigate("/sales/leads");
    } catch (err) {
      setSaveStatus("error");
    }
  };

  return (
    <div className="create-lead-page">
      <button type="button" className="create-lead-back" onClick={() => navigate("/sales/leads")}>
        <ArrowLeft size={16} />
        <span>Leads</span>
      </button>

      <h1 className="create-lead-title">Local Distributors Lead</h1>

      <form className="create-lead-form" onSubmit={handleSubmit}>
        <div className="create-lead-grid">
          {text("firstName", "First Name")}
          {text("middleName", "Middle Name")}
          {text("lastName", "Last Name")}
          {text("companyName", "Company Name")}
          <div className="form-field create-lead-span-2">
            <label htmlFor="address">Address (Complete Bifurcation)</label>
            <input id="address" name="address" value={form.address} onChange={set("address")} />
          </div>
          {text("email", "Email id", { type: "email" })}
          {text("contactNo", "Contact No")}
          {text("gstNo", "GST No.")}
          {text("endUserName", "End User Name")}
          {text("endUserOrganisationName", "End User Orgainsation Name")}
          {text("endUserAddress", "End User Address")}
          {text("requirementItemName", "Requirement item name")}
          {text("modelNo", "model NO.")}

          <div className="form-field">
            <label htmlFor="budgetAvailable">Budget Available (Yes/No)</label>
            <select
              id="budgetAvailable"
              name="budgetAvailable"
              value={form.budgetAvailable}
              onChange={set("budgetAvailable")}
            >
              <option value="">Select</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>

          {text("budgetAmount", "Budget Amount")}
          {text("tentativePurchaseDuration", "Tentative Purchase Duration")}

          <div className="form-field">
            <label htmlFor="purchaseMode">Direct Purchase/Gem Portal/Eprocurement Portal</label>
            <select
              id="purchaseMode"
              name="purchaseMode"
              value={form.purchaseMode}
              onChange={set("purchaseMode")}
            >
              <option value="">Select</option>
              {PURCHASE_MODES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          {text("dealerMargin", "Dealer Margin")}
          {text("paymentTerms", "Payment Terms (100% Advance)")}
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

export default CreateDistributorLead;
