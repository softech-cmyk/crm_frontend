import { useEffect, useState } from "react";
import { API_BASE, apiFetch } from "../api.js";
import ImportButton from "../components/ImportButton.jsx";
import "./UserList.css";

const IMPORT_COLUMNS = [
  { header: "Scientist Name", field: "scientistName" },
  { header: "Institute", field: "institute" },
  { header: "Contact", field: "contact" },
  { header: "E-Mail", field: "email" },
  { header: "Machinary Purchased", field: "machinaryPurchased" },
];

function UserList() {
  const [scientists, setScientists] = useState([]);
  const [search, setSearch] = useState("");

  const query = search.trim().toLowerCase();
  const visibleScientists = query
    ? scientists.filter((s) =>
        [s.scientistName, s.institute, s.contact, s.email, s.machinaryPurchased].some((v) =>
          String(v ?? "").toLowerCase().includes(query)
        )
      )
    : scientists;

  const loadScientists = () => {
    apiFetch(`${API_BASE}/api/scientists`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load scientists");
        return res.json();
      })
      .then((data) => setScientists(data.scientists || []))
      .catch(() => {});
  };

  useEffect(loadScientists, []);

  return (
    <div className="user-list-page">
      <div className="user-list-header">
        <h1 className="user-list-title">User List</h1>
        <div className="user-list-actions">
          <input
            type="search"
            className="user-list-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
          />
          <ImportButton columns={IMPORT_COLUMNS} endpoint="/api/scientists/import" onImported={loadScientists} />
        </div>
      </div>
      <table className="user-list-table">
        <thead>
          <tr>
            <th>S.no</th>
            <th>Scientist Name</th>
            <th>Institute</th>
            <th>Contact</th>
            <th>E-Mail</th>
            <th>Machinary Purchased</th>
          </tr>
        </thead>
        <tbody>
          {visibleScientists.map((s, i) => (
            <tr key={s._id}>
              <td>{i + 1}</td>
              <td>{s.scientistName}</td>
              <td>{s.institute}</td>
              <td>{s.contact}</td>
              <td>{s.email}</td>
              <td>{s.machinaryPurchased}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default UserList;
