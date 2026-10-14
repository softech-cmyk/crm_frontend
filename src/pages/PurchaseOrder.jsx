import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { API_BASE, apiFetch, resolveAssetUrl } from "../api.js";
import ImportButton from "../components/ImportButton.jsx";
import "./PurchaseOrder.css";

const IMPORT_COLUMNS = [
  { header: "Sr", field: "sr" },
  { header: "Model", field: "model" },
  { header: "Instrument Name", field: "instrumentName" },
  { header: "PO/Quotation No.", field: "poQuotationNo" },
  { header: "Purchase Order Date", field: "poDate", date: true },
  { header: "To Be Supplied By Date", field: "toBeSuppliedByDate", date: true },
  { header: "Installation Date", field: "installationDate", date: true },
  { header: "Installed By", field: "installedBy" },
  { header: "Fin. Year", field: "finYear" },
  { header: "Institute", field: "institute" },
  { header: "Contact Person", field: "contactPerson" },
  { header: "Email Id", field: "emailId" },
  { header: "Phone No", field: "phoneNo" },
  { header: "Invoice No.", field: "invoiceNo" },
  { header: "Invoice Date", field: "invoiceDate", date: true },
  { header: "Basic", field: "basic" },
  { header: "GST", field: "gst" },
  { header: "Total", field: "total" },
  { header: "Payment Received (Y/N)", field: "paymentReceived" },
  { header: "Remarks", field: "remarks" },
];

const DOCUMENT_FIELDS = [
  { key: "installationCertificate", label: "Installation Certificate Upload" },
  { key: "performanceCertificateUpload", label: "Performance Certificate Upload" },
  { key: "poWithCompanyStamp", label: "PDF of Purchase Order including company stamp" },
  { key: "dpExtensionPdf", label: "DP Extension PDF" },
  { key: "installationReportPdf", label: "Installation Report PDF" },
  { key: "performanceCertificatePdf", label: "Performance Certificate PDF" },
  { key: "consigneeReceiptCertificatePdf", label: "Consignee Receipt & Acceptance Certificate PDF" },
];

