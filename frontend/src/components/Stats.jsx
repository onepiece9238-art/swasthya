import { useState, useEffect } from "react";
import { getStats, getClusters, streamDigest } from "../api";
import { translations } from "../i18n";

const SEVERITY_STYLE = {
  HIGH:   { bg: "#FEF2F2", border: "#EF4444", badge: "#B91C1C", label: "HIGH ALERT" },
  MEDIUM: { bg: "#FFFBEB", border: "#F59E0B", badge: "#B45309", label: "WATCH" },
};

export default function Stats({ lang }) {
  const t = translations[lang] || translations.en;
  const [stats,    setStats]    = useState(null);
  const [clusters, setClusters] = useState(null);
  const [digest,   setDigest]   = useState({ stats: null, narrative: "", loading: false, done: false });
  const [period,   setPeriod]   = useState("week");

  useEffect(() => {
    getStats().then(setStats);
    getClusters().then(setClusters);
  }, []);

  async function generateDigest(p) {
    setPeriod(p);
    setDigest({ stats: null, narrative: "", loading: true, done: false });
    await streamDigest({
      period: p,
      onStats:  (s) => setDigest(d => ({ ...d, stats: s })),
      onToken:  (tok) => setDigest(d => ({ ...d, narrative: d.narrative + tok })),
      onDone:   ()  => setDigest(d => ({ ...d, loading: false, done: true })),
    });
  }

  return (
    <div className="stats-body">

      {/* ── KPI Row ───────────────────────────────────────────────────────── */}
      {stats && (
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
      )}

      {/* ── Cluster Alerts ────────────────────────────────────────────────── */}
      <div style={{ marginTop: 28 }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12, color: "#1e293b", display: "flex", alignItems: "center", gap: 8 }}>
          <i className="ti ti-alert-triangle" style={{ color: "#ef4444" }} />
          Epidemic Early Warning
        </div>

        {!clusters && (
          <div style={{ color: "#888", fontSize: 13, padding: "12px 0" }}>{t.loadingStats}</div>
        )}

        {clusters && clusters.alerts.length === 0 && (
          <div style={{
            padding: "14px 18px", borderRadius: 10, background: "#f0fdf4",
            border: "1px solid #86efac", color: "#166534", fontSize: 13, display: "flex", alignItems: "center", gap: 8
          }}>
            <i className="ti ti-circle-check" /> No symptom clusters detected in the last {clusters.window_hours} hours.
          </div>
        )}

        {clusters && clusters.alerts.map((alert, i) => {
          const s = SEVERITY_STYLE[alert.severity] || SEVERITY_STYLE.MEDIUM;
          return (
            <div key={i} style={{
              marginBottom: 14, padding: "16px 18px", borderRadius: 10,
              background: s.bg, borderLeft: `4px solid ${s.border}`
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <span style={{
                  background: s.badge, color: "#fff", fontSize: 10, fontWeight: 700,
                  padding: "2px 8px", borderRadius: 4, letterSpacing: 1
                }}>
                  {s.label}
                </span>
                <span style={{ fontWeight: 700, fontSize: 14, color: "#1e293b" }}>
                  {alert.count} {alert.symptom} cases · {alert.village}
                </span>
                <span style={{ color: "#64748b", fontSize: 12 }}>
                  (last {alert.window_hours}h)
                </span>
              </div>
              <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.6 }}>
                <strong>Gemma 4 Assessment:</strong> {alert.ai_recommendation}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Weekly / Monthly Digest ───────────────────────────────────────── */}
      <div style={{ marginTop: 28 }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12, color: "#1e293b", display: "flex", alignItems: "center", gap: 8 }}>
          <i className="ti ti-report-analytics" style={{ color: "#6366f1" }} />
          AI Health Digest
        </div>

        <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
          <button
            className="btn-primary"
            onClick={() => generateDigest("week")}
            disabled={digest.loading}
            style={{ opacity: digest.loading ? 0.6 : 1 }}
          >
            {digest.loading && period === "week" ? "⏳ Generating..." : "📋 Weekly Report"}
          </button>
          <button
            className="btn-primary"
            onClick={() => generateDigest("month")}
            disabled={digest.loading}
            style={{ opacity: digest.loading ? 0.6 : 1, background: "#6366f1" }}
          >
            {digest.loading && period === "month" ? "⏳ Generating..." : "📊 Monthly Report"}
          </button>
        </div>

        {/* Raw stats header */}
        {digest.stats && (
          <div style={{
            padding: "14px 16px", background: "#f8fafc", borderRadius: 10,
            border: "1px solid #e2e8f0", fontFamily: "monospace", fontSize: 12,
            whiteSpace: "pre-wrap", color: "#475569", marginBottom: 16
          }}>
            {digest.stats}
          </div>
        )}

        {/* Streaming narrative */}
        {(digest.narrative || digest.loading) && (
          <div style={{
            padding: "18px 20px", background: "#fff", borderRadius: 10,
            border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
            fontSize: 14, color: "#1e293b", lineHeight: 1.75
          }}>
            <div style={{ fontWeight: 700, fontSize: 12, color: "#6366f1", marginBottom: 10, letterSpacing: 1, textTransform: "uppercase" }}>
              Gemma 4 · District Health Officer Analysis
            </div>
            {digest.narrative || (
              <div className="typing">
                <div className="dot" /><div className="dot" /><div className="dot" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
