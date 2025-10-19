import os, json, numpy as np
from tqdm import tqdm
from sentence_transformers import SentenceTransformer
from pymongo import MongoClient
from dotenv import load_dotenv

# Resolve paths relative to this file
HERE = os.path.dirname(os.path.abspath(__file__))
ENV_PATH = os.path.join(os.path.dirname(HERE), ".env")  # server/.env
load_dotenv(ENV_PATH)

MONGO = os.getenv("MONGO_URL", "mongodb://localhost:27017/elevatedb")
DBNAME = os.getenv("MONGO_DBNAME")  # optional; if not set we use default db from URL

OUT = os.path.join(HERE, "index_jobs.faiss")
OUT_META = os.path.join(HERE, "index_jobs_meta.json")
MODEL_NAME = os.getenv("EMBED_MODEL", "sentence-transformers/all-MiniLM-L6-v2")

from tqdm.auto import tqdm
import faiss

def get_db():
    client = MongoClient(MONGO)
    if DBNAME:
        return client[DBNAME]
    db = client.get_default_database()
    if db is None:
        return client["elevatedb"]  # fallback if URL has no db name
    return db


db = get_db()
jobs = list(db.jobs.find({}, {"title":1,"company":1,"location":1,"description":1,"tags":1}))
print(f"Loaded {len(jobs)} jobs from MongoDB")

def textify(j):
    parts = [j.get("title",""), j.get("company",""), j.get("location",""),
             " ".join(j.get("tags",[]) or []), j.get("description","")]
    return " • ".join([p for p in parts if p])

model = SentenceTransformer(MODEL_NAME)

vecs = []
for j in tqdm(jobs):
    vec = model.encode(textify(j), normalize_embeddings=True)
    vecs.append(vec)

if not vecs:
    raise SystemExit("No jobs found to embed. Seed jobs first.")

X = np.vstack(vecs).astype("float32")
index = faiss.IndexFlatIP(X.shape[1])  # use dot product on normalized vectors == cosine sim
index.add(X)

faiss.write_index(index, OUT)
with open(OUT_META, "w", encoding="utf-8") as f:
    json.dump({ "ids": [str(j["_id"]) for j in jobs] }, f)

print(f"Built FAISS index: {X.shape} → {OUT}")
