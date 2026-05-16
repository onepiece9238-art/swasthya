from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from sentence_transformers import SentenceTransformer
import chromadb
import sqlite3
import json
import re
import httpx

# ── Config ──────────────────────────────────────────────────────────────────
LLAMA_SERVER = "http://localhost:8080"
DB_PATH      = "../data/swasthya.db"
CHROMA_PATH  = "../data/chromadb"
TOP_K_CHUNKS = 3

# ── Load embedder ────────────────────────────────────────────────────────────
print("Loading embedding model...")
embedder = SentenceTransformer("all-MiniLM-L6-v2")
print("Embedder ready.")

# ── ChromaDB ─────────────────────────────────────────────────────────────────
chroma     = chromadb.PersistentClient(path=CHROMA_PATH)
collection = chroma.get_or_create_collection("mohfw_knowledge")

# ── FastAPI ───────────────────────────────────────────────────────────────────
app = FastAPI(title="Swasthya Sahayak API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Schemas ───────────────────────────────────────────────────────────────────
class QueryRequest(BaseModel):
    query: str
    patient_id: Optional[str] = None
    language: str = "en"

class PatientIn(BaseModel):
    id: str
    name: str
    age: int
    sex: str
    village: str
    contact: str

class VitalsIn(BaseModel):
    patient_id: str
    bp_systolic: Optional[int] = None
    bp_diastolic: Optional[int] = None
    temperature: Optional[float] = None
    weight: Optional[float] = None
    spo2: Optional[int] = None

# ── Helpers ───────────────────────────────────────────────────────────────────
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def retrieve_context(query: str) -> str:
    embedding = embedder.encode(query).tolist()
    results   = collection.query(
        query_embeddings=[embedding],
        n_results=TOP_K_CHUNKS
    )
    chunks = results["documents"][0] if results["documents"] else []
    return "\n\n".join(chunks)

def get_patient_context(patient_id: str) -> str:
    if not patient_id:
        return ""
    conn    = get_db()
    patient = conn.execute(
        "SELECT * FROM patients WHERE id = ?", (patient_id,)
    ).fetchone()
    if not patient:
        conn.close()
        return ""
    vitals = conn.execute(
        "SELECT * FROM vitals WHERE patient_id = ? ORDER BY recorded_at DESC LIMIT 1",
        (patient_id,)
    ).fetchone()
    conn.close()
    ctx = (f"Patient: {patient['name']}, Age: {patient['age']}, "
           f"Sex: {patient['sex']}, Village: {patient['village']}")
    if vitals:
        ctx += (f"\nLatest vitals — BP: {vitals['bp_systolic']}/"
                f"{vitals['bp_diastolic']} mmHg, "
                f"Temp: {vitals['temperature']}°C, "
                f"SpO2: {vitals['spo2']}%, "
                f"Weight: {vitals['weight']} kg")
    return ctx

def build_system_prompt(language: str) -> str:
    lang_map = {
        "en": "English", "hi": "Hindi", "kn": "Kannada",
        "ta": "Tamil",   "te": "Telugu"
    }
    lang_name = lang_map.get(language, "English")
    return (
        f"You are Swasthya Sahayak, a clinical AI assistant at an Indian "
        f"Primary Health Centre (PHC). "
        f"Follow MOHFW Standard Treatment Guidelines strictly. "
        f"Be concise — health workers are busy. "
        f"Write [REFERRAL NEEDED] on its own line if the case needs urgent "
        f"referral to CHC or district hospital. "
        f"Never invent drug dosages. "
        f"Respond in {lang_name}."
    )

def clean_response(text: str) -> str:
    # Strip llama artifact tokens
    text = text.replace("<end_of_turn>", "")
    text = text.replace("<start_of_turn>", "")
    text = text.strip()
    return text

def check_referral(response: str) -> bool:
    return bool(re.search(r'\[REFERRAL NEEDED\]', response, re.IGNORECASE))

def save_consultation(patient_id, query, response, referral_flag, language):
    conn = get_db()
    conn.execute(
        """INSERT INTO consultations
           (patient_id, query, ai_response, referral_flag, language)
           VALUES (?, ?, ?, ?, ?)""",
        (patient_id, query, response, int(referral_flag), language)
    )
    conn.commit()
    conn.close()

# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "model": "gemma4-E2B-q4_k_m",
        "knowledge_chunks": collection.count(),
    }

