import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { flushSync } from "react-dom";
import html2pdf from "html2pdf.js";
import { ArrowLeft, FileDown, Plus, Save, Trash2, Upload } from "lucide-react";
import AmcSupportPdf from "./AmcSupportPdf.jsx";
import { toPrintableSignature } from "../utils/printableSignature.js";
import { API_BASE, apiFetch } from "../api.js";
import "./AmcSupport.css";

let nextScheduleRowId = 1;

function createScheduleRow() {
  return {
    id: nextScheduleRowId++,
    machineName: "",
    quantity: "",
    unit: "",
    rate: "",
  };
}

function getRowAmount(row) {
  const quantity = Number(row.quantity) || 0;
  const rate = Number(row.rate) || 0;
  return quantity * rate;
}

function formatAmount(value) {
  return value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function PictureImport({ value, onChange, alt, showPreview = true }) {
  const inputRef = useRef(null);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result);
    reader.readAsDataURL(file);
  };

  return (
    <div className="amc-support-signatory-pic">
      {showPreview && value && (
        <img src={value} alt={alt} className="amc-support-signatory-preview" />
      )}
      <button
        type="button"
        className="amc-support-pic-btn"
        onClick={() => inputRef.current?.click()}
      >
        <Upload size={14} />
        {value ? "Change picture" : "Import picture"}
      </button>
      {value && (
        <button
          type="button"
          className="amc-support-pic-btn"
          onClick={() => onChange("")}
          aria-label={`Remove ${alt.toLowerCase()} picture`}
        >
          <Trash2 size={14} />
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleFileChange} />
    </div>
  );
}

function SignaturePad({ value, onChange, label }) {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef(null);
  const emittedValueRef = useRef(value);
  const valueRef = useRef(value);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const paintValue = (dataUrl) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (!dataUrl) return;
    const image = new Image();
    image.onload = () => {
      const scale = Math.min(canvas.width / image.width, canvas.height / image.height);
      const width = image.width * scale;
      const height = image.height * scale;
      context.drawImage(
        image,
        (canvas.width - width) / 2,
        (canvas.height - height) / 2,
        width,
        height
      );
    };
    image.src = dataUrl;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const resize = () => {
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.round(canvas.clientWidth * ratio);
      canvas.height = Math.round(canvas.clientHeight * ratio);
      paintValue(valueRef.current);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (value === emittedValueRef.current) return;
    emittedValueRef.current = value;
    paintValue(value);
  }, [value]);

  const getPoint = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const handlePointerDown = (event) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    drawingRef.current = true;
    lastPointRef.current = getPoint(event);
  };

  const handlePointerMove = (event) => {
    if (!drawingRef.current) return;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    const point = getPoint(event);
    const last = lastPointRef.current;
    context.strokeStyle = "#ffffff";
    context.lineWidth = 2 * (window.devicePixelRatio || 1);
    context.lineCap = "round";
    context.lineJoin = "round";
    context.beginPath();
    context.moveTo(last.x, last.y);
    context.lineTo(point.x, point.y);
    context.stroke();
    lastPointRef.current = point;
  };

  const handlePointerUp = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const dataUrl = canvasRef.current.toDataURL("image/png");
    emittedValueRef.current = dataUrl;
    onChange(dataUrl);
  };

  return (
    <div className="amc-support-sign-box">
      <canvas
        ref={canvasRef}
        className="amc-support-sign-canvas"
        aria-label={`${label} signature pad`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
      {!value && <span className="amc-support-sign-hint">Sign here with the mouse</span>}
    </div>
  );
}

