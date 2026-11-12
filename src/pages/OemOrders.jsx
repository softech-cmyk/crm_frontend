import { useState } from "react";
import { API_BASE, apiFetch } from "../api.js";
import "./OemOrders.css";

function OemOrders() {
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
  const [saveStatus, setSaveStatus] = useState("idle");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveStatus("saving");
    try {
      const res = await apiFetch(`${API_BASE}/api/oem-orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serialNo,
          poNo,
          date,
          manufacturers,
          items,
          totalCost,
          instrumentSerialNo,
          receivedDateAtNutech,
          endUser,
          warrantyForCustomer,
          status,
        }),
      });
      if (!res.ok) throw new Error("Failed to save record");
      setSerialNo("");
      setPoNo("");
      setDate("");
      setManufacturers("");
      setItems("");
      setTotalCost("");
      setInstrumentSerialNo("");
      setReceivedDateAtNutech("");
      setEndUser("");
      setWarrantyForCustomer("");
      setStatus("");
      setSaveStatus("saved");
    } catch (err) {
      setSaveStatus("error");
    }
  };

  return (
    <div className="oem-orders-page">
      <div className="page-title-row">
        <h1 className="oem-orders-title">OEM Orders</h1>
      </div>

      <form className="oem-orders-form" onSubmit={handleSubmit}>
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

        <div className="oem-orders-form-actions">
          {saveStatus === "saved" && <span className="oem-orders-saved">Saved.</span>}
          {saveStatus === "error" && (
            <span className="oem-orders-error">Could not save record.</span>
          )}
          <button type="submit" className="btn-primary" disabled={saveStatus === "saving"}>
            {saveStatus === "saving" ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default OemOrders;
