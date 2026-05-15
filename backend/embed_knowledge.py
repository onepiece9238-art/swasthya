import chromadb
from sentence_transformers import SentenceTransformer
import os, glob

def load_text(file_path):
    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        return f.read()

def chunk_text(text, chunk_size=500, overlap=50):
    words = text.split()
    chunks, i = [], 0
    while i < len(words):
        chunks.append(" ".join(words[i:i + chunk_size]))
        i += chunk_size - overlap
    return [c for c in chunks if c.strip()]

print("Loading embedding model...")
embedder = SentenceTransformer("all-MiniLM-L6-v2")

chroma     = chromadb.PersistentClient(path="../data/chromadb")
collection = chroma.get_or_create_collection("mohfw_knowledge")

# Pick up both txt and pdf files
all_files = glob.glob("../knowledge/*.txt") + glob.glob("../knowledge/*.pdf")
print(f"Found {len(all_files)} files: {[os.path.basename(f) for f in all_files]}")

if not all_files:
    print("No files found in ../knowledge/ — check the folder")
    exit(1)

for file_path in all_files:
    fname = os.path.basename(file_path)
    print(f"\nProcessing {fname}...")

    if file_path.endswith(".pdf"):
        from pypdf import PdfReader
        reader = PdfReader(file_path)
        text   = "\n".join(page.extract_text() or "" for page in reader.pages)
    else:
        text = load_text(file_path)

    if not text.strip():
        print(f"  Warning: no text extracted, skipping")
        continue

    chunks = chunk_text(text)
    print(f"  {len(chunks)} chunks — embedding...")

    for i, chunk in enumerate(chunks):
        embedding = embedder.encode(chunk).tolist()
        collection.upsert(
            documents=[chunk],
            embeddings=[embedding],
            ids=[f"{fname}_{i}"],
            metadatas=[{"source": fname}]
        )

    print(f"  Done.")

print(f"\nTotal chunks in ChromaDB: {collection.count()}")
