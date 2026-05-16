import sqlite3

DB_PATH = "../data/swasthya.db"

def setup_drugs():
    conn = sqlite3.connect(DB_PATH)
    
    # 1. Add column if not exists
    try:
        conn.execute("ALTER TABLE drugs ADD COLUMN importance_flag TEXT")
        print("Added importance_flag column to drugs table.")
    except sqlite3.OperationalError:
        print("Column importance_flag already exists or other error.")
        pass

    # 2. Seed data
    seed_data = [
        ("Paracetamol", "Analgesic/Antipyretic", "500mg tablets", 1, "2027-12-31", 
         "Essential for managing fever and mild to moderate pain. Highly critical for basic symptomatic relief in all centers."),
        ("Amoxicillin", "Antibiotic", "250mg/500mg capsules", 1, "2026-08-30", 
         "First-line antibiotic for common bacterial infections like pneumonia. Crucial for treating acute respiratory infections."),
        ("ORS (Oral Rehydration Salts)", "Fluid Replacement", "Sachets", 1, "2028-01-01", 
         "Life-saving treatment for dehydration due to diarrhea. Absolutely essential for both PHCs and CHCs."),
        ("Metformin", "Antidiabetic", "500mg tablets", 1, "2027-05-15", 
         "Primary medication for managing Type 2 Diabetes. Important for chronic disease management at the PHC level."),
        ("Chloroquine", "Antimalarial", "250mg tablets", 1, "2026-10-20", 
         "Critical for the treatment of Plasmodium vivax malaria. Essential in malaria-endemic regions.")
    ]
    
    for drug in seed_data:
        conn.execute(
            """INSERT INTO drugs (name, category, dosage, in_stock, expiry_date, importance_flag)
               VALUES (?, ?, ?, ?, ?, ?)""",
            drug
        )
    
    conn.commit()
    print(f"Seeded {len(seed_data)} essential drugs.")
    conn.close()

if __name__ == "__main__":
    setup_drugs()
