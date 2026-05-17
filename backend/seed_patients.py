"""
Seed realistic patient + consultation data to demo:
  1. Symptom cluster alert (dengue-like fever cluster in Kunigal)
  2. Weekly digest (variety of villages, symptoms, referrals)
"""
import sqlite3
from datetime import datetime, timedelta
import random

DB_PATH = "../data/swasthya.db"
conn = sqlite3.connect(DB_PATH)

NOW = datetime.now()

def ts(hours_ago=0, days_ago=0):
    return (NOW - timedelta(hours=hours_ago, days=days_ago)).strftime("%Y-%m-%d %H:%M:%S")

# ── 1. Clear existing demo data (keep real data) ──────────────────────────────
# Only delete rows we seeded (identified by PHC-SEED- prefix)
conn.execute("DELETE FROM patients WHERE id LIKE 'PHC-SEED-%'")
conn.execute("DELETE FROM consultations WHERE patient_id LIKE 'PHC-SEED-%'")
conn.commit()

# ── 2. Patients ───────────────────────────────────────────────────────────────
patients = [
    # Kunigal fever cluster (7 patients, last 48h → should trigger HIGH ALERT)
    ("PHC-SEED-001", "Ramesh Kumar",    42, "M", "Kunigal",       "9845001001", "fever, headache, body pain"),
    ("PHC-SEED-002", "Savitha Nair",    28, "F", "Kunigal",       "9845001002", "fever, vomiting, chills"),
    ("PHC-SEED-003", "Murugan S",       35, "M", "Kunigal",       "9845001003", "high fever, rash"),
    ("PHC-SEED-004", "Lakshmi Devi",    22, "F", "Kunigal",       "9845001004", "fever, joint pain"),
    ("PHC-SEED-005", "Arun Prakash",    19, "M", "Kunigal",       "9845001005", "fever, headache"),
    ("PHC-SEED-006", "Geetha B",        31, "F", "Kunigal",       "9845001006", "fever, body aches, nausea"),
    ("PHC-SEED-007", "Suresh Gowda",    55, "M", "Kunigal",       "9845001007", "fever, rash, vomiting"),

    # Doddaballapur — mixed conditions, weekly digest material
    ("PHC-SEED-008", "Anita Sharma",    34, "F", "Doddaballapur", "9845001008", "cough, fever, cold"),
    ("PHC-SEED-009", "Venkatesh R",     60, "M", "Doddaballapur", "9845001009", "high BP, dizziness"),
    ("PHC-SEED-010", "Priya Kumari",    26, "F", "Doddaballapur", "9845001010", "ANC checkup, 7 months pregnant"),
    ("PHC-SEED-011", "Mohan Das",       48, "M", "Doddaballapur", "9845001011", "diabetes follow-up, high sugar"),
    ("PHC-SEED-012", "Ramu Naik",       38, "M", "Doddaballapur", "9845001012", "TB recheckup, cough"),

    # Hosahalli — diarrhoea cluster (5 patients, last 3 days)
    ("PHC-SEED-013", "Kavitha M",       25, "F", "Hosahalli",     "9845001013", "diarrhoea, vomiting, dehydration"),
    ("PHC-SEED-014", "Rajappa K",       40, "M", "Hosahalli",     "9845001014", "diarrhoea, stomach cramps"),
    ("PHC-SEED-015", "Meenakshi P",     33, "F", "Hosahalli",     "9845001015", "diarrhoea, weakness"),
    ("PHC-SEED-016", "Basavaraj N",     12, "M", "Hosahalli",     "9845001016", "diarrhoea, fever, child"),
    ("PHC-SEED-017", "Sunitha Reddy",   29, "F", "Hosahalli",     "9845001017", "diarrhoea, vomiting"),

    # Tumkur Road — respiratory
    ("PHC-SEED-018", "Anil Kumar",      45, "M", "Tumkur Road",   "9845001018", "cough, breathlessness, chest pain"),
    ("PHC-SEED-019", "Padmavathi",      52, "F", "Tumkur Road",   "9845001019", "respiratory infection, fever"),
    ("PHC-SEED-020", "Shivakumar T",    67, "M", "Tumkur Road",   "9845001020", "COPD, cough, wheezing"),
]

for p in patients:
    pid, name, age, sex, village, contact, symptoms = p
    conn.execute(
        """INSERT OR REPLACE INTO patients
           (id, name, age, sex, village, contact, symptoms, created_at)
           VALUES (?,?,?,?,?,?,?,?)""",
        (pid, name, age, sex, village, contact, symptoms, ts(days_ago=random.randint(0,14)))
    )

conn.commit()
print(f"✓ Inserted {len(patients)} patients")

