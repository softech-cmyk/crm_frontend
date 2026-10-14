import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { Download, Trash2, Upload } from "lucide-react";
import { API_BASE, apiFetch } from "../api.js";
import { IMPORT_COLUMNS, parseWorkbookProducts } from "../utils/productImport.js";
import "./Products.css";

const EMPTY_FORM = {
  companyName: "",
  make: "",
  instrumentName: "",
  model: "",
  targetQty: "",
  basicPrice: "",
  nutechPrice: "",
  splPrice: "",
  phenotecPrice: "",
  gst: "",
  totalPrice: "",
  targetValue: "",
  remarks: "",
};

const EXPORT_COLUMNS = [{ header: "Company Name", field: "companyName" }, ...IMPORT_COLUMNS];

function Products() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [saveStatus, setSaveStatus] = useState("idle");
  const [expandedCompanies, setExpandedCompanies] = useState([]);
  const [importStatus, setImportStatus] = useState("idle");
  const [importMessage, setImportMessage] = useState("");

  const loadProducts = () => {
    apiFetch(`${API_BASE}/api/products`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load products");
        return res.json();
      })
      .then((data) => setProducts(data.products || []))
      .catch(() => {});
  };

  useEffect(loadProducts, []);

  const companyNames = useMemo(() => {
    const names = new Set(products.map((p) => p.companyName).filter(Boolean));
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [products]);

  const groupedByCompany = useMemo(() => {
    const groups = new Map();
    products.forEach((product) => {
      const key = product.companyName || "Unassigned";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(product);
    });
    return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [products]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleCompany = (companyName) => {
    setExpandedCompanies((prev) =>
      prev.includes(companyName) ? prev.filter((c) => c !== companyName) : [...prev, companyName]
    );
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setSaveStatus("idle");
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete this product?`)) return;
    try {
      const res = await apiFetch(`${API_BASE}/api/products/${product._id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete product");
      if (editingId === product._id) handleCancelEdit();
      loadProducts();
    } catch (err) {
      // ignore
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveStatus("saving");
    try {
      const url = editingId ? `${API_BASE}/api/products/${editingId}` : `${API_BASE}/api/products`;
      const res = await apiFetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to save product");
      const savedCompany = form.companyName;
      setEditingId(null);
      setForm(EMPTY_FORM);
      setSaveStatus("idle");
      setExpandedCompanies((prev) => (prev.includes(savedCompany) ? prev : [...prev, savedCompany]));
      loadProducts();
    } catch (err) {
      setSaveStatus("error");
    }
  };

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportStatus("importing");
    setImportMessage("");
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });

      const { sheetResults, skippedSheets } = parseWorkbookProducts(workbook);

      if (sheetResults.length === 0) {
        throw new Error("No sheet had a recognizable header row (Make / Instrument Name / Model).");
      }

      const products = sheetResults.flatMap((r) => r.products);
      const companies = Array.from(new Set(sheetResults.flatMap((r) => r.companies)));

      const res = await apiFetch(`${API_BASE}/api/products/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products }),
      });
      if (!res.ok) throw new Error("Failed to import products");
      const data = await res.json();
      setImportStatus("success");
      const skippedNote =
        skippedSheets.length > 0 ? ` Skipped sheet(s) with no matching header: ${skippedSheets.join(", ")}.` : "";
      setImportMessage(
        `Imported ${data.count} product(s) across ${companies.length} compan${
          companies.length === 1 ? "y" : "ies"
        } from ${sheetResults.length} sheet(s).${skippedNote}`
      );
      setExpandedCompanies((prev) => Array.from(new Set([...prev, ...companies])));
      loadProducts();
    } catch (err) {
      setImportStatus("error");
      setImportMessage(err.message || "Failed to import file.");
    } finally {
      e.target.value = "";
    }
  };

  const handleExport = () => {
    const rows = groupedByCompany.flatMap(([companyName, items]) =>
      items.map((product) =>
        Object.fromEntries(
          EXPORT_COLUMNS.map(({ header, field }) => [
            header,
            field === "companyName" ? companyName : product[field] || "",
          ])
        )
      )
    );
    const sheet = XLSX.utils.json_to_sheet(rows, { header: EXPORT_COLUMNS.map((c) => c.header) });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Products");
    XLSX.writeFile(workbook, `Products-Export-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="products-page">
      <div className="products-header">
        <h1 className="products-title">Inventory</h1>
        <button
          type="button"
          className="btn-secondary"
          onClick={handleExport}
          disabled={products.length === 0}
        >
          <Download size={14} />
          Export to Excel
        </button>
      </div>

      <form className="products-form" onSubmit={handleSubmit}>
        <div className="form-field products-form-description">
          <label htmlFor="productCompany">Company Name</label>
          <input
            id="productCompany"
            list="companyNameSuggestions"
            value={form.companyName}
            onChange={(e) => updateField("companyName", e.target.value)}
            placeholder="Company name"
            autoComplete="off"
            required
          />
          <datalist id="companyNameSuggestions">
            {companyNames.map((companyName) => (
              <option key={companyName} value={companyName} />
            ))}
          </datalist>
        </div>
        <div className="form-field">
          <label htmlFor="productMake">Make</label>
          <input
            id="productMake"
            value={form.make}
            onChange={(e) => updateField("make", e.target.value)}
            placeholder="Make"
          />
        </div>
        <div className="form-field">
          <label htmlFor="productInstrumentName">Instrument Name</label>
          <input
            id="productInstrumentName"
            value={form.instrumentName}
            onChange={(e) => updateField("instrumentName", e.target.value)}
            placeholder="Instrument name"
          />
        </div>
        <div className="form-field">
          <label htmlFor="productModel">Model</label>
          <input
            id="productModel"
            value={form.model}
            onChange={(e) => updateField("model", e.target.value)}
            placeholder="Model"
          />
        </div>
        <div className="form-field">
          <label htmlFor="productTargetQty">TARGET (Qty.)</label>
          <input
            id="productTargetQty"
            value={form.targetQty}
            onChange={(e) => updateField("targetQty", e.target.value)}
            placeholder="Target quantity"
          />
        </div>
        <div className="form-field">
          <label htmlFor="productBasicPrice">Basic Price</label>
          <input
            id="productBasicPrice"
            value={form.basicPrice}
            onChange={(e) => updateField("basicPrice", e.target.value)}
            placeholder="Basic price"
          />
        </div>
        <div className="form-field">
          <label htmlFor="productNutechPrice">Nutech Price</label>
          <input
            id="productNutechPrice"
            value={form.nutechPrice}
            onChange={(e) => updateField("nutechPrice", e.target.value)}
            placeholder="Nutech price"
          />
        </div>
        <div className="form-field">
          <label htmlFor="productSplPrice">SPL Price</label>
          <input
            id="productSplPrice"
            value={form.splPrice}
            onChange={(e) => updateField("splPrice", e.target.value)}
            placeholder="SPL price"
          />
        </div>
        <div className="form-field">
          <label htmlFor="productPhenotecPrice">Phenotec Price</label>
          <input
            id="productPhenotecPrice"
            value={form.phenotecPrice}
            onChange={(e) => updateField("phenotecPrice", e.target.value)}
            placeholder="Phenotec price"
          />
        </div>
        <div className="form-field">
          <label htmlFor="productGst">GST@18%</label>
          <input
            id="productGst"
            value={form.gst}
            onChange={(e) => updateField("gst", e.target.value)}
            placeholder="GST@18%"
          />
        </div>
        <div className="form-field">
          <label htmlFor="productTotalPrice">Total Price</label>
          <input
            id="productTotalPrice"
            value={form.totalPrice}
            onChange={(e) => updateField("totalPrice", e.target.value)}
            placeholder="Total price"
          />
        </div>
        <div className="form-field">
          <label htmlFor="productTargetValue">TARGET (Value)</label>
          <input
            id="productTargetValue"
            value={form.targetValue}
            onChange={(e) => updateField("targetValue", e.target.value)}
            placeholder="Target value"
          />
        </div>
        <div className="form-field products-form-description">
          <label htmlFor="productRemarks">Remarks</label>
          <textarea
            id="productRemarks"
            rows={2}
            value={form.remarks}
            onChange={(e) => updateField("remarks", e.target.value)}
            placeholder="Remarks"
          />
        </div>
        <div className="products-form-actions">
          {saveStatus === "error" && <span className="products-error">Could not save product.</span>}
          {editingId && (
            <button type="button" className="btn-secondary" onClick={handleCancelEdit}>
              Cancel
            </button>
          )}
          <button type="submit" className="btn-primary" disabled={saveStatus === "saving"}>
            {saveStatus === "saving" ? "Saving..." : editingId ? "Update Product" : "Add Product"}
          </button>
        </div>
      </form>

      <div className="products-import">
        <h2 className="products-import-title">Import Products</h2>
        <label className="btn-secondary products-import-file-btn">
          <Upload size={14} />
          Choose file (.xlsx, .xls, .csv)
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleImportFile}
            className="products-import-file-input"
          />
        </label>
        <p className="products-import-hint">
          Every sheet in the file is scanned; each row is filed under the company name in its own Make column.
          Sheets without an Instrument Name / Model / Make header are skipped. Columns used:{" "}
          {IMPORT_COLUMNS.map((c) => c.header).join(", ")}
        </p>
        {importStatus === "importing" && <span className="products-upload-status">Importing...</span>}
        {importStatus === "error" && <span className="products-error">{importMessage}</span>}
        {importStatus === "success" && <span className="products-import-success">{importMessage}</span>}
      </div>

      {products.length === 0 && <p className="products-empty">No products in the catalog yet.</p>}

      {groupedByCompany.length > 0 && (
        <div className="products-folders">
          {groupedByCompany.map(([companyName, items]) => {
            const expanded = expandedCompanies.includes(companyName);
            return (
              <div key={companyName} className="products-folder">
                <div className="products-folder-header">
                  <button
                    type="button"
                    className="products-folder-header-toggle"
                    onClick={() => toggleCompany(companyName)}
                  >
                    <span className="products-folder-name">{companyName}</span>
                    <span className="products-folder-count">{items.length}</span>
                  </button>
                </div>
                {expanded && (
                  <div className="products-table">
                    <div className="products-table-row products-table-head">
                      <span>Make</span>
                      <span>Instrument Name</span>
                      <span>Model</span>
                      <span>TARGET (Qty.)</span>
                      <span>Basic Price</span>
                      <span>Nutech Price</span>
                      <span>SPL Price</span>
                      <span>Phenotec Price</span>
                      <span>GST@18%</span>
                      <span>Total Price</span>
                      <span>TARGET (Value)</span>
                      <span>Remarks</span>
                      <span></span>
                    </div>
                    {items.map((product) => (
                      <div
                        key={product._id}
                        className={`products-table-row ${editingId === product._id ? "editing" : ""}`}
                      >
                        <span>{product.make || "-"}</span>
                        <span>{product.instrumentName || "-"}</span>
                        <span>{product.model || "-"}</span>
                        <span>{product.targetQty || "-"}</span>
                        <span>{product.basicPrice || "-"}</span>
                        <span>{product.nutechPrice || "-"}</span>
                        <span>{product.splPrice || "-"}</span>
                        <span>{product.phenotecPrice || "-"}</span>
                        <span>{product.gst || "-"}</span>
                        <span>{product.totalPrice || "-"}</span>
                        <span>{product.targetValue || "-"}</span>
                        <span>{product.remarks || "-"}</span>
                        <span className="products-table-row-actions">
                          <button
                            type="button"
                            className="products-table-delete-btn"
                            onClick={() => handleDelete(product)}
                            aria-label="Delete product"
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
          })}
        </div>
      )}
    </div>
  );
}

export default Products;