function AmcSupport() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id || id === "new";
  const [loadStatus, setLoadStatus] = useState(isNew ? "ready" : "loading");
  const [saveStatus, setSaveStatus] = useState("idle");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [date, setDate] = useState("");
  const [subject, setSubject] = useState("");
  const [deadline, setDeadline] = useState("");
  const [emdAmount, setEmdAmount] = useState("");
  const [emdMode, setEmdMode] = useState("");
  const [emdInFavourOf, setEmdInFavourOf] = useState("");
  const [securityDeposit, setSecurityDeposit] = useState("");
  const [emdForfeiture, setEmdForfeiture] = useState("");
  const [rejectionClause, setRejectionClause] = useState("");
  const [signatory, setSignatory] = useState("");
  const [handoverCondition, setHandoverCondition] = useState("");
  const [servicingFrequency, setServicingFrequency] = useState("");
  const [bdsFrequency, setBdsFrequency] = useState("");
  const [coverage, setCoverage] = useState("");
  const [breakdownResponse, setBreakdownResponse] = useState("");
  const [breakdownPenalty, setBreakdownPenalty] = useState("");
  const [serviceUnitPenalty, setServiceUnitPenalty] = useState("");
  const [technicians, setTechnicians] = useState("");
  const [helpers, setHelpers] = useState("");
  const [payment, setPayment] = useState("");
  const [renewal, setRenewal] = useState("");
  const [termination, setTermination] = useState("");
  const [signatoryPic, setSignatoryPic] = useState("");
  const [contractorName, setContractorName] = useState("");
  const [contractorSignature, setContractorSignature] = useState("");
  const [executiveEngineerName, setExecutiveEngineerName] = useState("");
  const [executiveEngineerSignature, setExecutiveEngineerSignature] = useState("");
  const [attentionNote, setAttentionNote] = useState("");
  const [scheduleRows, setScheduleRows] = useState(() => [createScheduleRow()]);

  const updateScheduleRow = (id, field, value) => {
    setScheduleRows((rows) =>
      rows.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    );
  };

  const addScheduleRow = () => setScheduleRows((rows) => [...rows, createScheduleRow()]);

  const removeScheduleRow = (id) =>
    setScheduleRows((rows) => (rows.length > 1 ? rows.filter((row) => row.id !== id) : rows));

  const scheduleTotal = scheduleRows.reduce((sum, row) => sum + getRowAmount(row), 0);
  const pdfRef = useRef(null);
  const [pdfSignatures, setPdfSignatures] = useState({
    signatory: "",
    contractor: "",
    executiveEngineer: "",
  });
  const [pdfStatus, setPdfStatus] = useState("idle");

  useEffect(() => {
    if (isNew) return;
    let cancelled = false;
    setLoadStatus("loading");
    apiFetch(`${API_BASE}/api/amc-support/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load AMC Support entry");
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        const entry = data.amcSupport;
        setReferenceNumber(entry.referenceNumber || "");
        setDate(entry.date || "");
        setSubject(entry.subject || "");
        setDeadline(entry.deadline || "");
        setEmdAmount(entry.emdAmount || "");
        setEmdMode(entry.emdMode || "");
        setEmdInFavourOf(entry.emdInFavourOf || "");
        setSecurityDeposit(entry.securityDeposit || "");
        setEmdForfeiture(entry.emdForfeiture || "");
        setRejectionClause(entry.rejectionClause || "");
        setSignatory(entry.signatory || "");
        setSignatoryPic(entry.signatoryPic || "");
        setHandoverCondition(entry.handoverCondition || "");
        setServicingFrequency(entry.servicingFrequency || "");
        setBdsFrequency(entry.bdsFrequency || "");
        setCoverage(entry.coverage || "");
        setBreakdownResponse(entry.breakdownResponse || "");
        setBreakdownPenalty(entry.breakdownPenalty || "");
        setServiceUnitPenalty(entry.serviceUnitPenalty || "");
        setTechnicians(entry.technicians || "");
        setHelpers(entry.helpers || "");
        setPayment(entry.payment || "");
        setRenewal(entry.renewal || "");
        setTermination(entry.termination || "");
        setAttentionNote(entry.attentionNote || "");
        setContractorName(entry.contractorName || "");
        setContractorSignature(entry.contractorSignature || "");
        setExecutiveEngineerName(entry.executiveEngineerName || "");
        setExecutiveEngineerSignature(entry.executiveEngineerSignature || "");
        setScheduleRows(
          entry.scheduleRows && entry.scheduleRows.length > 0
            ? entry.scheduleRows.map((row) => ({
                id: nextScheduleRowId++,
                machineName: row.machineName || "",
                quantity: row.quantity || "",
                unit: row.unit || "",
                rate: row.rate || "",
              }))
            : [createScheduleRow()]
        );
        setLoadStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setLoadStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [id, isNew]);

  const handleSave = async () => {
    setSaveStatus("saving");
    try {
      const payload = {
        referenceNumber,
        date,
        subject,
        deadline,
        emdAmount,
        emdMode,
        emdInFavourOf,
        securityDeposit,
        emdForfeiture,
        rejectionClause,
        signatory,
        signatoryPic,
        handoverCondition,
        servicingFrequency,
        bdsFrequency,
        coverage,
        breakdownResponse,
        breakdownPenalty,
        serviceUnitPenalty,
        technicians,
        helpers,
        payment,
        renewal,
        termination,
        attentionNote,
        contractorName,
        contractorSignature,
        executiveEngineerName,
        executiveEngineerSignature,
        scheduleRows: scheduleRows.map(({ machineName, quantity, unit, rate }) => ({
          machineName,
          quantity,
          unit,
          rate,
        })),
      };
      const url = isNew ? `${API_BASE}/api/amc-support` : `${API_BASE}/api/amc-support/${id}`;
      const res = await apiFetch(url, {
        method: isNew ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to save AMC Support entry");
      const data = await res.json();
      setSaveStatus("idle");
      if (isNew) navigate(`/support/amc/${data.amcSupport._id}`, { replace: true });
    } catch (err) {
      setSaveStatus("error");
    }
  };

  const pdfData = {
    referenceNumber,
    date,
    subject,
    deadline,
    emdAmount,
    emdMode,
    emdInFavourOf,
    securityDeposit,
    emdForfeiture,
    rejectionClause,
    signatory,
    handoverCondition,
    servicingFrequency,
    bdsFrequency,
    coverage,
    breakdownResponse,
    breakdownPenalty,
    serviceUnitPenalty,
    technicians,
    helpers,
    payment,
    renewal,
    termination,
    attentionNote,
    contractorName,
    executiveEngineerName,
    scheduleRows: scheduleRows.map((row) => ({ ...row, amount: getRowAmount(row) })),
    scheduleTotal,
  };

  const handleGeneratePdf = async () => {
    setPdfStatus("generating");
    try {
      const [signatoryImage, contractorImage, executiveEngineerImage] = await Promise.all([
        toPrintableSignature(signatoryPic),
        toPrintableSignature(contractorSignature),
        toPrintableSignature(executiveEngineerSignature),
      ]);
      flushSync(() =>
        setPdfSignatures({
          signatory: signatoryImage,
          contractor: contractorImage,
          executiveEngineer: executiveEngineerImage,
        })
      );
      const fileName = (referenceNumber.trim() || date || "document").replace(
        /[\\/:*?"<>|]/g,
        "-"
      );
      await html2pdf()
        .set({
          margin: [12, 12, 12, 12],
          filename: `AMC-${fileName}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
          pagebreak: { mode: ["css", "legacy"], avoid: ["tr", ".amc-pdf-signatures", ".amc-pdf-signatory"] },
        })
        .from(pdfRef.current)
        .save();
      setPdfStatus("idle");
    } catch {
      setPdfStatus("error");
    }
  };

  if (loadStatus === "loading") {
    return <div className="amc-support-page">Loading...</div>;
  }

  if (loadStatus === "error") {
    return (
      <div className="amc-support-page">
        <p>Could not load this AMC Support entry.</p>
      </div>
    );
  }

  return (
    <div className="amc-support-page">
      <button type="button" className="amc-support-back-btn" onClick={() => navigate("/support/amc")}>
        <ArrowLeft size={16} />
        <span>AMC Support</span>
      </button>

      <div className="amc-support-header">
        <h1 className="amc-support-title">{isNew ? "New AMC Support" : "Edit AMC Support"}</h1>
        <div className="amc-support-header-actions">
          {saveStatus === "error" && (
            <span className="amc-support-save-error">Could not save. Please try again.</span>
          )}
          <button type="button" className="btn-primary" onClick={handleSave} disabled={saveStatus === "saving"}>
            <Save size={14} />
            {saveStatus === "saving" ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <form className="amc-support-form" onSubmit={(event) => event.preventDefault()}>
        <div className="form-field">
          <label htmlFor="amcReferenceNumber">Reference Number</label>
          <input
            id="amcReferenceNumber"
            type="text"
            value={referenceNumber}
            onChange={(event) => setReferenceNumber(event.target.value)}
          />
        </div>

        <div className="form-field">
          <label htmlFor="amcDate">Date</label>
          <input
            id="amcDate"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
        </div>

        <div className="form-field form-field-full">
          <label htmlFor="amcSubject">Subject</label>
          <textarea
            id="amcSubject"
            rows={4}
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
          />
        </div>

        <h2 className="amc-support-section-title">Invitation for Sealed Quotations</h2>

        <div className="form-field">
          <label htmlFor="amcDeadline">Deadline</label>
          <input
            id="amcDeadline"
            type="date"
            value={deadline}
            onChange={(event) => setDeadline(event.target.value)}
          />
        </div>

        <div className="form-field">
          <label htmlFor="amcEmdAmount">EMD Amount (₹)</label>
          <input
            id="amcEmdAmount"
            type="number"
            min="0"
            value={emdAmount}
            onChange={(event) => setEmdAmount(event.target.value)}
          />
        </div>

        <div className="form-field">
          <label htmlFor="amcEmdMode">EMD Payment Mode</label>
          <input
            id="amcEmdMode"
            type="text"
            value={emdMode}
            onChange={(event) => setEmdMode(event.target.value)}
          />
        </div>

        <div className="form-field">
          <label htmlFor="amcEmdInFavourOf">In Favour Of</label>
          <input
            id="amcEmdInFavourOf"
            type="text"
            value={emdInFavourOf}
            onChange={(event) => setEmdInFavourOf(event.target.value)}
          />
        </div>

        <div className="form-field">
          <label htmlFor="amcSecurityDeposit">Security Deposit (₹)</label>
          <input
            id="amcSecurityDeposit"
            type="number"
            min="0"
            value={securityDeposit}
            onChange={(event) => setSecurityDeposit(event.target.value)}
          />
        </div>

        <div className="form-field form-field-full">
          <label htmlFor="amcEmdForfeiture">EMD Forfeiture</label>
          <textarea
            id="amcEmdForfeiture"
            rows={3}
            value={emdForfeiture}
            onChange={(event) => setEmdForfeiture(event.target.value)}
          />
        </div>

        <div className="form-field form-field-full">
          <label htmlFor="amcRejectionClause">Rejection Clause</label>
          <textarea
            id="amcRejectionClause"
            rows={4}
            value={rejectionClause}
            onChange={(event) => setRejectionClause(event.target.value)}
          />
        </div>

        <div className="form-field">
          <label htmlFor="amcSignatory">Signatory</label>
          <input
            id="amcSignatory"
            type="text"
            value={signatory}
            onChange={(event) => setSignatory(event.target.value)}
          />
        </div>

        <div className="form-field">
          <span className="amc-support-field-label">Signatory Picture</span>
          <PictureImport value={signatoryPic} onChange={setSignatoryPic} alt="Signatory" />
        </div>

        <h2 className="amc-support-section-title">Terms and Conditions</h2>

        <div className="form-field">
          <label htmlFor="amcHandoverCondition">Machine Handover Condition</label>
          <input
            id="amcHandoverCondition"
            type="text"
            value={handoverCondition}
            onChange={(event) => setHandoverCondition(event.target.value)}
          />
        </div>

        <div className="form-field">
          <label htmlFor="amcServicingFrequency">Servicing Frequency</label>
          <input
            id="amcServicingFrequency"
            type="text"
            value={servicingFrequency}
            onChange={(event) => setServicingFrequency(event.target.value)}
          />
        </div>

        <div className="form-field">
          <label htmlFor="amcBdsFrequency">BDS Frequency</label>
          <input
            id="amcBdsFrequency"
            type="text"
            value={bdsFrequency}
            onChange={(event) => setBdsFrequency(event.target.value)}
          />
        </div>

        <div className="form-field form-field-full">
          <label htmlFor="amcCoverage">Coverage</label>
          <textarea
            id="amcCoverage"
            rows={3}
            value={coverage}
            onChange={(event) => setCoverage(event.target.value)}
          />
        </div>

        <div className="form-field">
          <label htmlFor="amcBreakdownResponse">Breakdown Response Time</label>
          <input
            id="amcBreakdownResponse"
            type="text"
            value={breakdownResponse}
            onChange={(event) => setBreakdownResponse(event.target.value)}
          />
        </div>

        <div className="form-field">
          <label htmlFor="amcBreakdownPenalty">Breakdown Penalty (₹/day)</label>
          <input
            id="amcBreakdownPenalty"
            type="number"
            min="0"
            value={breakdownPenalty}
            onChange={(event) => setBreakdownPenalty(event.target.value)}
          />
        </div>

        <div className="form-field">
          <label htmlFor="amcServiceUnitPenalty">Service Unit Penalty (₹/day)</label>
          <input
            id="amcServiceUnitPenalty"
            type="number"
            min="0"
            value={serviceUnitPenalty}
            onChange={(event) => setServiceUnitPenalty(event.target.value)}
          />
        </div>

        <div className="form-field">
          <label htmlFor="amcTechnicians">Technicians</label>
          <input
            id="amcTechnicians"
            type="number"
            min="0"
            value={technicians}
            onChange={(event) => setTechnicians(event.target.value)}
          />
        </div>

        <div className="form-field">
          <label htmlFor="amcHelpers">Helpers</label>
          <input
            id="amcHelpers"
            type="number"
            min="0"
            value={helpers}
            onChange={(event) => setHelpers(event.target.value)}
          />
        </div>

        <div className="form-field form-field-full">
          <label htmlFor="amcPayment">Payment</label>
          <textarea
            id="amcPayment"
            rows={3}
            value={payment}
            onChange={(event) => setPayment(event.target.value)}
          />
        </div>

        <div className="form-field form-field-full">
          <label htmlFor="amcRenewal">Renewal</label>
          <textarea
            id="amcRenewal"
            rows={3}
            value={renewal}
            onChange={(event) => setRenewal(event.target.value)}
          />
        </div>

        <div className="form-field form-field-full">
          <label htmlFor="amcTermination">Termination</label>
          <textarea
            id="amcTermination"
            rows={3}
            value={termination}
            onChange={(event) => setTermination(event.target.value)}
          />
        </div>

        <h2 className="amc-support-section-title">Schedule (Price Table)</h2>

        <div className="amc-support-schedule">
          <div className="amc-support-schedule-scroll">
            <table className="amc-support-schedule-table">
              <colgroup>
                <col className="col-sno" />
                <col className="col-machine" />
                <col className="col-qty" />
                <col className="col-unit" />
                <col className="col-rate" />
                <col className="col-amount" />
                <col className="col-action" />
              </colgroup>
              <thead>
                <tr>
                  <th className="amc-support-schedule-center">S.No.</th>
                  <th>Machine Name</th>
                  <th className="amc-support-schedule-num">Quantity</th>
                  <th>Unit</th>
                  <th className="amc-support-schedule-num">Rate (₹)</th>
                  <th className="amc-support-schedule-num">Amount (₹)</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {scheduleRows.map((row, index) => (
                  <tr key={row.id}>
                    <td className="amc-support-schedule-center">{index + 1}</td>
                    <td>
                      <input
                        type="text"
                        aria-label={`Row ${index + 1} machine name`}
                        value={row.machineName}
                        onChange={(event) =>
                          updateScheduleRow(row.id, "machineName", event.target.value)
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        className="amc-support-schedule-num"
                        aria-label={`Row ${index + 1} quantity`}
                        value={row.quantity}
                        onChange={(event) =>
                          updateScheduleRow(row.id, "quantity", event.target.value)
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        aria-label={`Row ${index + 1} unit`}
                        value={row.unit}
                        onChange={(event) => updateScheduleRow(row.id, "unit", event.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="amc-support-schedule-num"
                        aria-label={`Row ${index + 1} rate`}
                        value={row.rate}
                        onChange={(event) => updateScheduleRow(row.id, "rate", event.target.value)}
                      />
                    </td>
                    <td className="amc-support-schedule-num amc-support-schedule-amount">
                      {formatAmount(getRowAmount(row))}
                    </td>
                    <td className="amc-support-schedule-center">
                      <button
                        type="button"
                        className="amc-support-icon-btn"
                        onClick={() => removeScheduleRow(row.id)}
                        disabled={scheduleRows.length === 1}
                        aria-label={`Remove row ${index + 1}`}
                        title="Remove row"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="amc-support-schedule-total">
                  <td colSpan={5} className="amc-support-schedule-num">
                    Total Amount
                  </td>
                  <td className="amc-support-schedule-num amc-support-schedule-amount amc-support-schedule-total-value">
                    ₹ {formatAmount(scheduleTotal)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
          <button type="button" className="amc-support-pic-btn" onClick={addScheduleRow}>
            <Plus size={14} />
            Add row
          </button>
        </div>

        <div className="form-field form-field-full">
          <label htmlFor="amcAttentionNote">Attention Note</label>
          <textarea
            id="amcAttentionNote"
            rows={3}
            value={attentionNote}
            onChange={(event) => setAttentionNote(event.target.value)}
          />
        </div>

        <h2 className="amc-support-section-title">Signatures</h2>

        <div className="amc-support-sign-areas">
          <div className="amc-support-sign-area">
            <h3 className="amc-support-sign-area-title">Contractor</h3>
            <SignaturePad
              value={contractorSignature}
              onChange={setContractorSignature}
              label="Contractor"
            />
            <PictureImport
              value={contractorSignature}
              onChange={setContractorSignature}
              alt="Contractor signature"
              showPreview={false}
            />
            <div className="form-field">
              <label htmlFor="amcContractorName">Name</label>
              <input
                id="amcContractorName"
                type="text"
                value={contractorName}
                onChange={(event) => setContractorName(event.target.value)}
              />
            </div>
          </div>

          <div className="amc-support-sign-area">
            <h3 className="amc-support-sign-area-title">Executive Engineer</h3>
            <SignaturePad
              value={executiveEngineerSignature}
              onChange={setExecutiveEngineerSignature}
              label="Executive Engineer"
            />
            <PictureImport
              value={executiveEngineerSignature}
              onChange={setExecutiveEngineerSignature}
              alt="Executive Engineer signature"
              showPreview={false}
            />
            <div className="form-field">
              <label htmlFor="amcExecutiveEngineerName">Name</label>
              <input
                id="amcExecutiveEngineerName"
                type="text"
                value={executiveEngineerName}
                onChange={(event) => setExecutiveEngineerName(event.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="amc-support-generate">
          {pdfStatus === "error" && (
            <span className="amc-support-generate-error">Could not generate the PDF. Please try again.</span>
          )}
          <button
            type="button"
            className="amc-support-generate-btn"
            onClick={handleGeneratePdf}
            disabled={pdfStatus === "generating"}
          >
            <FileDown size={16} />
            {pdfStatus === "generating" ? "Generating..." : "Generate PDF"}
          </button>
        </div>
      </form>

      <div className="amc-pdf-offscreen" aria-hidden="true">
        <AmcSupportPdf ref={pdfRef} data={pdfData} signatures={pdfSignatures} />
      </div>
    </div>
  );
}

export default AmcSupport;
