import os, json, numpy as np
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv
import faiss

HERE = os.path.dirname(os.path.abspath(__file__))
ENV_PATH = os.path.join(os.path.dirname(HERE), ".env")  # server/.env
load_dotenv(ENV_PATH)

MODEL = os.getenv("EMBED_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
INDEX = os.path.join(HERE, "index_skills.faiss")
META  = os.path.join(HERE, "index_skills_meta.json")

VOCAB = [
    "react","next.js","node.js","express","typescript","javascript","python","java","spring",
    "django","flask","fastapi","mongodb","mysql","postgresql","redis","graphql","docker",
    "kubernetes","aws","gcp","azure","tailwind","html","css","git","jenkins","kafka",
    "spark","pandas","numpy","tensorflow","pytorch","scikit-learn","nlp","computer vision",
    "golang","rust","kotlin","c++","c","data engineer","devops","sre","qa testing",
    "product management","ui/ux design","marketing","seo","finance","accounting","hr"
]

model = SentenceTransformer(MODEL)
X = model.encode(VOCAB, normalize_embeddings=True).astype("float32")

index = faiss.IndexFlatIP(X.shape[1])
index.add(X)

faiss.write_index(index, INDEX)
with open(META, "w", encoding="utf-8") as f:
    json.dump({ "skills": VOCAB }, f)

print(f"Skill index saved → {INDEX} ({len(VOCAB)} skills)")
