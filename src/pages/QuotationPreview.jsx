import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import html2pdf from "html2pdf.js";
import { ArrowLeft, Printer, Download, Move, RotateCcw } from "lucide-react";
import { API_BASE, apiFetch, resolveAssetUrl } from "../api.js";
import { COMPANY_INFO, DEFAULT_ENCLOSURES } from "../companyInfo.js";
import { amountInWords } from "../utils/numberToWords.js";
import { renderLiteMarkdown } from "../utils/markdownLite.jsx";
import "./QuotationPreview.css";

function formatCurrency(amount) {
  return `₹${(Number(amount) || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function ordinalSuffix(day) {
  if (day >= 11 && day <= 13) return "th";
  switch (day % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

function joinWithAnd(list) {
  if (list.length === 0) return "";
  if (list.length === 1) return list[0];
  return `${list.slice(0, -1).join(", ")}, and ${list[list.length - 1]}`;
}

function collectInclusions(items) {
  const seen = new Set();
  const result = [];
  items.forEach((item) => {
    (item.standardInclusions || []).forEach((entry) => {
      if (!seen.has(entry)) {
        seen.add(entry);
        result.push(entry);
      }
    });
  });
  return result;
}

function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const day = d.getDate();
  const month = d.toLocaleDateString("en-GB", { month: "long" });
  return `${day}${ordinalSuffix(day)} ${month}, ${d.getFullYear()}`;
}

function DocHeader() {
  const [logoOk, setLogoOk] = useState(true);

  return (
    <div className="doc-header">
      {logoOk ? (
        <img
          src="/logo.png"
          alt={COMPANY_INFO.name}
          className="doc-logo-img"
          onError={() => setLogoOk(false)}
        />
      ) : (
        <div className="doc-brand">
          <span className="doc-brand-name">{COMPANY_INFO.brandName}</span>
          <span className="doc-brand-suffix">INTERNATIONAL</span>
          <div className="doc-brand-tagline">{COMPANY_INFO.tagline}</div>
        </div>
      )}
      <div className="doc-brand-contact">
        <div>{COMPANY_INFO.address}</div>
        <div>{COMPANY_INFO.phone}</div>
        <div>{COMPANY_INFO.email}</div>
        <div>{COMPANY_INFO.website}</div>
      </div>
    </div>
  );
}

function SignatureBlock({ quotation, stampMode, stampPosition, onMoveStamp }) {
  const [signatureOk, setSignatureOk] = useState(true);

  const handleDragStart = (e) => {
    if (!stampMode) return;
    e.preventDefault();
    e.stopPropagation();

    const pageEl = e.currentTarget.closest(".doc-page");
    if (!pageEl) return;
    const pageRect = pageEl.getBoundingClientRect();
    const imgRect = e.currentTarget.getBoundingClientRect();
    const grabOffsetX = e.clientX - imgRect.left;
    const grabOffsetY = e.clientY - imgRect.top;

    const handleMove = (moveEvent) => {
      onMoveStamp({
        x: moveEvent.clientX - pageRect.left - grabOffsetX,
        y: moveEvent.clientY - pageRect.top - grabOffsetY,
      });
    };
    const handleUp = () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
  };

  const stampStyle = stampPosition
    ? { position: "absolute", left: stampPosition.x, top: stampPosition.y }
    : undefined;

  return (
    <div className="doc-signature">
      <div>With Regards!</div>
      {signatureOk ? (
        <img
          src="/signature.png"
          alt=""
          className={`doc-signature-img${stampPosition ? " is-placed" : ""}${
            stampMode ? " is-editable" : ""
          }`}
          style={stampStyle}
          onError={() => setSignatureOk(false)}
          onMouseDown={handleDragStart}
          onClick={(e) => stampMode && e.stopPropagation()}
        />
      ) : (
        <div className="doc-signature-gap" />
      )}
      <div>{quotation.signatoryName || COMPANY_INFO.defaultSignatory.name}</div>
      <div>{quotation.signatoryDesignation || COMPANY_INFO.defaultSignatory.designation}</div>
      <div>Contact No. {quotation.signatoryContact || COMPANY_INFO.defaultSignatory.contactNo}</div>
      <div>For {COMPANY_INFO.name}</div>
      <div>Authorized Signatory</div>
    </div>
  );
}

function RecipientBlock({ quotation }) {
  return (
    <div className="doc-recipient">
      <div>To,</div>
      <div>
        {quotation.recipientDesignation} {quotation.customerName}
      </div>
      {quotation.recipientPosition && <div>{quotation.recipientPosition}</div>}
      {quotation.department && <div>{quotation.department}</div>}
      {quotation.instituteName && <div>{quotation.instituteName}</div>}
      {quotation.address &&
        quotation.address.split("\n").map((line, i) => <div key={i}>{line}</div>)}
    </div>
  );
}

function ItemsTable({ items, gstPercent, title, note }) {
  const includedItems = items.filter((item) => item.included !== false);
  const basic = includedItems.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  const gst = (basic * (Number(gstPercent) || 0)) / 100;
  const total = basic + gst;
  const inclusions = collectInclusions(items);

  return (
    <>
      {title && <div className="doc-table-title">{title}</div>}
      <table className="doc-table">
        <thead>
          <tr>
            <th className="col-part">Part No.</th>
            <th>Description</th>
            <th className="col-qty">Qty</th>
            <th className="col-price">Price in INR</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={index}>
              <td className="col-part">{item.partNo}</td>
              <td className="doc-description">
                <div className="doc-description-name">
                  {item.name}
                  {item.model ? ` (Model: ${item.model})` : ""}
                </div>
                {item.description && (
                  <div className="doc-description-body">{renderLiteMarkdown(item.description)}</div>
                )}
                {item.includesNote && <div className="doc-includes-note">{item.includesNote}</div>}
                {item.imageUrl && (
                  <img className="doc-item-image" src={resolveAssetUrl(item.imageUrl)} alt="" />
                )}
              </td>
              <td className="col-qty">
                {item.quantity == null || item.quantity === "" ? "" : String(item.quantity).padStart(2, "0")}
              </td>
              <td className="col-price">
                {item.included === false || item.unitPrice == null ? "" : formatCurrency(item.unitPrice)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {inclusions.length > 0 && (
        <div className="doc-inclusions">
          <div>Accessories for Function of the System is supplied with:</div>
          <ul>
            {inclusions.map((entry, i) => (
              <li key={i}>{entry}</li>
            ))}
          </ul>
        </div>
      )}
      {note && <div className="doc-section-note doc-section-note-top">Note: {note}</div>}
      <table className="doc-totals-table">
        <tbody>
          <tr>
            <td>Basic Price:</td>
            <td>{formatCurrency(basic)}</td>
          </tr>
          <tr>
            <td>GST @ {gstPercent}%:</td>
            <td>{formatCurrency(gst)}</td>
          </tr>
          <tr>
            <td>Total Price:</td>
            <td>{formatCurrency(total)}</td>
          </tr>
        </tbody>
      </table>
      <div className="doc-total-words">Total in Words: {amountInWords(total)}</div>
    </>
  );
}

function QuotationPreview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quotation, setQuotation] = useState(null);
  const [loadStatus, setLoadStatus] = useState("loading");
  const printRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [stampMode, setStampMode] = useState(false);
  const [stampPositions, setStampPositions] = useState({});

  const placeStamp = (pageKey) => (e) => {
    if (!stampMode) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setStampPositions((prev) => ({
      ...prev,
      [pageKey]: { x: e.clientX - rect.left - 41, y: e.clientY - rect.top - 37 },
    }));
  };

  const moveStamp = (pageKey) => (position) => {
    setStampPositions((prev) => ({ ...prev, [pageKey]: position }));
  };

  const resetStampPositions = () => setStampPositions({});

  useEffect(() => {
    apiFetch(`${API_BASE}/api/quotations/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load quotation");
        return res.json();
      })
      .then((data) => {
        setQuotation(data.quotation);
        setLoadStatus("ready");
      })
      .catch(() => setLoadStatus("error"));
  }, [id]);

  const subjectLine = quotation?.subject || "";
  const salutationName = useMemo(() => {
    if (quotation?.salutationName) return quotation.salutationName;
    if (!quotation?.customerName) return "Sir/Madam";
    return quotation.customerName.trim().split(/\s+/)[0];
  }, [quotation]);

  const handlePrint = () => window.print();

  const handleDownload = async () => {
    if (!printRef.current) return;
    setDownloading(true);
    try {
      await html2pdf()
        .set({
          margin: 0,
          filename: `Quotation-${quotation.refNo || quotation._id}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
          pagebreak: { mode: ["css", "legacy"] },
        })
        .from(printRef.current)
        .save();
    } finally {
      setDownloading(false);
    }
  };

  if (loadStatus === "loading") {
    return <div className="quotation-preview-status">Loading...</div>;
  }

  if (loadStatus === "error" || !quotation) {
    return <div className="quotation-preview-status">Could not load this quotation.</div>;
  }

  const items = quotation.items || [];
  const optionalItems = quotation.optionalItems || [];
  const terms = quotation.terms || {};

  return (
    <div className="quotation-preview-page">
      <div className="quotation-preview-toolbar no-print">
        <button
          type="button"
          className="btn-secondary"
          onClick={() => navigate(`/sales/quotations/new?editId=${quotation._id}`)}
        >
          <ArrowLeft size={16} />
          <span>Back to Edit</span>
        </button>
        <div className="quotation-preview-toolbar-actions">
          <button
            type="button"
            className={`btn-secondary${stampMode ? " is-active" : ""}`}
            onClick={() => setStampMode((v) => !v)}
          >
            <Move size={16} />
            <span>{stampMode ? "Done Placing Stamp" : "Move Stamp"}</span>
          </button>
          {Object.keys(stampPositions).length > 0 && (
            <button type="button" className="btn-secondary" onClick={resetStampPositions}>
              <RotateCcw size={16} />
              <span>Reset Stamp</span>
            </button>
          )}
          <button type="button" className="btn-secondary" onClick={handlePrint}>
            <Printer size={16} />
            <span>Print / Save as PDF</span>
          </button>
          <button type="button" className="btn-primary" onClick={handleDownload} disabled={downloading}>
            <Download size={16} />
            <span>{downloading ? "Preparing..." : "Download PDF"}</span>
          </button>
        </div>
      </div>

      {stampMode && (
        <div className="stamp-edit-hint no-print">
          Click anywhere on a page to place the stamp there, or drag the stamp to fine-tune its spot.
        </div>
      )}

      <div ref={printRef}>
        <div
          className={`doc-page${stampMode ? " stamp-edit-mode" : ""}`}
          onClick={placeStamp("cover")}
        >
          <DocHeader />
          <div className="doc-meta">
            <div>Ref: {quotation.refNo}</div>
            <div>Date: {formatDate(quotation.date)}</div>
          </div>
          <RecipientBlock quotation={quotation} />
          <div className="doc-subject">
            Sub: Quotation for <strong>{subjectLine}</strong>
          </div>
          <div className="doc-body">
            <p>Dear {quotation.recipientDesignation} {salutationName},</p>
            {quotation.coverLetterBody ? (
              quotation.coverLetterBody.split("\n").map((line, i) => (line.trim() ? <p key={i}>{line}</p> : null))
            ) : (
              <>
                {quotation.salesExecutive && (
                  <p>
                    We sincerely thank you for the courtesy extended to our Sales and Marketing Executive{" "}
                    {quotation.salesExecutive} during their discussion with you regarding the {subjectLine}.
                  </p>
                )}
                <p>
                  In this connection, we are pleased to enclose the Quotation for the {subjectLine}
                  {quotation.manufacturer ? `, manufactured by our principal M/s. ${quotation.manufacturer}` : ""}.
                </p>
                <p>
                  {joinWithAnd((quotation.enclosures?.length ? quotation.enclosures : DEFAULT_ENCLOSURES))} are
                  also attached for your kind reference.
                </p>
              </>
            )}
            <p>Please let us know if you require any additional information.</p>
          </div>
          <SignatureBlock
            quotation={quotation}
            stampMode={stampMode}
            stampPosition={stampPositions.cover}
            onMoveStamp={moveStamp("cover")}
          />
        </div>

        <div
          className={`doc-page${stampMode ? " stamp-edit-mode" : ""}`}
          onClick={placeStamp("quotation")}
        >
          <DocHeader />
          <div className="doc-meta">
            <div>Ref: {quotation.refNo}</div>
            <div>Date: {formatDate(quotation.date)}</div>
          </div>
          <div className="doc-page-title">QUOTATION</div>
          <RecipientBlock quotation={quotation} />
          <div className="doc-subject">
            Sub: Quotation for <strong>{subjectLine}</strong>
          </div>
          {quotation.manufacturer && (
            <div className="doc-ex-messers">Ex-Messer's {quotation.manufacturer}</div>
          )}
          <ItemsTable items={items} gstPercent={quotation.gstPercent} note={quotation.itemsNote} />
          <SignatureBlock
            quotation={quotation}
            stampMode={stampMode}
            stampPosition={stampPositions.quotation}
            onMoveStamp={moveStamp("quotation")}
          />
        </div>

        {optionalItems.length > 0 && (
          <div
            className={`doc-page${stampMode ? " stamp-edit-mode" : ""}`}
            onClick={placeStamp("optional")}
          >
            <DocHeader />
            <ItemsTable
              items={optionalItems}
              gstPercent={quotation.gstPercent}
              title="OPTIONAL ACCESSORIES:"
              note={quotation.optionalItemsNote}
            />
            <SignatureBlock
              quotation={quotation}
              stampMode={stampMode}
              stampPosition={stampPositions.optional}
              onMoveStamp={moveStamp("optional")}
            />
          </div>
        )}

        <div
          className={`doc-page doc-page-last${stampMode ? " stamp-edit-mode" : ""}`}
          onClick={placeStamp("terms")}
        >
          <DocHeader />
          <div className="doc-page-title">TERMS AND CONDITIONS:</div>
          <table className="doc-terms-table">
            <tbody>
              <tr>
                <td className="doc-terms-label">Price:</td>
                <td>{terms.priceTerm}</td>
              </tr>
              <tr>
                <td className="doc-terms-label">Validity:</td>
                <td>Quotation is valid for {terms.validityDays} days from the Quotation Date</td>
              </tr>
              <tr>
                <td className="doc-terms-label">Order to be Placed:</td>
                <td>{terms.orderToBePlaced}</td>
              </tr>
              <tr>
                <td className="doc-terms-label">Payment:</td>
                <td>{terms.payment}</td>
              </tr>
              <tr>
                <td className="doc-terms-label">Payment Mode:</td>
                <td>{terms.paymentMode}</td>
              </tr>
              <tr>
                <td className="doc-terms-label">Bank Details:</td>
                <td>
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
                </td>
              </tr>
              <tr>
                <td className="doc-terms-label">Delivery:</td>
                <td>{terms.delivery}</td>
              </tr>
              <tr>
                <td className="doc-terms-label">Warranty:</td>
                <td>{terms.warranty}</td>
              </tr>
              <tr>
                <td className="doc-terms-label">Installation:</td>
                <td>{terms.installation}</td>
              </tr>
              <tr>
                <td className="doc-terms-label">After-Sales-Service:</td>
                <td>{terms.afterSalesService}</td>
              </tr>
              {(quotation.customFields || [])
                .filter((field) => field.label || field.value)
                .map((field, index) => (
                  <tr key={index}>
                    <td className="doc-terms-label">{field.label}:</td>
                    <td>{field.value}</td>
                  </tr>
                ))}
            </tbody>
          </table>
          <SignatureBlock
            quotation={quotation}
            stampMode={stampMode}
            stampPosition={stampPositions.terms}
            onMoveStamp={moveStamp("terms")}
          />
        </div>
      </div>
    </div>
  );
}

export default QuotationPreview;
