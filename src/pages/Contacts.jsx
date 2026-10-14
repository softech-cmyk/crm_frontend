import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import * as XLSX from "xlsx";
import { Cake, Calendar, Phone, Plus, Tag, Upload, User, X } from "lucide-react";
import { API_BASE, apiFetch } from "../api.js";
import "./Contacts.css";

const COUNTRY_CODES = [
  { code: "+91", flag: "🇮🇳", name: "India" },
  { code: "+1", flag: "🇺🇸", name: "United States" },
  { code: "+44", flag: "🇬🇧", name: "United Kingdom" },
  { code: "+971", flag: "🇦🇪", name: "UAE" },
  { code: "+65", flag: "🇸🇬", name: "Singapore" },
  { code: "+61", flag: "🇦🇺", name: "Australia" },
  { code: "+49", flag: "🇩🇪", name: "Germany" },
  { code: "+81", flag: "🇯🇵", name: "Japan" },
  { code: "+86", flag: "🇨🇳", name: "China" },
];

const RELATIONS = [
  "Spouse",
  "Child",
  "Parent",
  "Sibling",
  "Friend",
  "Manager",
  "Assistant",
  "Relative",
  "Partner",
  "Other",
];

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function parseGoogleDate(value) {
  if (!value) return null;
  const parts = String(value).split("-");
  let year = "";
  let month = "";
  let day = "";
  if (parts.length === 3) {
    [year, month, day] = parts;
  } else if (parts.length === 4) {
    month = parts[2];
    day = parts[3];
  } else {
    return null;
  }
  const monthName = MONTHS[parseInt(month, 10) - 1] || "";
  if (!monthName) return null;
  return { month: monthName, day: day ? String(parseInt(day, 10)) : "", year: year || "" };
}

function parsePhoneValue(raw) {
  const trimmed = String(raw).trim();
  const match = COUNTRY_CODES.find((c) => trimmed.startsWith(c.code));
  if (match) {
    return { code: match.code, number: trimmed.slice(match.code.length).trim() };
  }
  return { code: "+91", number: trimmed };
}

function collectIndexedValues(row, prefix, suffix) {
  const values = [];
  Object.keys(row).forEach((key) => {
    const re = new RegExp(`^${prefix} (\\d+) - ${suffix}$`);
    if (re.test(key) && String(row[key]).trim()) {
      values.push({ key, value: String(row[key]).trim() });
    }
  });
  return values;
}

function mapGoogleCsvRowToContact(row) {
  const firstName = row["Given Name"] || row["First Name"] || "";
  const lastName = row["Family Name"] || row["Last Name"] || "";
  if (!firstName && !lastName) return null;

  const emails = collectIndexedValues(row, "E-mail", "Value").map((e) => e.value);

  const phones = collectIndexedValues(row, "Phone", "Value").map((p) => parsePhoneValue(p.value));

  const addressEntry = collectIndexedValues(row, "Address", "Formatted")[0];

  const websites = collectIndexedValues(row, "Website", "Value").map((w) => w.value);

  const relationTypes = collectIndexedValues(row, "Relation", "Type");
  const relatedPeople = relationTypes
    .map(({ key, value }) => {
      const index = key.match(/^Relation (\d+) - Type$/)[1];
      const name = row[`Relation ${index} - Value`];
      if (!name) return null;
      const relation = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
      return { relation: RELATIONS.includes(relation) ? relation : "Other", name };
    })
    .filter(Boolean);

  const eventTypes = collectIndexedValues(row, "Event", "Type");
  const significantDates = eventTypes
    .map(({ key, value }) => {
      const index = key.match(/^Event (\d+) - Type$/)[1];
      const dateValue = row[`Event ${index} - Value`];
      const parsed = parseGoogleDate(dateValue);
      if (!parsed) return null;
      const label = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
      return { label: label === "Anniversary" ? "Anniversary" : "Other", ...parsed };
    })
    .filter(Boolean);

  const customFieldTypes = collectIndexedValues(row, "Custom Field", "Type");
  const customFields = customFieldTypes
    .map(({ key, value }) => {
      const index = key.match(/^Custom Field (\d+) - Type$/)[1];
      const fieldValue = row[`Custom Field ${index} - Value`];
      if (!fieldValue) return null;
      return { label: value, value: fieldValue };
    })
    .filter(Boolean);

  return {
    firstName,
    lastName,
    company: row["Organization 1 - Name"] || "",
    jobTitle: row["Organization 1 - Title"] || "",
    department: row["Organization 1 - Department"] || row["Organization Department"] || "",
    emails,
    phones,
    address: addressEntry ? addressEntry.value : "",
    birthday: parseGoogleDate(row["Birthday"]) || { month: "", day: "", year: "" },
    notes: row["Notes"] || "",
    significantDates,
    websites,
    relatedPeople,
    customFields,
  };
}