@app.post("/api/ask")
async def ask(req: QueryRequest):
    rag_context     = retrieve_context(req.query)
    patient_context = get_patient_context(req.patient_id or "")

    user_message = f"Clinical query: {req.query}\n\nRelevant guidelines:\n{rag_context}"
    if patient_context:
        user_message += f"\n\nPatient context:\n{patient_context}"

    messages = [
        {"role": "system", "content": build_system_prompt(req.language)},
        {"role": "user",   "content": user_message},
    ]

    # Manual prompt formatting for Gemma
    prompt = f"<start_of_turn>user\n{build_system_prompt(req.language)}\n\n{user_message}<end_of_turn>\n<start_of_turn>model\n"
    
    full_response = []

    async def generate():
        async with httpx.AsyncClient(timeout=120) as client:
            async with client.stream(
                "POST",
                f"{LLAMA_SERVER}/completion",
                json={
                    "prompt":         prompt,
                    "n_predict":      200,
                    "stream":         True,
                    "temperature":    1.0,
                    "top_p":          0.95,
                    "top_k":          64,
                    "repeat_penalty": 1.1,
                    "stop": ["<end_of_turn>", "user", "model"]
                },
            ) as response:
                async for line in response.aiter_lines():
                    if not line.startswith("data: "):
                        continue
                    if line.strip() == "data: [DONE]":
                        break
                    try:
                        data  = json.loads(line[6:])
                        token = data.get("content", "")
                        if not token:
                            continue
                        
                        # Strip artifact tokens mid-stream
                        token = token.replace("<end_of_turn>", "") \
                                     .replace("<start_of_turn>", "")
                        if token:
                            full_response.append(token)
                            yield f"data: {json.dumps({'token': token})}\n\n"
                    except Exception:
                        continue

        complete = clean_response("".join(full_response))
        flag     = check_referral(complete)
        save_consultation(
            req.patient_id, req.query, complete, flag, req.language
        )
        yield f"data: {json.dumps({'done': True, 'referral': flag})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")

@app.get("/api/patients")
def list_patients(search: str = ""):
    conn = get_db()
    if search:
        rows = conn.execute(
            "SELECT * FROM patients WHERE name LIKE ? OR id LIKE ?",
            (f"%{search}%", f"%{search}%")
        ).fetchall()
    else:
        rows = conn.execute(
            "SELECT * FROM patients ORDER BY created_at DESC"
        ).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.post("/api/patients")
def add_patient(p: PatientIn):
    conn = get_db()
    conn.execute(
        """INSERT OR REPLACE INTO patients
           (id, name, age, sex, village, contact)
           VALUES (?,?,?,?,?,?)""",
        (p.id, p.name, p.age, p.sex, p.village, p.contact)
    )
    conn.commit()
    conn.close()
    return {"status": "created", "id": p.id}

@app.post("/api/vitals")
def add_vitals(v: VitalsIn):
    conn = get_db()
    conn.execute(
        """INSERT INTO vitals
           (patient_id, bp_systolic, bp_diastolic, temperature, weight, spo2)
           VALUES (?,?,?,?,?,?)""",
        (v.patient_id, v.bp_systolic, v.bp_diastolic,
         v.temperature, v.weight, v.spo2)
    )
    conn.commit()
    conn.close()
    return {"status": "saved"}

@app.get("/api/drugs")
def list_drugs(search: str = ""):
    conn = get_db()
    if search:
        rows = conn.execute(
            "SELECT * FROM drugs WHERE name LIKE ? OR category LIKE ?",
            (f"%{search}%", f"%{search}%")
        ).fetchall()
    else:
        rows = conn.execute("SELECT * FROM drugs").fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.get("/api/consultations/{patient_id}")
def get_consultations(patient_id: str):
    conn = get_db()
    rows = conn.execute(
        """SELECT * FROM consultations
           WHERE patient_id = ?
           ORDER BY created_at DESC LIMIT 20""",
        (patient_id,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.get("/api/stats")
def stats():
    conn = get_db()
    data = {
        "patients_total": conn.execute(
            "SELECT COUNT(*) FROM patients"
        ).fetchone()[0],
        "consultations_today": conn.execute(
            "SELECT COUNT(*) FROM consultations "
            "WHERE DATE(created_at) = DATE('now')"
        ).fetchone()[0],
        "referrals_this_week": conn.execute(
            "SELECT COUNT(*) FROM consultations "
            "WHERE referral_flag=1 "
            "AND created_at >= DATE('now','-7 days')"
        ).fetchone()[0],
        "drugs_out_of_stock": conn.execute(
            "SELECT COUNT(*) FROM drugs WHERE in_stock=0"
        ).fetchone()[0],
    }
    conn.close()
    return data
