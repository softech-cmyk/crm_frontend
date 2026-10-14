import { forwardRef } from "react";

function formatDate(value) {
  if (!value) return "";
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

function formatRupees(value) {
  if (value === "" || value === null || value === undefined) return "";
  const amount = Number(value) || 0;
  return `₹ ${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function hasText(value) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function DetailList({ items }) {
  const visible = items.filter((item) => hasText(item.value));
  if (visible.length === 0) return null;
  return (
    <table className="amc-pdf-details">
      <tbody>
        {visible.map((item) => (
          <tr key={item.label}>
            <th>{item.label}</th>
            <td>{item.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Section({ title, children }) {
  return (
    <section className="amc-pdf-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}

const AmcSupportPdf = forwardRef(function AmcSupportPdf({ data, signatures }, ref) {
  const scheduleRows = data.scheduleRows.filter(
    (row) => hasText(row.machineName) || hasText(row.quantity) || hasText(row.unit) || hasText(row.rate)
  );

  const invitationItems = [
    { label: "Deadline", value: formatDate(data.deadline) },
    { label: "EMD Amount", value: formatRupees(data.emdAmount) },
    { label: "EMD Payment Mode", value: data.emdMode },
    { label: "In Favour Of", value: data.emdInFavourOf },
    { label: "Security Deposit", value: formatRupees(data.securityDeposit) },
    { label: "EMD Forfeiture", value: data.emdForfeiture },
    { label: "Rejection Clause", value: data.rejectionClause },
  ];
  const hasInvitation =
    invitationItems.some((item) => hasText(item.value)) ||
    hasText(data.signatory) ||
    signatures.signatory;

  const termsItems = [
    { label: "Machine Handover Condition", value: data.handoverCondition },
    { label: "Servicing Frequency", value: data.servicingFrequency },
    { label: "BDS Frequency", value: data.bdsFrequency },
    { label: "Coverage", value: data.coverage },
    { label: "Breakdown Response Time", value: data.breakdownResponse },
    { label: "Breakdown Penalty (per day)", value: formatRupees(data.breakdownPenalty) },
    { label: "Service Unit Penalty (per day)", value: formatRupees(data.serviceUnitPenalty) },
    { label: "Technicians", value: data.technicians },
    { label: "Helpers", value: data.helpers },
    { label: "Payment", value: data.payment },
    { label: "Renewal", value: data.renewal },
    { label: "Termination", value: data.termination },
  ];
  const hasTerms = termsItems.some((item) => hasText(item.value));

  return (
    <div ref={ref} className="amc-pdf">
      <h1 className="amc-pdf-title">AMC Support</h1>

      <div className="amc-pdf-meta">
        <span>
          <strong>Ref. No.:</strong> {data.referenceNumber}
        </span>
        <span>
          <strong>Date:</strong> {formatDate(data.date)}
        </span>
      </div>

      {hasText(data.subject) && (
        <p className="amc-pdf-subject">
          <strong>Subject: </strong>
          {data.subject}
        </p>
      )}

      {hasInvitation && (
        <Section title="Invitation for Sealed Quotations">
          <DetailList items={invitationItems} />
          {(hasText(data.signatory) || signatures.signatory) && (
            <div className="amc-pdf-signatory">
              {signatures.signatory && <img src={signatures.signatory} alt="" />}
              {hasText(data.signatory) && <span>{data.signatory}</span>}
            </div>
          )}
        </Section>
      )}

      {hasTerms && (
        <Section title="Terms and Conditions">
          <DetailList items={termsItems} />
        </Section>
      )}

      {scheduleRows.length > 0 && (
        <Section title="Schedule (Price Table)">
          <table className="amc-pdf-schedule">
            <thead>
              <tr>
                <th className="amc-pdf-center">S.No.</th>
                <th>Machine Name</th>
                <th className="amc-pdf-num">Quantity</th>
                <th>Unit</th>
                <th className="amc-pdf-num">Rate (₹)</th>
                <th className="amc-pdf-num">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {scheduleRows.map((row, index) => (
                <tr key={row.id}>
                  <td className="amc-pdf-center">{index + 1}</td>
                  <td>{row.machineName}</td>
                  <td className="amc-pdf-num">{row.quantity}</td>
                  <td>{row.unit}</td>
                  <td className="amc-pdf-num">{hasText(row.rate) ? formatRupees(row.rate).slice(2) : ""}</td>
                  <td className="amc-pdf-num">{formatRupees(row.amount).slice(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={5} className="amc-pdf-num">
                  Total Amount
                </td>
                <td className="amc-pdf-num">{formatRupees(data.scheduleTotal)}</td>
              </tr>
            </tfoot>
          </table>
        </Section>
      )}

      {hasText(data.attentionNote) && (
        <Section title="Attention">
          <p className="amc-pdf-text">{data.attentionNote}</p>
        </Section>
      )}

      <div className="amc-pdf-signatures">
        <div className="amc-pdf-sign">
          <div className="amc-pdf-sign-image">
            {signatures.contractor && <img src={signatures.contractor} alt="" />}
          </div>
          <div className="amc-pdf-sign-line" />
          {hasText(data.contractorName) && <div>{data.contractorName}</div>}
          <strong>Contractor</strong>
        </div>
        <div className="amc-pdf-sign">
          <div className="amc-pdf-sign-image">
            {signatures.executiveEngineer && <img src={signatures.executiveEngineer} alt="" />}
          </div>
          <div className="amc-pdf-sign-line" />
          {hasText(data.executiveEngineerName) && <div>{data.executiveEngineerName}</div>}
          <strong>Executive Engineer</strong>
        </div>
      </div>
    </div>
  );
});

export default AmcSupportPdf;
