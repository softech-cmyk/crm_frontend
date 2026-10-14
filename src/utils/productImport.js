import * as XLSX from "xlsx";

export const IMPORT_COLUMNS = [
  { header: "Make", field: "make" },
  { header: "Instrument Name", field: "instrumentName" },
  { header: "Model", field: "model" },
  { header: "TARGET (Qty.)", field: "targetQty" },
  { header: "Basic Price", field: "basicPrice" },
  { header: "Nutech Price", field: "nutechPrice" },
  { header: "SPL Price", field: "splPrice" },
  { header: "Phenotec Price", field: "phenotecPrice" },
  { header: "GST@18%", field: "gst" },
  { header: "Total Price", field: "totalPrice" },
  { header: "TARGET (Value)", field: "targetValue" },
  { header: "Remarks", field: "remarks" },
];

export const DATA_COLUMNS = IMPORT_COLUMNS.filter((c) => c.field !== "make");

export function parseSheetProducts(sheet, sheetName) {
  const grid = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  if (grid.length === 0) return null;

  // The "Make" header cell often has a title/vendor line merged into it
  // (e.g. "LIST PRICE - M/s Gasmet Technologies Oy, Finland Make"), so match
  // it loosely instead of requiring an exact "Make" cell.
  const headerRowIndex = grid.findIndex((row) => {
    const cells = row.map((cell) => String(cell).trim());
    const hasMake = cells.some((c) => /make$/i.test(c));
    return hasMake && cells.includes("Instrument Name") && cells.includes("Model");
  });
  if (headerRowIndex === -1) return null;

  const headerRow = grid[headerRowIndex].map((cell) => String(cell).trim());
  const makeIndex = headerRow.findIndex((c) => /make$/i.test(c));
  const columnIndexes = DATA_COLUMNS.map(({ header }) => headerRow.indexOf(header));

  const products = grid
    .slice(headerRowIndex + 1)
    .map((row) => {
      const make = makeIndex === -1 ? "" : String(row[makeIndex] ?? "").trim();
      const product = { companyName: make || "Unassigned", make };
      DATA_COLUMNS.forEach(({ field }, i) => {
        const idx = columnIndexes[i];
        product[field] = idx === -1 ? "" : String(row[idx] ?? "").trim();
      });
      return product;
    })
    .filter((p) => p.instrumentName || p.model);

  if (products.length === 0) return null;

  const companies = Array.from(new Set(products.map((p) => p.companyName)));
  return { sheetName, companies, products };
}

export function parseWorkbookProducts(workbook) {
  const parsedSheets = workbook.SheetNames.map((sheetName) => ({
    sheetName,
    result: parseSheetProducts(workbook.Sheets[sheetName], sheetName),
  }));
  const sheetResults = parsedSheets.filter((p) => p.result).map((p) => p.result);
  const skippedSheets = parsedSheets.filter((p) => !p.result).map((p) => p.sheetName);
  return { sheetResults, skippedSheets };
}
