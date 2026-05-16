import { useState, useRef, useEffect } from "react";
import { streamAsk } from "../api";
import { translations } from "../i18n";

const QUICK = [
  "Child fever 38.5°C and vomiting",
  "ANC checkup protocol",
  "ORS preparation steps",
  "Malaria RDT positive",
  "High BP 160/100 management",
];

export default function Chat({ lang }) {
  const t = translations[lang] || translations.en;
  
  const [messages, setMessages] = useState([{
    role: "ai",
    text: t.chatGreeting,
    referral: false,
  }]);
  const [input,   setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(query) {
    if (!query.trim() || loading) return;
    setInput("");
    setMessages(m => [...m, { role: "user", text: query }]);
    setLoading(true);

    // Add empty AI bubble that we'll fill token by token
    setMessages(m => [...m, { role: "ai", text: "", referral: false }]);

    await streamAsk({
      query,
      language: lang,
      onToken: (token) => {
        setMessages(m => {
          const updated = [...m];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            text: updated[updated.length - 1].text + token,
          };
          return updated;
        });
      },
      onDone: (referral) => {
        setMessages(m => {
          const updated = [...m];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            referral,
          };
          return updated;
        });
        setLoading(false);
      },
    });
  }

  return (
    <div className="chat-wrap">
      <div className="chat-area">
        {messages.map((m, i) => (
          <div key={i}>
            <div className={`msg ${m.role}`}>
              <div className={`avatar ${m.role}`}>
                {m.role === "ai"
                  ? <i className="ti ti-heart-plus" />
                  : <i className="ti ti-user" />}
              </div>
              <div className="bubble">
                {m.text}
                {m.role === "ai" && !m.text && (
                  <div className="typing">
                    <div className="dot" /><div className="dot" /><div className="dot" />
                  </div>
                )}
              </div>
            </div>
            {m.referral && (
              <div className="referral-banner">
                <i className="ti ti-alert-triangle" />
                {t.referralBanner}
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="chips">
        {QUICK.map(q => (
          <div key={q} className="chip" onClick={() => send(q)}>{q}</div>
        ))}
      </div>

      <div className="chat-input-row">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send(input)}
          placeholder={t.chatPlaceholder}
        />
        <button className="send-btn" onClick={() => send(input)} disabled={loading}>
          <i className="ti ti-send" />
        </button>
      </div>
    </div>
  );
}
