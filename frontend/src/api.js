const BASE = "/api";

export async function streamAsk({ query, patient_id, language, onToken, onDone }) {
  const res = await fetch(`${BASE}/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, patient_id, language }),
  });

  const reader  = res.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const lines = decoder.decode(value).split("\n");
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      try {
        const data = JSON.parse(line.slice(6));
        if (data.token) onToken(data.token);
        if (data.done)  onDone(data.referral);
      } catch {}
    }
  }
}

export const getPatients  = (search = "") =>
  fetch(`${BASE}/patients?search=${search}`).then(r => r.json());

export const addPatient   = (data) =>
  fetch(`${BASE}/patients`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then(r => r.json());

export const addVitals    = (data) =>
  fetch(`${BASE}/vitals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then(r => r.json());

export const getDrugs     = (search = "") =>
  fetch(`${BASE}/drugs?search=${search}`).then(r => r.json());

export const getStats     = () =>
  fetch(`${BASE}/stats`).then(r => r.json());

export const getConsultations = (patient_id) =>
  fetch(`${BASE}/consultations/${patient_id}`).then(r => r.json());

export const addPatientVoice = (audioBlob) => {
  const formData = new FormData();
  formData.append("file", audioBlob, "audio.webm");
  return fetch(`${BASE}/patients/voice`, {
    method: "POST",
    body: formData,
  }).then(r => r.json());
};

export const addDrug = (data) =>
  fetch(`${BASE}/drugs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then(r => r.json());

export const getClusters = () =>
  fetch(`${BASE}/insights/clusters`).then(r => r.json());

export async function streamDigest({ period = "week", onStats, onToken, onDone }) {
  const res = await fetch(`${BASE}/insights/digest?period=${period}`);
  const reader  = res.body.getReader();
  const decoder = new TextDecoder();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const lines = decoder.decode(value).split("\n");
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      try {
        const data = JSON.parse(line.slice(6));
        if (data.stats)  onStats(data.stats);
        if (data.token)  onToken(data.token);
        if (data.done)   onDone();
      } catch {}
    }
  }
}
