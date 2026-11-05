import { useState } from "react";
import "./OemOrders.css";

const SERVICE_FIELDS = [
  { key: "srNo", label: "Sr no" },
  { key: "instrument", label: "Instrument" },
  { key: "poQuoteNo", label: "PO/Quote No." },
  { key: "poDate", label: "PO Date", type: "date" },
  { key: "finYear", label: "Fin. Year" },
  { key: "installationDate", label: "Installation Date", type: "date" },
  { key: "installedBy", label: "Installed By" },
  { key: "institute", label: "Institute" },
  { key: "contactPerson", label: "Contact Person" },
  { key: "emailId", label: "Email id" },
  { key: "phoneNo", label: "Phone no" },
  { key: "invoiceNo", label: "Invoice No." },
  { key: "invoiceDate", label: "Invoice Date", type: "date" },
  { key: "basic", label: "Basic" },
  { key: "gst", label: "GST" },
  { key: "total", label: "Total" },
  { key: "remarks", label: "Remarks (Item Details)" },
  { key: "paymentReceived", label: "Payment Received (Y/N)" },
];

function OemOrders() {
  const [service, setService] = useState({});
  const [serialNo, setSerialNo] = useState("");
  const [poNo, setPoNo] = useState("");
  const [date, setDate] = useState("");
  const [manufacturers, setManufacturers] = useState("");
  const [items, setItems] = useState("");
  const [totalCost, setTotalCost] = useState("");
  const [instrumentSerialNo, setInstrumentSerialNo] = useState("");
  const [receivedDateAtNutech, setReceivedDateAtNutech] = useState("");
  const [endUser, setEndUser] = useState("");
  const [warrantyForCustomer, setWarrantyForCustomer] = useState("");
  const [status, setStatus] = useState("");

  return (
    <div className="oem-orders-page">
      <div className="page-title-row">
        <h1 className="oem-orders-title">OEM Orders</h1>
      </div>

      <div className="oem-orders-layout">
      <form className="oem-orders-form" onSubmit={(e) => e.preventDefault()}>
        <div className="form-field">
          <label htmlFor="oemOrderSerialNo">Serial No.</label>
          <input
            id="oemOrderSerialNo"
            value={serialNo}
            onChange={(e) => setSerialNo(e.target.value)}
            placeholder="Enter Serial No."
          />
        </div>
        <div className="form-field">
          <label htmlFor="oemOrderPoNo">PO No.</label>
          <input
            id="oemOrderPoNo"
            value={poNo}
            onChange={(e) => setPoNo(e.target.value)}
            placeholder="Enter PO No."
          />
        </div>
        <div className="form-field">
          <label htmlFor="oemOrderDate">Date</label>
          <input
            id="oemOrderDate"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="form-field">
          <label htmlFor="oemOrderManufacturers">Manufacturers</label>
          <input
            id="oemOrderManufacturers"
            value={manufacturers}
            onChange={(e) => setManufacturers(e.target.value)}
            placeholder="Enter Manufacturers"
          />
        </div>
        <div className="form-field">
          <label htmlFor="oemOrderItems">Items</label>
          <input
            id="oemOrderItems"
            value={items}
            onChange={(e) => setItems(e.target.value)}
            placeholder="Enter Items"
          />
        </div>
        <div className="form-field">
          <label htmlFor="oemOrderTotalCost">Total Cost</label>
          <input
            id="oemOrderTotalCost"
            value={totalCost}
            onChange={(e) => setTotalCost(e.target.value)}
            placeholder="Enter Total Cost"
          />
        </div>
        <div className="form-field">
          <label htmlFor="oemOrderInstrumentSerialNo">Serial No. of Instrument</label>
          <input
            id="oemOrderInstrumentSerialNo"
            value={instrumentSerialNo}
            onChange={(e) => setInstrumentSerialNo(e.target.value)}
            placeholder="Enter Serial No. of Instrument"
          />
        </div>
        <div className="form-field">
          <label htmlFor="oemOrderReceivedDateAtNutech">Received Date at Nutech</label>
          <input
            id="oemOrderReceivedDateAtNutech"
            type="date"
            value={receivedDateAtNutech}
            onChange={(e) => setReceivedDateAtNutech(e.target.value)}
          />
        </div>
        <div className="form-field">
          <label htmlFor="oemOrderEndUser">End User</label>
          <input
            id="oemOrderEndUser"
            value={endUser}
            onChange={(e) => setEndUser(e.target.value)}
            placeholder="Enter End User"
          />
        </div>
        <div className="form-field">
          <label htmlFor="oemOrderWarrantyForCustomer">Warranty for Customer</label>
          <input
            id="oemOrderWarrantyForCustomer"
            value={warrantyForCustomer}
            onChange={(e) => setWarrantyForCustomer(e.target.value)}
            placeholder="Enter Warranty for Customer"
          />
        </div>
        <div className="form-field">
          <label htmlFor="oemOrderStatus">Status</label>
          <input
            id="oemOrderStatus"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            placeholder="Enter Status"
          />
        </div>
      </form>

      <section className="oem-orders-card">
        <h2 className="oem-orders-card-title">Service and Accessories</h2>
        <div className="oem-orders-card-fields">
          {SERVICE_FIELDS.map(({ key, label, type }) => (
            <div className="form-field" key={key}>
              <label htmlFor={`oemService-${key}`}>{label}</label>
              <input
                id={`oemService-${key}`}
                type={type}
                value={service[key] || ""}
                onChange={(e) => setService((prev) => ({ ...prev, [key]: e.target.value }))}
                placeholder={type === "date" ? undefined : `Enter ${label}`}
              />
            </div>
          ))}
        </div>
      </section>
      </div>
    </div>
  );
}

export default OemOrders;
