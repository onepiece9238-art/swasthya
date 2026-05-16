import { useState, useEffect } from "react";
import { getStats } from "../api";
import { translations } from "../i18n";

export default function Stats({ lang }) {
  const t = translations[lang] || translations.en;
  const [stats, setStats] = useState(null);

  useEffect(() => { getStats().then(setStats); }, []);

  if (!stats) return (
    <div style={{ padding: 24, textAlign: "center", color: "#888", fontSize: 13 }}>
      {t.loadingStats}
    </div>
  );

  return (
    <div className="stats-body">
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">{t.totalPatients}</div>
          <div className="stat-val">{stats.patients_total}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t.consultationsToday}</div>
          <div className="stat-val">{stats.consultations_today}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t.referralsThisWeek}</div>
          <div className="stat-val" style={{ color: "#991B1B" }}>
            {stats.referrals_this_week}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">{t.drugsOutOfStock}</div>
          <div className="stat-val" style={{ color: "#92400E" }}>
            {stats.drugs_out_of_stock}
          </div>
        </div>
      </div>
    </div>
  );
}
