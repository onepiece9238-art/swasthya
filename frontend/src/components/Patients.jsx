import { useState, useEffect } from "react";
import { getPatients, addPatient } from "../api";

export default function Patients({ lang }) {
  const [patients, setPatients] = useState([]);
  const [search,   setSearch]   = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    id: "", name: "", age: "", sex: "F", village: "", contact: ""
  });

  useEffect(() => { getPatients(search).then(setPatients); }, [search]);

  async function submit() {
    if (!form.id || !form.name) return;
    await addPatient({ ...form, age: parseInt(form.age) });
    setShowForm(false);
    setForm({ id: "", name: "", age: "", sex: "F", village: "", contact: "" });
    getPatients("").then(setPatients);
  }

  return (
    <div>
      <div className="search-box" style={{ display: "flex", gap: 8 }}>
        <input
          placeholder="Search name or ID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1 }}
        />
        <button
          className="btn-primary"
          style={{ padding: "8px 12px", borderRadius: 8, whiteSpace: "nowrap" }}
          onClick={() => setShowForm(v => !v)}
        >
          <i className="ti ti-plus" /> Add
        </button>
      </div>

      {showForm && (
        <div className="form">
          <input placeholder="Patient ID (e.g. PHC-0001)" value={form.id}
            onChange={e => setForm(f => ({ ...f, id: e.target.value }))} />
          <input placeholder="Full name" value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <input placeholder="Age" type="number" value={form.age}
            onChange={e => setForm(f => ({ ...f, age: e.target.value }))} />
          <select value={form.sex}
            onChange={e => setForm(f => ({ ...f, sex: e.target.value }))}>
            <option value="F">Female</option>
            <option value="M">Male</option>
            <option value="Other">Other</option>
          </select>
          <input placeholder="Village" value={form.village}
            onChange={e => setForm(f => ({ ...f, village: e.target.value }))} />
          <input placeholder="Contact number" value={form.contact}
            onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} />
          <button className="btn-primary" onClick={submit}>Save Patient</button>
        </div>
      )}

      <div className="list">
        {patients.length === 0 && (
          <div style={{ color: "#888", fontSize: 13, textAlign: "center", padding: 24 }}>
            No patients yet. Add one above.
          </div>
        )}
        {patients.map(p => (
          <div className="card" key={p.id}>
            <div className="card-name">{p.name}
              <span style={{ fontWeight: 400, fontSize: 12, color: "#888", marginLeft: 6 }}>
                {p.age}{p.sex} · {p.village}
              </span>
            </div>
            <div className="card-meta">{p.id} · {p.contact}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
