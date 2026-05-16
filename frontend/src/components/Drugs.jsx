import { useState, useEffect } from "react";
import { getDrugs, addDrug } from "../api";
import { translations } from "../i18n";

export default function Drugs({ lang }) {
  const t = translations[lang] || translations.en;
  const [drugs,  setDrugs]  = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [form, setForm] = useState({
    name: "", category: "Analgesic", dosage: "", in_stock: 1, expiry_date: ""
  });

  useEffect(() => { getDrugs(search).then(setDrugs); }, [search]);

  async function submit() {
    if (!form.name || !form.category) return;
    setIsEvaluating(true);
    await addDrug(form);
    setIsEvaluating(false);
    setShowForm(false);
    setForm({ name: "", category: "Analgesic", dosage: "", in_stock: 1, expiry_date: "" });
    getDrugs("").then(setDrugs);
  }

  return (
    <div>
      <div className="search-box" style={{ display: "flex", gap: 8 }}>
        <input
          placeholder={t.searchDrug}
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1 }}
        />
        <button
          className="btn-primary"
          style={{ padding: "8px 12px", borderRadius: 8, whiteSpace: "nowrap" }}
          onClick={() => setShowForm(v => !v)}
        >
          <i className="ti ti-plus" /> {t.addDrug}
        </button>
      </div>

      {showForm && (
        <div className="form">
          <input placeholder="Drug name (e.g. Paracetamol)" value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))} disabled={isEvaluating} />
          <input placeholder="Category (e.g. Analgesic, Antibiotic)" value={form.category}
            onChange={e => setForm(f => ({ ...f, category: e.target.value }))} disabled={isEvaluating} />
          <input placeholder="Dosage (e.g. 500mg)" value={form.dosage}
            onChange={e => setForm(f => ({ ...f, dosage: e.target.value }))} disabled={isEvaluating} />
          <input placeholder="Expiry Date (YYYY-MM-DD)" value={form.expiry_date} type="date"
            onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))} disabled={isEvaluating} />
          <select value={form.in_stock}
            onChange={e => setForm(f => ({ ...f, in_stock: parseInt(e.target.value) }))} disabled={isEvaluating}>
            <option value={1}>{t.inStock}</option>
            <option value={0}>{t.outOfStock}</option>
          </select>
          <button className="btn-primary" onClick={submit} disabled={isEvaluating}>
            {isEvaluating ? t.evaluatingAI : t.saveDrug}
          </button>
        </div>
      )}
      <div className="list">
        {drugs.length === 0 && (
          <div style={{ color: "#888", fontSize: 13, textAlign: "center", padding: 24 }}>
            {t.noDrugs}
          </div>
        )}
        {drugs.map(d => (
          <div className="card" key={d.id}>
            <div className="card-name">{d.name}</div>
            <div className="card-meta">{d.category}</div>
            <div className="card-dose">{d.dosage}</div>
            <span className={`badge ${d.in_stock ? "badge-green" : "badge-red"}`}>
              {d.in_stock ? `✓ ${t.inStock}` : `✗ ${t.outOfStock}`}
            </span>
            {d.importance_flag && (
              <div style={{
                marginTop: 12, padding: "8px 10px", backgroundColor: "#f0fdf4", 
                borderLeft: "4px solid #22c55e", borderRadius: 4, fontSize: 13, color: "#166534"
              }}>
                <strong>{t.aiEval}:</strong> {d.importance_flag}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
