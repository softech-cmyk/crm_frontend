import { API_BASE, apiFetch } from "./api.js";

export async function searchContacts(q) {
  const res = await apiFetch(`${API_BASE}/api/contacts/search?q=${encodeURIComponent(q)}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.contacts || [];
}

export async function searchLeads(q) {
  const res = await apiFetch(`${API_BASE}/api/leads/search?q=${encodeURIComponent(q)}`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.leads || [];
}

export function contactLabel(c) {
  const title = [c.firstName, c.lastName].filter(Boolean).join(" ");
  const sub = [c.company, c.emails && c.emails[0], c.phones && c.phones[0]?.number]
    .filter(Boolean)
    .join(" · ");
  return { title, subtitle: sub };
}
