import os, json, argparse, numpy as np
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer
import faiss

HERE = os.path.dirname(os.path.abspath(__file__))
ENV_PATH = os.path.join(os.path.dirname(HERE), ".env")  # server/.env
load_dotenv(ENV_PATH)

MODEL_NAME = os.getenv("EMBED_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
_model = None
def model():
    global _model
    if _model is None:
        _model = SentenceTransformer(MODEL_NAME)
    return _model

def load_jobs():
    idx = faiss.read_index(os.path.join(HERE, "index_jobs.faiss"))
    with open(os.path.join(HERE, "index_jobs_meta.json"), "r", encoding="utf-8") as f:
        meta = json.load(f)
    ids = meta["ids"]
    return idx, ids

def load_skills():
    idx = faiss.read_index(os.path.join(HERE, "index_skills.faiss"))
    with open(os.path.join(HERE, "index_skills_meta.json"), "r", encoding="utf-8") as f:
        meta = json.load(f)
    skills = meta["skills"]
    return idx, skills

def encode(text):
    v = model().encode(text, normalize_embeddings=True).astype("float32")
    if v.ndim == 1:
        v = v[None, :]
    return v

def search_jobs(query, topk):
    idx, ids = load_jobs()
    q = encode(query)
    scores, I = idx.search(q, topk)
    I = I[0].tolist()
    scores = scores[0].tolist()
    out = [{"id": ids[i], "score": float(s)} for i, s in zip(I, scores) if 0 <= i < len(ids)]
    return out

def search_skills(query, topk):
    idx, skills = load_skills()
    q = encode(query)
    scores, I = idx.search(q, topk)
    I = I[0].tolist()
    scores = scores[0].tolist()
    out = [{"skill": skills[i], "score": float(s)} for i, s in zip(I, scores) if 0 <= i < len(skills)]
    return out

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--space", choices=["jobs", "skills"], required=True)
    ap.add_argument("--q", required=True)
    ap.add_argument("--topk", type=int, default=20)
    args = ap.parse_args()

    if args.space == "jobs":
        res = search_jobs(args.q, args.topk)
    else:
        res = search_skills(args.q, args.topk)

    print(json.dumps({"ok": True, "results": res}, ensure_ascii=False))

if __name__ == "__main__":
    main()
