from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os

from app.core.database import create_tables
from app.api import links, groups, pdfs, llm, stats, bulk

# Caminho absoluto baseado na localização do main.py
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_tables()
    yield


app = FastAPI(
    title="LinkVault API",
    description="Gerencie seus links favoritos com resumos via IA",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

app.include_router(links.router, prefix="/api/links", tags=["links"])
app.include_router(groups.router, prefix="/api/groups", tags=["groups"])
app.include_router(pdfs.router, prefix="/api/pdfs", tags=["pdfs"])
app.include_router(llm.router, prefix="/api/llm", tags=["llm"])
app.include_router(stats.router, prefix="/api/stats", tags=["stats"])
app.include_router(bulk.router, prefix="/api", tags=["bulk"])


@app.get("/")
async def root():
    return {"message": "LinkVault API running!", "docs": "/docs"}


@app.get("/health")
async def health():
    return {"status": "ok"}