function PurchaseOrder() {
  const [records, setRecords] = useState([]);
  const [sr, setSr] = useState("");
  const [model, setModel] = useState("");
  const [instrumentName, setInstrumentName] = useState("");
  const [poQuotationNo, setPoQuotationNo] = useState("");
  const [poDate, setPoDate] = useState("");
  const [toBeSuppliedByDate, setToBeSuppliedByDate] = useState("");
  const [installationDate, setInstallationDate] = useState("");
  const [installedBy, setInstalledBy] = useState("");
  const [finYear, setFinYear] = useState("");
  const [institute, setInstitute] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [emailId, setEmailId] = useState("");
  const [phoneNo, setPhoneNo] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [basic, setBasic] = useState("");
  const [gst, setGst] = useState("");
  const [total, setTotal] = useState("");
  const [paymentReceived, setPaymentReceived] = useState("");
  const [remarks, setRemarks] = useState("");
  const [documents, setDocuments] = useState({});
  const [uploadingKeys, setUploadingKeys] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [saveStatus, setSaveStatus] = useState("idle");

  const loadRecords = () => {
    apiFetch(`${API_BASE}/api/purchase-orders`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load records");
        return res.json();
      })
      .then((data) => setRecords(data.purchaseOrders || []))
      .catch(() => {});
  };

  useEffect(loadRecords, []);

  const handleDocumentUpload = async (key, file) => {
    if (!file) return;
    setUploadingKeys((prev) => ({ ...prev, [key]: true }));
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await apiFetch(`${API_BASE}/api/uploads/pdf`, { method: "POST", body: formData });
      if (!res.ok) throw new Error("Failed to upload file");
      const data = await res.json();
      setDocuments((prev) => ({ ...prev, [key]: { url: data.url, fileName: data.fileName } }));
    } catch (err) {
      // ignore
    } finally {
      setUploadingKeys((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleDocumentRemove = (key) => {
    setDocuments((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setSr("");
    setModel("");
    setInstrumentName("");
    setPoQuotationNo("");
    setPoDate("");
    setToBeSuppliedByDate("");
    setInstallationDate("");
    setInstalledBy("");
    setFinYear("");
    setInstitute("");
    setContactPerson("");
    setEmailId("");
    setPhoneNo("");
    setInvoiceNo("");
    setInvoiceDate("");
    setBasic("");
    setGst("");
    setTotal("");
    setPaymentReceived("");
    setRemarks("");
    setDocuments({});
    setSaveStatus("idle");
  };

  const handleDelete = async (record) => {
    if (!window.confirm("Delete this record?")) return;
    try {
      const res = await apiFetch(`${API_BASE}/api/purchase-orders/${record._id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete record");
      if (editingId === record._id) handleCancelEdit();
      loadRecords();
    } catch (err) {
      // ignore
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveStatus("saving");
    try {
      const url = editingId
        ? `${API_BASE}/api/purchase-orders/${editingId}`
        : `${API_BASE}/api/purchase-orders`;
      const res = await apiFetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sr,
          model,
          instrumentName,
          poQuotationNo,
          poDate,
          toBeSuppliedByDate,
          installationDate,
          installedBy,
          finYear,
          institute,
          contactPerson,
          emailId,
          phoneNo,
          invoiceNo,
          invoiceDate,
          basic,
          gst,
          total,
          paymentReceived,
          remarks,
          documents,
        }),
      });
      if (!res.ok) throw new Error("Failed to save record");
      setEditingId(null);
      setSr("");
      setModel("");
      setInstrumentName("");
      setPoQuotationNo("");
      setPoDate("");
      setToBeSuppliedByDate("");
      setInstallationDate("");
      setInstalledBy("");
      setFinYear("");
      setInstitute("");
      setContactPerson("");
      setEmailId("");
      setPhoneNo("");
      setInvoiceNo("");
      setInvoiceDate("");
      setBasic("");
      setGst("");
      setTotal("");
      setPaymentReceived("");
      setRemarks("");
      setDocuments({});
      setSaveStatus("idle");
      loadRecords();
    } catch (err) {
      setSaveStatus("error");
    }
  };

  return (
    <div className="purchase-order-page">
      <div className="page-title-row">
        <h1 className="purchase-order-title">Purchase Order</h1>
        <ImportButton columns={IMPORT_COLUMNS} endpoint="/api/purchase-orders/import" onImported={loadRecords} />
      </div>

      <form className="purchase-order-form" onSubmit={handleSubmit}>
        <div className="form-field">
          <label htmlFor="purchaseOrderSr">Sr</label>
          <input
            id="purchaseOrderSr"
            value={sr}
            onChange={(e) => setSr(e.target.value)}
            placeholder="Enter Sr"
          />
        </div>
        <div className="form-field">
          <label htmlFor="purchaseOrderModel">Model</label>
          <input
            id="purchaseOrderModel"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="Enter model"
          />
        </div>
        <div className="form-field">
          <label htmlFor="purchaseOrderInstrumentName">Instrument Name</label>
          <input
            id="purchaseOrderInstrumentName"
            value={instrumentName}
            onChange={(e) => setInstrumentName(e.target.value)}
            placeholder="Enter instrument name"
          />
        </div>
        <div className="form-field">
          <label htmlFor="purchaseOrderPoQuotationNo">PO/Quotation No.</label>
          <input
            id="purchaseOrderPoQuotationNo"
            value={poQuotationNo}
            onChange={(e) => setPoQuotationNo(e.target.value)}
            placeholder="Enter PO/Quotation No."
          />
        </div>
        <div className="form-field">
          <label htmlFor="purchaseOrderPoDate">Purchase Order Date</label>
          <input
            id="purchaseOrderPoDate"
            type="date"
            value={poDate}
            onChange={(e) => setPoDate(e.target.value)}
          />
        </div>
        <div className="form-field">
          <label htmlFor="purchaseOrderToBeSuppliedByDate">To Be Supplied By Date</label>
          <input
            id="purchaseOrderToBeSuppliedByDate"
            type="date"
            value={toBeSuppliedByDate}
            onChange={(e) => setToBeSuppliedByDate(e.target.value)}
          />
        </div>
        <div className="form-field">
          <label htmlFor="purchaseOrderInstallationDate">Installation Date</label>
          <input
            id="purchaseOrderInstallationDate"
            type="date"
            value={installationDate}
            onChange={(e) => setInstallationDate(e.target.value)}
          />
        </div>
        <div className="form-field">
          <label htmlFor="purchaseOrderInstalledBy">Installed By</label>
          <input
            id="purchaseOrderInstalledBy"
            value={installedBy}
            onChange={(e) => setInstalledBy(e.target.value)}
            placeholder="Enter installed by"
          />
        </div>
        <div className="form-field">
          <label htmlFor="purchaseOrderFinYear">Fin. Year</label>
          <input
            id="purchaseOrderFinYear"
            value={finYear}
            onChange={(e) => setFinYear(e.target.value)}
            placeholder="Enter fin. year"
          />
        </div>
        <div className="form-field">
          <label htmlFor="purchaseOrderInstitute">Institute</label>
          <input
            id="purchaseOrderInstitute"
            value={institute}
            onChange={(e) => setInstitute(e.target.value)}
            placeholder="Enter institute"
          />
        </div>
        <div className="form-field">
          <label htmlFor="purchaseOrderContactPerson">Contact Person</label>
          <input
            id="purchaseOrderContactPerson"
            value={contactPerson}
            onChange={(e) => setContactPerson(e.target.value)}
            placeholder="Enter contact person"
          />
        </div>
        <div className="form-field">
          <label htmlFor="purchaseOrderEmailId">Email Id</label>
          <input
            id="purchaseOrderEmailId"
            type="email"
            value={emailId}
            onChange={(e) => setEmailId(e.target.value)}
            placeholder="Enter email id"
          />
        </div>
        <div className="form-field">
          <label htmlFor="purchaseOrderPhoneNo">Phone No</label>
          <input
            id="purchaseOrderPhoneNo"
            type="tel"
            value={phoneNo}
            onChange={(e) => setPhoneNo(e.target.value)}
            placeholder="Enter phone no"
          />
        </div>
        <div className="form-field">
          <label htmlFor="purchaseOrderInvoiceNo">Invoice No.</label>
          <input
            id="purchaseOrderInvoiceNo"
            value={invoiceNo}
            onChange={(e) => setInvoiceNo(e.target.value)}
            placeholder="Enter invoice no."
          />
        </div>
        <div className="form-field">
          <label htmlFor="purchaseOrderInvoiceDate">Invoice Date</label>
          <input
            id="purchaseOrderInvoiceDate"
            type="date"
            value={invoiceDate}
            onChange={(e) => setInvoiceDate(e.target.value)}
          />
        </div>
        <div className="form-field">
          <label htmlFor="purchaseOrderBasic">Basic</label>
          <input
            id="purchaseOrderBasic"
            value={basic}
            onChange={(e) => setBasic(e.target.value)}
            placeholder="Enter basic"
          />
        </div>
        <div className="form-field">
          <label htmlFor="purchaseOrderGst">GST</label>
          <input
            id="purchaseOrderGst"
            value={gst}
            onChange={(e) => setGst(e.target.value)}
            placeholder="Enter GST amount"
          />
        </div>
        <div className="form-field">
          <label htmlFor="purchaseOrderTotal">Total</label>
          <input
            id="purchaseOrderTotal"
            value={total}
            onChange={(e) => setTotal(e.target.value)}
            placeholder="Enter total"
          />
        </div>
        <div className="form-field">
          <label htmlFor="purchaseOrderPaymentReceived">Payment Received (Y/N)</label>
          <select
            id="purchaseOrderPaymentReceived"
            value={paymentReceived}
            onChange={(e) => setPaymentReceived(e.target.value)}
          >
            <option value="">Select</option>
            <option value="Y">Y</option>
            <option value="N">N</option>
          </select>
        </div>
        <div className="form-field">
          <label htmlFor="purchaseOrderRemarks">Remarks</label>
          <input
            id="purchaseOrderRemarks"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Enter remarks"
          />
        </div>

        <div className="purchase-order-documents">
          <h2 className="purchase-order-documents-title">Documents</h2>
          <div className="purchase-order-documents-grid">
            {DOCUMENT_FIELDS.map(({ key, label }) => {
              const doc = documents[key];
              const isUploading = !!uploadingKeys[key];
              return (
                <div className="po-doc-box" key={key}>
                  <label
                    className={`po-doc-box-tile ${doc ? "has-file" : ""}`}
                    htmlFor={`poDoc-${key}`}
                  >
                    <span className="po-doc-box-status">
                      {isUploading ? "Uploading..." : doc ? "Uploaded" : "Upload PDF"}
                    </span>
                    <input
                      id={`poDoc-${key}`}
                      type="file"
                      accept="application/pdf"
                      className="po-doc-box-input"
                      onChange={(e) => handleDocumentUpload(key, e.target.files?.[0])}
                    />
                  </label>
                  <span className="po-doc-box-label">{label}</span>
                  {doc && (
                    <div className="po-doc-box-actions">
                      <a href={resolveAssetUrl(doc.url)} target="_blank" rel="noreferrer">
                        View
                      </a>
                      <button type="button" onClick={() => handleDocumentRemove(key)}>
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="purchase-order-form-actions">
          {saveStatus === "error" && (
            <span className="purchase-order-error">Could not save record.</span>
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

      {records.length === 0 && <p className="purchase-order-empty">No records yet.</p>}

      {records.length > 0 && (
        <div className="purchase-order-table">
          <div className="purchase-order-row purchase-order-head">
            <span>Sr</span>
            <span>Model</span>
            <span>Instrument Name</span>
            <span>PO/Quotation No.</span>
            <span>Purchase Order Date</span>
            <span>To Be Supplied By Date</span>
            <span>Installation Date</span>
            <span>Installed By</span>
            <span>Fin. Year</span>
            <span>Institute</span>
            <span>Contact Person</span>
            <span>Email Id</span>
            <span>Phone No</span>
            <span>Invoice No.</span>
            <span>Invoice Date</span>
            <span>Basic</span>
            <span>GST</span>
            <span>Total</span>
            <span>Payment Received (Y/N)</span>
            <span>Remarks</span>
            <span></span>
          </div>
          {records.map((record) => (
            <div
              key={record._id}
              className={`purchase-order-row ${editingId === record._id ? "editing" : ""}`}
            >
              <span>{record.sr || "-"}</span>
              <span>{record.model || "-"}</span>
              <span>{record.instrumentName || "-"}</span>
              <span>{record.poQuotationNo || "-"}</span>
              <span>{record.poDate || "-"}</span>
              <span>{record.toBeSuppliedByDate || "-"}</span>
              <span>{record.installationDate || "-"}</span>
              <span>{record.installedBy || "-"}</span>
              <span>{record.finYear || "-"}</span>
              <span>{record.institute || "-"}</span>
              <span>{record.contactPerson || "-"}</span>
              <span>{record.emailId || "-"}</span>
              <span>{record.phoneNo || "-"}</span>
              <span>{record.invoiceNo || "-"}</span>
              <span>{record.invoiceDate || "-"}</span>
              <span>{record.basic || "-"}</span>
              <span>{record.gst || "-"}</span>
              <span>{record.total || "-"}</span>
              <span>{record.paymentReceived || "-"}</span>
              <span>{record.remarks || "-"}</span>
              <span className="purchase-order-row-actions">
                <button
                  type="button"
                  className="purchase-order-delete-btn"
                  onClick={() => handleDelete(record)}
                  aria-label="Delete record"
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

export default PurchaseOrder;
