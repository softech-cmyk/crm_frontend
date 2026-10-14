// Handles date values imported from Excel as raw serial numbers (e.g. "45609")
// instead of proper date strings, so old imports still display correctly.
export function normalizeDate(value) {
  if (!value) return "";
  if (/^\d+$/.test(value)) {
    const serial = Number(value);
    if (serial > 20000 && serial < 60000) {
      const date = new Date(Math.round((serial - 25569) * 86400 * 1000));
      if (!Number.isNaN(date.getTime())) return date.toISOString().slice(0, 10);
    }
  }
  return value;
}