# ── 3. Consultations ──────────────────────────────────────────────────────────
# Kunigal fever cluster: 7 consultations within last 48 hours
kunigal_queries = [
    ("PHC-SEED-001", "Patient has fever 39.5C for 3 days, severe headache and body pain. Village: Kunigal.", "fever, headache, body pain",       False, "new",     36),
    ("PHC-SEED-002", "Fever with vomiting and chills. 28F from Kunigal.",                                   "fever, vomiting, chills",           False, "new",     30),
    ("PHC-SEED-003", "High fever and skin rash. Male 35 years, Kunigal.",                                   "high fever, rash",                  True,  "new",     24),
    ("PHC-SEED-004", "Fever with joint pain. Female 22 years.",                                             "fever, joint pain",                 False, "new",     20),
    ("PHC-SEED-005", "Fever and severe headache, 19M.",                                                     "fever, headache",                   False, "new",     15),
    ("PHC-SEED-006", "Fever, body aches, nausea — 3 days. Kunigal village.",                                "fever, body aches, nausea",         False, "new",     10),
    ("PHC-SEED-007", "Fever 40C, rash and vomiting. 55M from Kunigal.",                                    "fever, rash, vomiting",             True,  "referral", 5),
]

# Hosahalli diarrhoea cluster: 5 consultations within last 3 days
hosahalli_queries = [
    ("PHC-SEED-013", "Severe diarrhoea and vomiting with dehydration. Hosahalli.",                          "diarrhoea, vomiting, dehydration",  True,  "new",     62),
    ("PHC-SEED-014", "Diarrhoea with stomach cramps. 40M.",                                                 "diarrhoea, stomach cramps",         False, "new",     55),
    ("PHC-SEED-015", "Loose motions x6/day, weakness.",                                                     "diarrhoea, weakness",               False, "new",     48),
    ("PHC-SEED-016", "Child 12 years, diarrhoea and fever.",                                                "diarrhoea, fever, child",           True,  "new",     40),
    ("PHC-SEED-017", "Diarrhoea and vomiting since 2 days. 29F Hosahalli.",                                 "diarrhoea, vomiting",               False, "new",     32),
]

# Weekly variety consultations (spread over last 7 days)
weekly_queries = [
    ("PHC-SEED-008", "Cough and fever for 5 days. ARI suspected.",                       "cough, fever",                False, "new",       120),
    ("PHC-SEED-009", "BP 165/102. Hypertensive patient on Amlodipine. Follow-up.",       "hypertension, dizziness",     False, "recheckup", 96),
    ("PHC-SEED-010", "ANC visit 28 weeks. BP normal. Haemoglobin 9.2.",                  "ANC, pregnancy",              False, "new",       80),
    ("PHC-SEED-011", "Blood glucose 280 mg/dL. Diabetic poorly controlled.",             "diabetes, hyperglycemia",     True,  "recheckup", 70),
    ("PHC-SEED-012", "TB DOTS month 4 recheckup. Cough reduced. Weight 52kg.",           "TB, cough",                   False, "recheckup", 60),
    ("PHC-SEED-018", "Chest pain and breathlessness. Referred to district hospital.",    "cough, breathlessness",       True,  "referral",  50),
    ("PHC-SEED-019", "Respiratory infection with high fever. Treated with Amoxicillin.", "cough, fever, respiratory",   False, "new",       45),
    ("PHC-SEED-020", "COPD exacerbation. Wheezing, SpO2 88%. Referred urgently.",       "COPD, wheezing",              True,  "referral",  40),
]

all_consultations = kunigal_queries + hosahalli_queries + weekly_queries

ai_responses = {
    True:  "[REFERRAL NEEDED]\nThis case requires urgent referral to CHC or district hospital based on danger signs.",
    False: "Based on the clinical presentation and MOHFW guidelines, symptomatic management is recommended. Monitor for danger signs.",
}

for c in all_consultations:
    pid, query, symptoms, referral, visit_type, hours_ago = c
    # Fetch village from patient
    row = conn.execute("SELECT village FROM patients WHERE id=?", (pid,)).fetchone()
    village = row[0] if row else None
    conn.execute(
        """INSERT INTO consultations
           (patient_id, query, ai_response, referral_flag, language, visit_type, symptoms, village, created_at)
           VALUES (?,?,?,?,?,?,?,?,?)""",
        (pid, query, ai_responses[referral], int(referral), "en", visit_type,
         symptoms, village, ts(hours_ago=hours_ago))
    )

conn.commit()
print(f"✓ Inserted {len(all_consultations)} consultations")
print(f"\nExpected cluster alerts:")
print(f"  🔴 HIGH — Kunigal: 7 fever cases in last 48h")
print(f"  🟡 MEDIUM — Hosahalli: 5 diarrhoea cases in last 72h")
print(f"\nWeekly digest will show:")
print(f"  Top symptoms: fever, diarrhoea, cough, TB, diabetes, hypertension")
print(f"  Village burden: Kunigal (7), Hosahalli (5), Doddaballapur (5), Tumkur Road (3)")
print(f"  Referrals: {sum(1 for c in all_consultations if c[3])}/{len(all_consultations)}")

conn.close()
