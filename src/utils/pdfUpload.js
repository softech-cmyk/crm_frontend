import { API_BASE, apiFetch } from "../api.js";

export function deriveCompanyName(relativePath, fallback) {
  const segments = (relativePath || "").split("/").filter(Boolean);
  if (segments.length >= 2) return segments[segments.length - 2];
  return fallback || "Unassigned";
}

export function readEntry(entry, path = "") {
  return new Promise((resolve) => {
    if (entry.isFile) {
      entry.file(
        (file) => {
          file.relativePath = path + file.name;
          resolve([file]);
        },
        () => resolve([])
      );
    } else if (entry.isDirectory) {
      const reader = entry.createReader();
      const collected = [];
      const readBatch = () => {
        reader.readEntries((entries) => {
          if (entries.length === 0) {
            Promise.all(collected.map((child) => readEntry(child, `${path}${entry.name}/`))).then((nested) =>
              resolve(nested.flat())
            );
          } else {
            collected.push(...entries);
            readBatch();
          }
        }, () => resolve([]));
      };
      readBatch();
    } else {
      resolve([]);
    }
  });
}

// Collects every file from a drop event, walking into dropped folders.
export async function filesFromDrop(dataTransfer) {
  const items = dataTransfer?.items;
  if (items && items.length > 0 && items[0].webkitGetAsEntry) {
    const entries = Array.from(items)
      .map((item) => item.webkitGetAsEntry())
      .filter(Boolean);
    const nested = await Promise.all(entries.map((entry) => readEntry(entry)));
    return nested.flat();
  }
  return Array.from(dataTransfer?.files || []);
}

export async function uploadPdfFiles(endpoint, pdfFiles, getCompanyName, { setStatus, setProgress, setMessage }) {
  setStatus("uploading");
  setProgress({ done: 0, total: pdfFiles.length });
  setMessage("");

  let succeeded = 0;
  let failed = 0;

  for (const file of pdfFiles) {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("companyName", getCompanyName(file));
      const res = await apiFetch(`${API_BASE}${endpoint}`, { method: "POST", body: formData });
      if (!res.ok) throw new Error();
      succeeded += 1;
    } catch (err) {
      failed += 1;
    }
    setProgress((prev) => ({ ...prev, done: prev.done + 1 }));
  }

  setStatus("done");
  return { succeeded, failed };
}
