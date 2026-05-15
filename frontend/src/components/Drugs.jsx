import { useState, useEffect } from "react";
import { getDrugs } from "../api";

export default function Drugs() {
  const [drugs,  setDrugs]  = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => { getDrugs(search).then(setDrugs); }, [search]);

  return (
    <div>
      <div className="search-box">
        <input
          placeholder="Search drug or category..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <div className="list">
        {drugs.length === 0 && (
          <div style={{ color: "#888", fontSize: 13, textAlign: "center", padding: 24 }}>
            No drugs found. Add via API or seed the database.
          </div>
        )}
        {drugs.map(d => (
          <div className="card" key={d.id}>
            <div className="card-name">{d.name}</div>
            <div className="card-meta">{d.category}</div>
            <div className="card-dose">{d.dosage}</div>
            <span className={`badge ${d.in_stock ? "badge-green" : "badge-red"}`}>
              {d.in_stock ? "✓ In stock" : "✗ Out of stock"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
