import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Upload } from "lucide-react";
import { API_BASE, apiFetch } from "../api.js";
import { normalizeDate } from "../utils/excelDate.js";
import "./ImportButton.css";

const normalizeHeader = (value) => String(value).toLowerCase().replace(/[^a-z0-9]/g, "");

// columns: [{ header, field, date? }] - the file's header row must use these
// header names (case/punctuation-insensitive). Rows are posted to `endpoint`
// as { rows: [{ [field]: value }] } and the endpoint replies with { count }.
function ImportButton({ columns, endpoint, onImported }) {
  const inputRef = useRef(null);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  const handleFile = async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setStatus("importing");
    setMessage("");
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const grid = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
      const headerRow = (grid[0] || []).map(normalizeHeader);
      const indexes = columns.map((c) => headerRow.indexOf(normalizeHeader(c.header)));
      if (indexes.every((i) => i === -1)) {
        throw new Error(`No matching columns. Expected: ${columns.map((c) => c.header).join(", ")}`);
      }
      const rows = grid
        .slice(1)
        .map((cells) => {
          const row = {};
          columns.forEach((c, i) => {
            const value = indexes[i] === -1 ? "" : String(cells[indexes[i]] ?? "").trim();
            row[c.field] = c.date ? normalizeDate(value) : value;
          });
          return row;
        })
        .filter((row) => Object.values(row).some(Boolean));
      if (rows.length === 0) throw new Error("No data rows found in file.");

      const res = await apiFetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Import failed.");
      setStatus("success");
      setMessage(`Imported ${data.count} row(s).`);
      onImported?.();
    } catch (err) {
      setStatus("error");
      setMessage(err.message || "Import failed.");
    }
  };

  return (
    <div className="import-button">
      <button
        type="button"
        className="btn-secondary import-button-btn"
        onClick={() => inputRef.current.click()}
        disabled={status === "importing"}
      >
        <Upload size={14} />
        {status === "importing" ? "Importing..." : "Import"}
      </button>
      <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} hidden />
      {status === "error" && <span className="import-button-error">{message}</span>}
      {status === "success" && <span className="import-button-success">{message}</span>}
    </div>
  );
}

export default ImportButton;
