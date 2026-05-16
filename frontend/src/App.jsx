import { useState } from "react";
import Chat     from "./components/Chat";
import Drugs    from "./components/Drugs";
import Patients from "./components/Patients";
import Stats    from "./components/Stats";
import { translations } from "./i18n";
import "./App.css";

const LANGS = {
  en: "English", hi: "हिंदी", kn: "ಕನ್ನಡ", ta: "தமிழ்", te: "తెలుగు",
};

export default function App() {
  const [tab,  setTab]  = useState("chat");
  const [lang, setLang] = useState("en");
  const [showLang, setShowLang] = useState(false);
  const t = translations[lang] || translations.en;

  const tabs = [
    { id: "chat",     icon: "ti-stethoscope", label: t.tabChat },
    { id: "drugs",    icon: "ti-pill",         label: t.tabDrugs },
    { id: "patients", icon: "ti-users",        label: t.tabPatients },
    { id: "stats",    icon: "ti-chart-bar",    label: t.tabStats },
  ];

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-left">
          <div className="logo"><i className="ti ti-heart-plus" /></div>
          <div>
            <div className="brand-name">{t.appName}</div>
            <div className="brand-sub">{t.appName} · {t.appSub}</div>
          </div>
        </div>
        <div className="topbar-right">
          <div className="offline-badge">
            <i className="ti ti-wifi-off" /> {t.offline}
          </div>
          <div className="lang-btn" onClick={() => setShowLang(v => !v)}>
            <i className="ti ti-language" /> {LANGS[lang]}
          </div>
          {showLang && (
            <div className="lang-menu">
              {Object.entries(LANGS).map(([k, v]) => (
                <div
                  key={k}
                  className={`lang-item ${lang === k ? "active" : ""}`}
                  onClick={() => { setLang(k); setShowLang(false); }}
                >
                  {v} {lang === k && <i className="ti ti-check" />}
                </div>
              ))}
            </div>
          )}
        </div>
      </header>

      <nav className="tabs">
        {tabs.map(t => (
          <div
            key={t.id}
            className={`tab ${tab === t.id ? "active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            <i className={`ti ${t.icon}`} />
            <span>{t.label}</span>
          </div>
        ))}
      </nav>

      <main className="body">
        {tab === "chat"     && <Chat lang={lang} />}
        {tab === "drugs"    && <Drugs lang={lang} />}
        {tab === "patients" && <Patients lang={lang} />}
        {tab === "stats"    && <Stats lang={lang} />}
      </main>
    </div>
  );
}
