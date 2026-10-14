import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, X } from "lucide-react";
import { API_BASE, apiFetch } from "../api.js";
import { COMPANY_INFO, DEFAULT_TERMS, DEFAULT_ENCLOSURES } from "../companyInfo.js";
import ChipListInput from "../components/ChipListInput.jsx";
import PhoneInput from "../components/PhoneInput.jsx";
import { amountInWords } from "../utils/numberToWords.js";
import "./CreateQuotation.css";

function buildRefNo(lead) {
  const namePart = (lead?.name || "LEAD").replace(/\s+/g, "").toUpperCase().slice(0, 6);
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `QR-${namePart}-${datePart}`;
}

function emptyItem() {
  return {
    product: "",
    partNo: "",
    name: "",
    model: "",
    description: "",
    includesNote: "",
    imageUrl: "",
    standardInclusions: [],
    quantity: 1,
    unitPrice: "",
    included: true,
  };
}

function parseNumericString(value) {
  if (value == null) return "";
  const cleaned = String(value).replace(/,/g, "").trim();
  return cleaned === "" ? "" : cleaned;
}

function itemTotal(item) {
  return (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
}

function lineItemsBasic(list) {
  return list.filter((item) => item.included !== false).reduce((sum, item) => sum + itemTotal(item), 0);
}

function toApiItems(list) {
  return list
    .filter((item) => item.name)
    .map((item) => ({
      ...item,
      quantity: item.quantity === "" || item.quantity == null ? null : Number(item.quantity),
      unitPrice: Number(item.unitPrice) || 0,
      total: itemTotal(item),
    }));
}

function CreateQuotation() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const leadIdFromQuery = searchParams.get("leadId") || "";
  const editId = searchParams.get("editId") || "";

  const [recipientDesignation, setRecipientDesignation] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [salutationName, setSalutationName] = useState("");
  const [recipientPosition, setRecipientPosition] = useState("");
  const [department, setDepartment] = useState("");
  const [instituteName, setInstituteName] = useState("");
  const [principal, setPrincipal] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [grading, setGrading] = useState("");
  const [address, setAddress] = useState("");
  const [email1, setEmail1] = useState("");
  const [email2, setEmail2] = useState("");
  const [contactNo, setContactNo] = useState("");
  const [salesExecutive, setSalesExecutive] = useState("");
  const [coverLetterBody, setCoverLetterBody] = useState("");
  const [enclosures, setEnclosures] = useState(DEFAULT_ENCLOSURES);
  const [subject, setSubject] = useState("");
  const [refNo, setRefNo] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [yog, setYog] = useState(String(new Date().getFullYear()));
  const [demoDate, setDemoDate] = useState("");
  const [supplyOrder, setSupplyOrder] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [itemOptions, setItemOptions] = useState([]);
  const [items, setItems] = useState([emptyItem()]);
  const [itemsNote, setItemsNote] = useState("");
  const [optionalItems, setOptionalItems] = useState([]);
  const [optionalItemsNote, setOptionalItemsNote] = useState("");
  const [gstPercent, setGstPercent] = useState(18);
  const [terms, setTerms] = useState(DEFAULT_TERMS);
  const [signatoryName, setSignatoryName] = useState(COMPANY_INFO.defaultSignatory.name);
  const [signatoryDesignation, setSignatoryDesignation] = useState(COMPANY_INFO.defaultSignatory.designation);
  const [signatoryContact, setSignatoryContact] = useState(COMPANY_INFO.defaultSignatory.contactNo);
  const [remarks, setRemarks] = useState("");
  const [customFields, setCustomFields] = useState([]);
  const [saveStatus, setSaveStatus] = useState("idle");

  useEffect(() => {
    apiFetch(`${API_BASE}/api/products`)
      .then((res) => res.json())
      .then((data) => setItemOptions(data.products || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!leadIdFromQuery) return;
    apiFetch(`${API_BASE}/api/leads/${leadIdFromQuery}`)
      .then((res) => res.json())
      .then((data) => {
        setCustomerName(data.lead?.name || "");
        setInstituteName(data.lead?.organisation || "");
        setAddress(data.lead?.address || "");
        setEmail1(data.lead?.email || "");
        setRefNo(buildRefNo(data.lead));

        const sharedProducts = (data.lead?.sharedProducts || [])
          .map((sp) => sp.product)
          .filter(Boolean);

        if (sharedProducts.length > 0) {
          setItemOptions(sharedProducts);
        }
      })
      .catch(() => {});
  }, [leadIdFromQuery]);

  useEffect(() => {
    if (!editId) return;
    apiFetch(`${API_BASE}/api/quotations/${editId}`)
      .then((res) => res.json())
      .then((data) => {
        const q = data.quotation;
        if (!q) return;
        setRecipientDesignation(q.recipientDesignation || "");
        setCustomerName(q.customerName || "");
        setSalutationName(q.salutationName || "");
        setRecipientPosition(q.recipientPosition || "");
        setDepartment(q.department || "");
        setInstituteName(q.instituteName || "");
        setPrincipal(q.principal || "");
        setManufacturer(q.manufacturer || "");
        setGrading(q.grading || "");
        setAddress(q.address || "");
        setEmail1(q.email1 || "");
        setEmail2(q.email2 || "");
        setContactNo(q.contactNo || "");
        setSalesExecutive(q.salesExecutive || "");
        setCoverLetterBody(q.coverLetterBody || "");
        setEnclosures(q.enclosures?.length ? q.enclosures : DEFAULT_ENCLOSURES);
        setSubject(q.subject || "");
        setRefNo(q.refNo || "");
        setDate(q.date || new Date().toISOString().slice(0, 10));
        setYog(q.yog || String(new Date().getFullYear()));
        setDemoDate(q.demoDate || "");
        setSupplyOrder(q.supplyOrder || "");
        setFollowUpDate(q.followUpDate || "");
        setItems(q.items?.length ? q.items : [emptyItem()]);
        setItemsNote(q.itemsNote || "");
        setOptionalItems(q.optionalItems || []);
        setOptionalItemsNote(q.optionalItemsNote || "");
        setGstPercent(q.gstPercent ?? 18);
        setTerms({ ...DEFAULT_TERMS, ...(q.terms || {}) });
        setSignatoryName(q.signatoryName || COMPANY_INFO.defaultSignatory.name);
        setSignatoryDesignation(q.signatoryDesignation || COMPANY_INFO.defaultSignatory.designation);
        setSignatoryContact(q.signatoryContact || COMPANY_INFO.defaultSignatory.contactNo);
        setRemarks(q.remarks || "");
        setCustomFields(q.customFields || []);
      })
      .catch(() => {});
  }, [editId]);

  useEffect(() => {
    if (subject) return;
    const first = items[0];
    if (!first?.name) return;
    const rest = items
      .slice(1)
      .map((item) => item.name)
      .filter(Boolean);
    const suggestion = `${first.name}${first.model ? `, (Model: ${first.model})` : ""}${
      rest.length ? ` with ${rest.join(" & ")}` : ""
    }`;
    setSubject(suggestion);
  }, [items, subject]);

  const modelOptionsFor = (name) =>
    [...new Set(itemOptions.filter((p) => p.instrumentName === name && p.model).map((p) => p.model))];

  const findProductMatch = (name, model) =>
    itemOptions.find((p) => p.instrumentName === name && (model ? p.model === model : true));

  const applyProductToItem = (list, setList, index, name, model) => {
    const match = findProductMatch(name, model);
    setList(
      list.map((item, i) =>
        i === index
          ? {
              ...item,
              product: match?._id || "",
              name,
              model: model || match?.model || "",
              unitPrice: match?.basicPrice != null ? parseNumericString(match.basicPrice) : item.unitPrice,
            }
          : item
      )
    );
  };

  const handleItemNameChange = (list, setList, index, name) => {
    const models = modelOptionsFor(name);
    applyProductToItem(list, setList, index, name, models.length === 1 ? models[0] : "");
  };

  const handleItemModelChange = (list, setList, index, model) => {
    const name = list[index].name;
    applyProductToItem(list, setList, index, name, model);
  };

  const updateItemField = (list, setList, index, field, value) => {
    setList(list.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  };

  const addItem = (setList) => setList((prev) => [...prev, emptyItem()]);
  const removeItem = (setList, index) => setList((prev) => prev.filter((_, i) => i !== index));

  const updateTermField = (field, value) => setTerms((prev) => ({ ...prev, [field]: value }));

  const addCustomField = () => setCustomFields((prev) => [...prev, { label: "", value: "" }]);
  const removeCustomField = (index) =>
    setCustomFields((prev) => prev.filter((_, i) => i !== index));
  const updateCustomField = (index, key, value) =>
    setCustomFields((prev) => prev.map((f, i) => (i === index ? { ...f, [key]: value } : f)));

  const itemsBasic = lineItemsBasic(items);
  const itemsGst = (itemsBasic * gstPercent) / 100;
  const itemsGrandTotal = itemsBasic + itemsGst;

  const optionalBasic = lineItemsBasic(optionalItems);
  const optionalGst = (optionalBasic * gstPercent) / 100;
  const optionalGrandTotal = optionalBasic + optionalGst;

  const buildPayload = () => ({
    lead: leadIdFromQuery || undefined,
    recipientDesignation,
    customerName,
    salutationName,
    recipientPosition,
    department,
    instituteName,
    principal,
    manufacturer,
    grading,
    address,
    email1,
    email2,
    contactNo,
    salesExecutive,
    coverLetterBody,
    enclosures,
    subject,
    refNo,
    date,
    yog,
    demoDate,
    supplyOrder,
    followUpDate,
    items: toApiItems(items),
    itemsNote,
    optionalItems: toApiItems(optionalItems),
    optionalItemsNote,
    gstPercent: Number(gstPercent) || 0,
    signatoryName,
    signatoryDesignation,
    signatoryContact,
    terms,
    remarks,
    customFields: customFields.filter((f) => f.label || f.value),
  });

  const saveQuotation = async () => {
    const url = editId ? `${API_BASE}/api/quotations/${editId}` : `${API_BASE}/api/quotations`;
    const res = await apiFetch(url, {
      method: editId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPayload()),
    });
    if (!res.ok) throw new Error("Failed to save quotation");
    const data = await res.json();
    return data.quotation;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveStatus("saving");
    try {
      await saveQuotation();
      navigate(leadIdFromQuery ? `/sales/leads/${leadIdFromQuery}` : "/sales/quotations");
    } catch (err) {
      setSaveStatus("error");
    }
  };

  const handleGenerate = async () => {
    setSaveStatus("saving");
    try {
      const quotation = await saveQuotation();
      navigate(`/sales/quotations/${quotation._id}/preview`);
    } catch (err) {
      setSaveStatus("error");
    }
  };

  const renderItemsEditor = (list, setList, label) => (
    <div className="quotation-items">
      {list.map((item, index) => {
        const matchedProduct = findProductMatch(item.name, item.model);
        return (
        <div key={index} className="quotation-item-card">
          <div className="quotation-item-row">
            <div className="quotation-item-field name">
              <label>Product (type a name, or pick a suggestion from inventory)</label>
              <input
                list="inventory-product-names"
                value={item.name}
                onChange={(e) => handleItemNameChange(list, setList, index, e.target.value)}
                placeholder="Product name"
                autoComplete="off"
              />
              {matchedProduct && (
                <span className="quotation-item-inventory-hint">
                  From inventory: {matchedProduct.companyName}
                  {matchedProduct.make ? ` – ${matchedProduct.make}` : ""}
                </span>
              )}
            </div>
            <div className="quotation-item-field model">
              <label>Model</label>
              <select
                value={item.model}
                onChange={(e) => handleItemModelChange(list, setList, index, e.target.value)}
                disabled={modelOptionsFor(item.name).length === 0}
              >
                <option value="">
                  {modelOptionsFor(item.name).length === 0 ? "No models" : "Select a model"}
                </option>
                {modelOptionsFor(item.name).map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div className="quotation-item-field partno">
              <label>Part No.</label>
              <input
                value={item.partNo}
                onChange={(e) => updateItemField(list, setList, index, "partNo", e.target.value)}
                placeholder="e.g. CRS400"
              />
            </div>
            <div className="quotation-item-field qty">
              <label>Qty</label>
              <input
                type="number"
                min="0"
                value={item.quantity}
                onChange={(e) => updateItemField(list, setList, index, "quantity", e.target.value)}
              />
            </div>
            <div className="quotation-item-field price">
              <label>Unit Price (INR)</label>
              <input
                type="number"
                min="0"
                value={item.unitPrice}
                disabled={item.included === false}
                placeholder={item.included === false ? "No charge" : ""}
                onChange={(e) => updateItemField(list, setList, index, "unitPrice", e.target.value)}
              />
            </div>
            <div className="quotation-item-field total">
              <label>Total</label>
              <span>{item.included === false ? "—" : itemTotal(item).toFixed(2)}</span>
            </div>
            <label className="quotation-item-included">
              <input
                type="checkbox"
                checked={item.included !== false}
                onChange={(e) => updateItemField(list, setList, index, "included", e.target.checked)}
              />
              Included
            </label>
            <button
              type="button"
              className="quotation-item-remove"
              onClick={() => removeItem(setList, index)}
              aria-label={`Remove ${label} row`}
            >
              <X size={16} />
            </button>
          </div>
          <div className="quotation-item-field description">
            <label>Description</label>
            <textarea
              rows={3}
              value={item.description}
              onChange={(e) => updateItemField(list, setList, index, "description", e.target.value)}
              placeholder="Specification / description shown on the quotation"
            />
          </div>
          <div className="quotation-item-field description">
            <label>Includes (printed directly under this item's description)</label>
            <input
              value={item.includesNote || ""}
              onChange={(e) => updateItemField(list, setList, index, "includesNote", e.target.value)}
              placeholder="e.g. Includes: STD564 - Collars for SRC (Set of 5)"
            />
          </div>
          <div className="quotation-item-field description">
            <label>
              Standard Inclusions (feeds the ONE document-level "supplied with" list, printed once near the
              totals — not per item)
            </label>
            <ChipListInput
              values={item.standardInclusions || []}
              onChange={(values) => updateItemField(list, setList, index, "standardInclusions", values)}
              placeholder="e.g. Charger, then press Enter"
            />
          </div>
        </div>
        );
      })}
      <datalist id="inventory-product-names">
        {[...new Set(itemOptions.map((p) => p.instrumentName).filter(Boolean))].map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
      <button type="button" className="quotation-add-item" onClick={() => addItem(setList)}>
        + Add {label}
      </button>
    </div>
  );

  return (
    <div className="create-quotation-page">
      <button
        type="button"
        className="create-quotation-back"
        onClick={() => navigate(leadIdFromQuery ? `/sales/leads/${leadIdFromQuery}` : "/sales/quotations")}
      >
        <ArrowLeft size={16} />
        <span>Back</span>
      </button>

      <h1 className="create-quotation-title">Budgetary Quotation</h1>

      <form className="create-quotation-form" onSubmit={handleSubmit}>
        <div className="create-quotation-grid">
          <div className="form-field">
            <label htmlFor="recipientDesignation">Designation</label>
            <input
              id="recipientDesignation"
              list="recipient-designation-options"
              value={recipientDesignation}
              onChange={(e) => setRecipientDesignation(e.target.value)}
              placeholder="Prof."
            />
            <datalist id="recipient-designation-options">
              <option value="Mr." />
              <option value="Mrs." />
              <option value="Dr." />
              <option value="Prof." />
            </datalist>
          </div>

          <div className="form-field">
            <label htmlFor="customerName">Customer Name</label>
            <input
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter customer name"
            />
          </div>

          <div className="form-field">
            <label htmlFor="salutationName">Salutation Name</label>
            <input
              id="salutationName"
              value={salutationName}
              onChange={(e) => setSalutationName(e.target.value)}
              placeholder="e.g. Bhumi (used in 'Dear Dr. Bhumi,')"
            />
          </div>

          <div className="form-field">
            <label htmlFor="recipientPosition">Recipient Position</label>
            <input
              id="recipientPosition"
              value={recipientPosition}
              onChange={(e) => setRecipientPosition(e.target.value)}
              placeholder="e.g. HOD"
            />
          </div>

          <div className="form-field">
            <label htmlFor="department">Department</label>
            <input
              id="department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g. Department of Biotechnology"
            />
          </div>

          <div className="form-field">
            <label htmlFor="instituteName">Institute/Organisation Name</label>
            <input
              id="instituteName"
              value={instituteName}
              onChange={(e) => setInstituteName(e.target.value)}
              placeholder="Enter institute/organisation name"
            />
          </div>

          <div className="form-field">
            <label htmlFor="principal">Principal</label>
            <input
              id="principal"
              value={principal}
              onChange={(e) => setPrincipal(e.target.value)}
              placeholder="Enter principal's name"
            />
          </div>

          <div className="form-field">
            <label htmlFor="grading">Grading</label>
            <input
              id="grading"
              value={grading}
              onChange={(e) => setGrading(e.target.value)}
              placeholder="e.g. NAAC A+"
            />
          </div>

          <div className="form-field create-quotation-span-2">
            <label htmlFor="address">Address (one line per address line)</label>
            <textarea
              id="address"
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={"e.g. Indira Gandhi National Tribal University (IGNTU),\nAmarkantak Village-Lalpur, Dist- Anuppur (M.P.)"}
            />
          </div>

          <div className="form-field">
            <label htmlFor="email1">Email-1</label>
            <input
              id="email1"
              type="email"
              value={email1}
              onChange={(e) => setEmail1(e.target.value)}
              placeholder="Enter primary email"
            />
          </div>

          <div className="form-field">
            <label htmlFor="email2">Email-2</label>
            <input
              id="email2"
              type="email"
              value={email2}
              onChange={(e) => setEmail2(e.target.value)}
              placeholder="Enter secondary email"
            />
          </div>

          <div className="form-field">
            <label htmlFor="contactNo">Contact No.</label>
            <PhoneInput
              id="contactNo"
              value={contactNo}
              onChange={setContactNo}
              placeholder="Enter contact number"
            />
          </div>

          <div className="form-field">
            <label htmlFor="salesExecutive">Sales Executive</label>
            <input
              id="salesExecutive"
              value={salesExecutive}
              onChange={(e) => setSalesExecutive(e.target.value)}
              placeholder="e.g. Mr. Rajeev"
            />
          </div>

          <div className="form-field">
            <label htmlFor="manufacturer">Manufacturer / OEM</label>
            <input
              id="manufacturer"
              value={manufacturer}
              onChange={(e) => setManufacturer(e.target.value)}
              placeholder="e.g. PP Systems International, LLC, USA"
            />
          </div>

          <div className="form-field create-quotation-span-2">
            <label htmlFor="subject">Subject</label>
            <input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Auto-suggested from the items below"
            />
          </div>

          <div className="form-field create-quotation-span-2">
            <label htmlFor="coverLetterBody">
              Cover Letter Body (leave blank to auto-compose from Sales Executive / Manufacturer / Subject)
            </label>
            <textarea
              id="coverLetterBody"
              rows={4}
              value={coverLetterBody}
              onChange={(e) => setCoverLetterBody(e.target.value)}
              placeholder="Override the auto-composed cover letter paragraphs here if you need custom wording"
            />
          </div>

          <div className="form-field create-quotation-span-2">
            <label>Enclosures (listed in the cover letter)</label>
            <ChipListInput
              values={enclosures}
              onChange={setEnclosures}
              placeholder="e.g. Product Catalogue, then press Enter"
            />
          </div>

          <div className="form-field">
            <label htmlFor="refNo">Quotation Ref No.</label>
            <input
              id="refNo"
              value={refNo}
              onChange={(e) => setRefNo(e.target.value)}
              placeholder="e.g. NI/Q/177/2026-27"
            />
          </div>

          <div className="form-field">
            <label htmlFor="date">Date</label>
            <input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div className="form-field">
            <label htmlFor="yog">Year of Generation (YOG)</label>
            <input
              id="yog"
              type="number"
              value={yog}
              onChange={(e) => setYog(e.target.value)}
              placeholder="e.g. 2026"
            />
          </div>

          <div className="form-field">
            <label htmlFor="demoDate">Demo Date</label>
            <input id="demoDate" type="date" value={demoDate} onChange={(e) => setDemoDate(e.target.value)} />
          </div>

          <div className="form-field">
            <label htmlFor="supplyOrder">Supply Order (Y/N)</label>
            <select id="supplyOrder" value={supplyOrder} onChange={(e) => setSupplyOrder(e.target.value)}>
              <option value="">Select</option>
              <option value="Y">Y</option>
              <option value="N">N</option>
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="followUpDate">Follow Up Date</label>
            <input
              id="followUpDate"
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
            />
          </div>
        </div>

        <div className="quotation-section">
          <h2 className="quotation-section-title">Line Items</h2>
          {renderItemsEditor(items, setItems, "Item")}
          <div className="form-field">
            <label htmlFor="itemsNote">Printed Note (appears above Basic Price on the quotation)</label>
            <textarea
              id="itemsNote"
              rows={2}
              value={itemsNote}
              onChange={(e) => setItemsNote(e.target.value)}
              placeholder="e.g. Note: 100 Nos. of CO2 cylinders (8 gm each) will be supplied locally"
            />
          </div>
          <div className="quotation-total">
            <span>Basic: {itemsBasic.toFixed(2)}</span>
            <span>GST: {itemsGst.toFixed(2)}</span>
            <span>Total: {itemsGrandTotal.toFixed(2)}</span>
          </div>
          <div className="quotation-total-words">Total in Words: {amountInWords(itemsGrandTotal)}</div>
        </div>

        <div className="quotation-section">
          <h2 className="quotation-section-title">Optional Accessories</h2>
          {renderItemsEditor(optionalItems, setOptionalItems, "Accessory")}
          <div className="form-field">
            <label htmlFor="optionalItemsNote">Printed Note (appears above Basic Price on the accessories block)</label>
            <textarea
              id="optionalItemsNote"
              rows={2}
              value={optionalItemsNote}
              onChange={(e) => setOptionalItemsNote(e.target.value)}
            />
          </div>
          <div className="quotation-total">
            <span>Basic: {optionalBasic.toFixed(2)}</span>
            <span>GST: {optionalGst.toFixed(2)}</span>
            <span>Total: {optionalGrandTotal.toFixed(2)}</span>
          </div>
          <div className="quotation-total-words">Total in Words: {amountInWords(optionalGrandTotal)}</div>
          {optionalItems.length === 0 && (
            <p className="quotation-empty-hint">
              This block prints only if you add at least one accessory above.
            </p>
          )}
        </div>

        <div className="form-field quotation-gst-field">
          <label htmlFor="gstPercent">GST %</label>
          <input
            id="gstPercent"
            type="number"
            min="0"
            value={gstPercent}
            onChange={(e) => setGstPercent(e.target.value)}
          />
        </div>

        <div className="quotation-section">
          <h2 className="quotation-section-title">Terms & Conditions</h2>

          <div className="quotation-bank-block">
            <div className="quotation-bank-title">Bank Details (fixed &mdash; prints in full on the quotation)</div>
            <div>Bank Name: {COMPANY_INFO.bank.bankName}</div>
            <div>Account Name: {COMPANY_INFO.bank.accountName}</div>
            <div>Branch Name: {COMPANY_INFO.bank.branchName}</div>
            <div>Address: {COMPANY_INFO.bank.address}</div>
            <div>MICR No.: {COMPANY_INFO.bank.micrNo}</div>
            <div>IFSC Code No.: {COMPANY_INFO.bank.ifscCode}</div>
            <div>Account Type: {COMPANY_INFO.bank.accountType}</div>
            <div>Account No.: {COMPANY_INFO.bank.accountNo}</div>
            <div>PAN No.: {COMPANY_INFO.panNo}</div>
            <div>GST No.: {COMPANY_INFO.gstNo}</div>
          </div>

          <div className="create-quotation-grid">
            <div className="form-field create-quotation-span-2">
              <label htmlFor="priceTerm">Price Term</label>
              <input
                id="priceTerm"
                value={terms.priceTerm}
                onChange={(e) => updateTermField("priceTerm", e.target.value)}
              />
            </div>

            <div className="form-field">
              <label htmlFor="validityDays">Validity (days)</label>
              <input
                id="validityDays"
                type="number"
                value={terms.validityDays}
                onChange={(e) => updateTermField("validityDays", e.target.value)}
              />
            </div>

            <div className="form-field">
              <label htmlFor="paymentMode">Payment Mode</label>
              <input
                id="paymentMode"
                value={terms.paymentMode}
                onChange={(e) => updateTermField("paymentMode", e.target.value)}
              />
            </div>

            <div className="form-field create-quotation-span-2">
              <label htmlFor="orderToBePlaced">Order to be Placed</label>
              <input
                id="orderToBePlaced"
                value={terms.orderToBePlaced}
                onChange={(e) => updateTermField("orderToBePlaced", e.target.value)}
              />
            </div>

            <div className="form-field create-quotation-span-2">
              <label htmlFor="payment">Payment</label>
              <input
                id="payment"
                value={terms.payment}
                onChange={(e) => updateTermField("payment", e.target.value)}
              />
            </div>

            <div className="form-field">
              <label htmlFor="delivery">Delivery</label>
              <input
                id="delivery"
                value={terms.delivery}
                onChange={(e) => updateTermField("delivery", e.target.value)}
              />
            </div>

            <div className="form-field create-quotation-span-2">
              <label htmlFor="warranty">Warranty</label>
              <textarea
                id="warranty"
                rows={2}
                value={terms.warranty}
                onChange={(e) => updateTermField("warranty", e.target.value)}
              />
            </div>

            <div className="form-field create-quotation-span-2">
              <label htmlFor="installation">Installation</label>
              <textarea
                id="installation"
                rows={2}
                value={terms.installation}
                onChange={(e) => updateTermField("installation", e.target.value)}
              />
            </div>

            <div className="form-field create-quotation-span-2">
              <label htmlFor="afterSalesService">After-Sales-Service</label>
              <textarea
                id="afterSalesService"
                rows={2}
                value={terms.afterSalesService}
                onChange={(e) => updateTermField("afterSalesService", e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="quotation-section">
          <h2 className="quotation-section-title">Signatory</h2>
          <div className="create-quotation-grid">
            <div className="form-field">
              <label htmlFor="signatoryName">Name</label>
              <input
                id="signatoryName"
                value={signatoryName}
                onChange={(e) => setSignatoryName(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label htmlFor="signatoryDesignation">Designation</label>
              <input
                id="signatoryDesignation"
                value={signatoryDesignation}
                onChange={(e) => setSignatoryDesignation(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label htmlFor="signatoryContact">Contact No.</label>
              <PhoneInput id="signatoryContact" value={signatoryContact} onChange={setSignatoryContact} />
            </div>
          </div>
        </div>

        <div className="quotation-section">
          <h2 className="quotation-section-title">Additional Fields</h2>
          {customFields.map((field, index) => (
            <div key={index} className="quotation-item-row">
              <div className="form-field">
                <label htmlFor={`customFieldLabel-${index}`}>Label</label>
                <input
                  id={`customFieldLabel-${index}`}
                  value={field.label}
                  onChange={(e) => updateCustomField(index, "label", e.target.value)}
                  placeholder="e.g. PO Number"
                />
              </div>
              <div className="form-field">
                <label htmlFor={`customFieldValue-${index}`}>Value</label>
                <input
                  id={`customFieldValue-${index}`}
                  value={field.value}
                  onChange={(e) => updateCustomField(index, "value", e.target.value)}
                  placeholder="Enter value"
                />
              </div>
              <button
                type="button"
                className="quotation-item-remove"
                onClick={() => removeCustomField(index)}
                aria-label="Remove field"
              >
                <X size={16} />
              </button>
            </div>
          ))}
          <button type="button" className="quotation-add-item" onClick={addCustomField}>
            + Add Field
          </button>
        </div>

        <div className="form-field">
          <label htmlFor="remarks">Remarks</label>
          <textarea
            id="remarks"
            rows={3}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Brief discussion"
          />
        </div>

        <div className="create-quotation-actions">
          {saveStatus === "error" && <span className="create-quotation-error">Could not save quotation.</span>}
          <button type="submit" className="btn-secondary" disabled={saveStatus === "saving"}>
            {saveStatus === "saving" ? "Saving..." : "Save Quotation"}
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={saveStatus === "saving"}
            onClick={handleGenerate}
          >
            {saveStatus === "saving" ? "Generating..." : "Generate"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateQuotation;
