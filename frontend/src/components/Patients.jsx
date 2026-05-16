import { useState, useEffect, useRef } from "react";
import { getPatients, addPatient, addPatientVoice } from "../api";
import { translations } from "../i18n";

export default function Patients({ lang }) {
  const t = translations[lang] || translations.en;
  const [patients, setPatients] = useState([]);
  const [search,   setSearch]   = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    id: "", name: "", age: "", sex: "F", village: "", contact: ""
  });

  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);

  useEffect(() => { getPatients(search).then(setPatients); }, [search]);

  async function submit() {
    if (!form.id || !form.name) return;
    await addPatient({ ...form, age: parseInt(form.age) });
    setShowForm(false);
    setForm({ id: "", name: "", age: "", sex: "F", village: "", contact: "" });
    getPatients("").then(setPatients);
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];
      
      mediaRecorder.current.ondataavailable = e => {
        if (e.data.size > 0) audioChunks.current.push(e.data);
      };
      
      mediaRecorder.current.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: "audio/webm" });
        stream.getTracks().forEach(track => track.stop());
        
        setIsProcessingAudio(true);
        try {
          const res = await addPatientVoice(audioBlob);
          if (res.parsed_data) {
            setForm(f => ({
              ...f,
              name: res.parsed_data.name || f.name,
              age: res.parsed_data.age || f.age,
              sex: res.parsed_data.sex?.toLowerCase().startsWith('m') ? "M" : (res.parsed_data.sex?.toLowerCase().startsWith('f') ? "F" : f.sex),
              village: res.parsed_data.village || f.village,
              contact: res.parsed_data.contact || f.contact,
              id: res.parsed_data.id || f.id || `PHC-${Math.floor(1000 + Math.random() * 9000)}`
            }));
            setShowForm(true);
          }
        } catch (e) {
          console.error("Audio upload failed", e);
          alert("Voice processing failed.");
        } finally {
          setIsProcessingAudio(false);
        }
      };
      
      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Mic access denied", err);
      alert("Microphone access denied. Please allow it in your browser.");
    }
  }

  function stopRecording() {
    if (mediaRecorder.current && isRecording) {
      mediaRecorder.current.stop();
      setIsRecording(false);
    }
  }

  return (
    <div>
      <div className="search-box" style={{ display: "flex", gap: 8 }}>
        <input
          placeholder={t.searchPatient}
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: 1 }}
        />
        <button
          className="btn-primary"
          style={{ padding: "8px 12px", borderRadius: 8, whiteSpace: "nowrap" }}
          onClick={() => setShowForm(v => !v)}
        >
          <i className="ti ti-plus" /> {t.add}
        </button>
        <button
          className="btn-primary"
          style={{ 
            padding: "8px 12px", borderRadius: 8, whiteSpace: "nowrap", 
            backgroundColor: isRecording ? "#ef4444" : "#f59e0b" 
          }}
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessingAudio}
        >
          <i className="ti ti-microphone" /> {isRecording ? t.stopRecording : (isProcessingAudio ? t.processing : t.voiceRegister)}
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
          <button className="btn-primary" onClick={submit}>{t.savePatient}</button>
        </div>
      )}

      <div className="list">
        {patients.length === 0 && (
          <div style={{ color: "#888", fontSize: 13, textAlign: "center", padding: 24 }}>
            {t.noPatients}
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