function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [company, setCompany] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [emails, setEmails] = useState([""]);
  const [phones, setPhones] = useState([{ code: "+91", number: "" }]);
  const [address, setAddress] = useState("");
  const [birthday, setBirthday] = useState({ month: "", day: "", year: "" });
  const [notes, setNotes] = useState("");
  const [significantDates, setSignificantDates] = useState([]);
  const [websites, setWebsites] = useState([]);
  const [relatedPeople, setRelatedPeople] = useState([]);
  const [customFields, setCustomFields] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [saveStatus, setSaveStatus] = useState("idle");
  const [showMoreFields, setShowMoreFields] = useState(false);
  const [importStatus, setImportStatus] = useState("idle");
  const [importMessage, setImportMessage] = useState("");
  const [searchParams, setSearchParams] = useSearchParams();

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

  useEffect(() => {
    const editId = searchParams.get("edit");
    if (editId && editId !== editingId) {
      const contact = contacts.find((c) => c._id === editId);
      if (contact) handleEdit(contact);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, contacts]);

  const handleCancelEdit = () => {
    if (searchParams.get("edit")) setSearchParams({}, { replace: true });
    setEditingId(null);
    setFirstName("");
    setLastName("");
    setCompany("");
    setJobTitle("");
    setDepartment("");
    setEmails([""]);
    setPhones([{ code: "+91", number: "" }]);
    setAddress("");
    setBirthday({ month: "", day: "", year: "" });
    setNotes("");
    setSignificantDates([]);
    setWebsites([]);
    setRelatedPeople([]);
    setCustomFields([]);
    setSaveStatus("idle");
  };

  const handleEdit = (contact) => {
    setEditingId(contact._id);
    setFirstName(contact.firstName || "");
    setLastName(contact.lastName || "");
    setCompany(contact.company || "");
    setJobTitle(contact.jobTitle || "");
    setDepartment(contact.department || "");
    setEmails(contact.emails && contact.emails.length ? contact.emails : [""]);
    setPhones(
      contact.phones && contact.phones.length ? contact.phones : [{ code: "+91", number: "" }]
    );
    setAddress(contact.address || "");
    setBirthday(contact.birthday || { month: "", day: "", year: "" });
    setNotes(contact.notes || "");
    setSignificantDates(contact.significantDates || []);
    setWebsites(contact.websites && contact.websites.length ? contact.websites : []);
    setRelatedPeople(contact.relatedPeople || []);
    setCustomFields(contact.customFields || []);
  };

  const updateBirthday = (field, value) => {
    setBirthday((prev) => ({ ...prev, [field]: value }));
  };

  const updateEmail = (index, value) => {
    setEmails((prev) => prev.map((e, i) => (i === index ? value : e)));
  };

  const addEmail = () => {
    setEmails((prev) => [...prev, ""]);
  };

  const updateWebsite = (index, value) => {
    setWebsites((prev) => prev.map((w, i) => (i === index ? value : w)));
  };

  const addWebsite = () => {
    setWebsites((prev) => [...prev, ""]);
  };

  const removeWebsite = (index) => {
    setWebsites((prev) => prev.filter((_, i) => i !== index));
  };

  const updatePhone = (index, field, value) => {
    setPhones((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
  };

  const addPhone = () => {
    setPhones((prev) => [...prev, { code: "+91", number: "" }]);
  };

  const removePhone = (index) => {
    setPhones((prev) => prev.filter((_, i) => i !== index));
  };

  const addSignificantDate = () => {
    setSignificantDates((prev) => [
      ...prev,
      { label: "Anniversary", month: "", day: "", year: "" },
    ]);
  };

  const updateSignificantDate = (index, field, value) => {
    setSignificantDates((prev) =>
      prev.map((d, i) => (i === index ? { ...d, [field]: value } : d))
    );
  };

  const removeSignificantDate = (index) => {
    setSignificantDates((prev) => prev.filter((_, i) => i !== index));
  };

  const addRelatedPerson = () => {
    setRelatedPeople((prev) => [...prev, { relation: "Spouse", name: "" }]);
  };

  const updateRelatedPerson = (index, field, value) => {
    setRelatedPeople((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    );
  };

  const removeRelatedPerson = (index) => {
    setRelatedPeople((prev) => prev.filter((_, i) => i !== index));
  };

  const addCustomField = () => {
    setCustomFields((prev) => [...prev, { label: "", value: "" }]);
  };

  const updateCustomField = (index, field, value) => {
    setCustomFields((prev) => prev.map((f, i) => (i === index ? { ...f, [field]: value } : f)));
  };

  const removeCustomField = (index) => {
    setCustomFields((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImportFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImportStatus("importing");
    setImportMessage("");
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      const contactsToImport = rows.map(mapGoogleCsvRowToContact).filter(Boolean);
      if (contactsToImport.length === 0) {
        throw new Error("No valid contacts found in file.");
      }
      const res = await apiFetch(`${API_BASE}/api/contacts/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contacts: contactsToImport }),
      });
      if (!res.ok) throw new Error("Failed to import contacts");
      const data = await res.json();
      setImportStatus("success");
      setImportMessage(`Imported ${data.count} contact(s).`);
      loadContacts();
    } catch (err) {
      setImportStatus("error");
      setImportMessage(err.message || "Failed to import file.");
    } finally {
      e.target.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveStatus("saving");
    try {
      const url = editingId ? `${API_BASE}/api/contacts/${editingId}` : `${API_BASE}/api/contacts`;
      const res = await apiFetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          company,
          jobTitle,
          department,
          emails: emails.map((e) => e.trim()).filter(Boolean),
          phones: phones.filter((p) => p.number.trim()),
          address,
          birthday,
          notes,
          significantDates: significantDates.filter((d) => d.month),
          websites: websites.map((w) => w.trim()).filter(Boolean),
          relatedPeople: relatedPeople.filter((p) => p.name.trim()),
          customFields: customFields.filter((f) => f.label.trim() && f.value.trim()),
        }),
      });
      if (!res.ok) throw new Error("Failed to save contact");
      if (searchParams.get("edit")) setSearchParams({}, { replace: true });
      setEditingId(null);
      setFirstName("");
      setLastName("");
      setCompany("");
      setJobTitle("");
      setDepartment("");
      setEmails([""]);
      setPhones([{ code: "+91", number: "" }]);
      setAddress("");
      setBirthday({ month: "", day: "", year: "" });
      setNotes("");
      setSignificantDates([]);
      setWebsites([]);
      setRelatedPeople([]);
      setCustomFields([]);
      setSaveStatus("idle");
      loadContacts();
    } catch (err) {
      setSaveStatus("error");
    }
  };

  return (
    <div className="contacts-page">
      <h1 className="contacts-title">Contacts</h1>

      <form className="contacts-form" onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="contactFirstName">First Name</label>
          <input
            id="contactFirstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Enter first name"
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="contactLastName">Last Name</label>
          <input
            id="contactLastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Enter last name"
          />
        </div>
        <div className="form-field">
          <label htmlFor="contactCompany">Company</label>
          <input
            id="contactCompany"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Enter company"
          />
        </div>
        <div className="form-field">
          <label htmlFor="contactJobTitle">Job Title</label>
          <input
            id="contactJobTitle"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="Enter job title"
          />
        </div>
        <div className="form-field">
          <label htmlFor="contactEmail">Email</label>
          {emails.map((value, index) => (
            <input
              key={index}
              id={index === 0 ? "contactEmail" : undefined}
              type="email"
              value={value}
              onChange={(e) => updateEmail(index, e.target.value)}
              placeholder="Enter email"
            />
          ))}
          <button type="button" className="contacts-add-email-btn" onClick={addEmail}>
            <Plus size={14} />
            <span>Add email</span>
          </button>
        </div>
        <div className="form-field contacts-phone-field">
          <label>Phone</label>
          {phones.map((phone, index) => (
            <div className="contacts-phone-row" key={index}>
              <Phone size={16} className="contacts-phone-icon" />
              <select
                className="contacts-phone-code"
                value={phone.code}
                onChange={(e) => updatePhone(index, "code", e.target.value)}
                aria-label="Country code"
              >
                {COUNTRY_CODES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.code}
                  </option>
                ))}
              </select>
              <input
                type="tel"
                value={phone.number}
                onChange={(e) => updatePhone(index, "number", e.target.value)}
                placeholder="Phone"
              />
              <button
                type="button"
                className="contacts-remove-phone-btn"
                onClick={() => removePhone(index)}
                aria-label="Remove phone"
              >
                <X size={16} />
              </button>
            </div>
          ))}
          <button type="button" className="contacts-add-email-btn" onClick={addPhone}>
            <span>Add phone</span>
          </button>
        </div>
        <div className="form-field">
          <label htmlFor="contactAddress">Address</label>
          <input
            id="contactAddress"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Enter address"
          />
        </div>
        <div className="form-field contacts-birthday-field">
          <label>Birthday</label>
          <div className="contacts-birthday-row">
            <Cake size={16} className="contacts-birthday-icon" />
            <select
              className="contacts-birthday-month"
              value={birthday.month}
              onChange={(e) => updateBirthday("month", e.target.value)}
              aria-label="Month"
            >
              <option value="">Month</option>
              {MONTHS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <input
              className="contacts-birthday-day"
              value={birthday.day}
              onChange={(e) => updateBirthday("day", e.target.value)}
              placeholder="Day"
            />
            <input
              className="contacts-birthday-year"
              value={birthday.year}
              onChange={(e) => updateBirthday("year", e.target.value)}
              placeholder="Year (optional)"
            />
          </div>
        </div>
        <div className="form-field contacts-notes-field">
          <label htmlFor="contactNotes">Notes</label>
          <textarea
            id="contactNotes"
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Enter notes"
          />
        </div>
        <button
          type="button"
          className="contacts-form-show-more"
          onClick={() => setShowMoreFields((prev) => !prev)}
        >
          {showMoreFields ? "Show less" : "Show more"}
        </button>
        {showMoreFields && (
          <div className="contacts-form-more-fields">
            <div className="form-field">
              <label htmlFor="contactDepartment">Organization Department</label>
              <input
                id="contactDepartment"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Enter organization department"
              />
            </div>
            <div className="form-field contacts-significant-date-field">
              <label>Significant Dates</label>
              {significantDates.map((date, index) => (
                <div className="contacts-significant-date-row" key={index}>
                  <select
                    className="contacts-significant-date-label"
                    value={date.label}
                    onChange={(e) => updateSignificantDate(index, "label", e.target.value)}
                    aria-label="Date type"
                  >
                    <option value="Anniversary">Anniversary</option>
                    <option value="Other">Other</option>
                  </select>
                  <select
                    className="contacts-birthday-month"
                    value={date.month}
                    onChange={(e) => updateSignificantDate(index, "month", e.target.value)}
                    aria-label="Month"
                  >
                    <option value="">Month</option>
                    {MONTHS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <input
                    className="contacts-birthday-day"
                    value={date.day}
                    onChange={(e) => updateSignificantDate(index, "day", e.target.value)}
                    placeholder="Day"
                  />
                  <input
                    className="contacts-birthday-year"
                    value={date.year}
                    onChange={(e) => updateSignificantDate(index, "year", e.target.value)}
                    placeholder="Year (optional)"
                  />
                  <button
                    type="button"
                    className="contacts-remove-phone-btn"
                    onClick={() => removeSignificantDate(index)}
                    aria-label="Remove significant date"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="contacts-add-significant-date-btn"
                onClick={addSignificantDate}
              >
                <Calendar size={16} />
                <span>Add significant date</span>
              </button>
            </div>
            <div className="form-field">
              <label>Website</label>
              {websites.map((value, index) => (
                <div className="contacts-website-row" key={index}>
                  <input
                    type="url"
                    value={value}
                    onChange={(e) => updateWebsite(index, e.target.value)}
                    placeholder="Enter website"
                  />
                  <button
                    type="button"
                    className="contacts-remove-phone-btn"
                    onClick={() => removeWebsite(index)}
                    aria-label="Remove website"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              <button type="button" className="contacts-add-email-btn" onClick={addWebsite}>
                <Plus size={14} />
                <span>Add website</span>
              </button>
            </div>
            <div className="form-field contacts-related-person-field">
              <label>Related People</label>
              {relatedPeople.map((person, index) => (
                <div className="contacts-related-person-row" key={index}>
                  <select
                    className="contacts-significant-date-label"
                    value={person.relation}
                    onChange={(e) => updateRelatedPerson(index, "relation", e.target.value)}
                    aria-label="Relation"
                  >
                    {RELATIONS.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                  <input
                    value={person.name}
                    onChange={(e) => updateRelatedPerson(index, "name", e.target.value)}
                    placeholder="Name"
                  />
                  <button
                    type="button"
                    className="contacts-remove-phone-btn"
                    onClick={() => removeRelatedPerson(index)}
                    aria-label="Remove related person"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="contacts-add-significant-date-btn"
                onClick={addRelatedPerson}
              >
                <User size={16} />
                <span>Add related person</span>
              </button>
            </div>
            <div className="form-field contacts-custom-field-field">
              <label>Custom Fields</label>
              {customFields.map((field, index) => (
                <div className="contacts-custom-field-row" key={index}>
                  <input
                    value={field.label}
                    onChange={(e) => updateCustomField(index, "label", e.target.value)}
                    placeholder="Label"
                  />
                  <input
                    value={field.value}
                    onChange={(e) => updateCustomField(index, "value", e.target.value)}
                    placeholder="Value"
                  />
                  <button
                    type="button"
                    className="contacts-remove-phone-btn"
                    onClick={() => removeCustomField(index)}
                    aria-label="Remove custom field"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="contacts-add-significant-date-btn"
                onClick={addCustomField}
              >
                <Tag size={16} />
                <span>Add custom field</span>
              </button>
            </div>
          </div>
        )}
        <div className="contacts-form-actions">
          {saveStatus === "error" && (
            <span className="contacts-error">Could not save contact.</span>
          )}
          {editingId && (
            <button type="button" className="btn-secondary" onClick={handleCancelEdit}>
              Cancel
            </button>
          )}
          <button type="submit" className="btn-primary" disabled={saveStatus === "saving"}>
            {saveStatus === "saving" ? "Saving..." : editingId ? "Update" : "Save"}
          </button>
        </div>
      </form>

      <div className="contacts-import">
        <h2 className="contacts-import-title">Import Contacts</h2>
        <label className="btn-secondary contacts-import-file-btn">
          <Upload size={14} />
          Choose file (Google Contacts CSV export)
          <input
            type="file"
            accept=".csv"
            onChange={handleImportFile}
            className="contacts-import-file-input"
          />
        </label>
        <p className="contacts-import-hint">
          Export your old contacts from Google Contacts as a CSV file and upload it here to sync
          them into this list.
        </p>
        {importStatus === "importing" && <span className="contacts-upload-status">Importing...</span>}
        {importStatus === "error" && <span className="contacts-error">{importMessage}</span>}
        {importStatus === "success" && (
          <span className="contacts-import-success">{importMessage}</span>
        )}
      </div>
    </div>
  );
}

export default Contacts;
