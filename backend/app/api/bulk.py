from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional
import asyncio

from app.core.database import get_db, AsyncSessionLocal
from app.models.link import Link
from app.models.group import Group
from app.services.scraper_service import scrape_url, is_valid_url
from app.services.llm_service import generate_summary

router = APIRouter()


class BulkImportRequest(BaseModel):
    urls: list[str]
    group_id: Optional[str] = None
    llm_provider: str = "anthropic"


class BulkImportStatus(BaseModel):
    job_id: str
    total: int
    processed: int
    success: int
    failed: int
    errors: list[dict]
    done: bool


# In-memory job store (use Redis in production)
_jobs: dict[str, dict] = {}


@router.post("/bulk-import")
async def bulk_import(
    data: BulkImportRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
):
    valid_urls = [u for u in data.urls if is_valid_url(u.strip())]
    if not valid_urls:
        raise HTTPException(status_code=400, detail="Nenhuma URL válida encontrada")
    if len(valid_urls) > 50:
        raise HTTPException(status_code=400, detail="Máximo de 50 URLs por importação")

    import uuid
    job_id = str(uuid.uuid4())
    _jobs[job_id] = {
        "total": len(valid_urls),
        "processed": 0,
        "success": 0,
        "failed": 0,
        "errors": [],
        "done": False,
    }

    background_tasks.add_task(
        _process_bulk_import,
        job_id=job_id,
        urls=valid_urls,
        group_id=data.group_id,
        llm_provider=data.llm_provider,
    )

    return {"job_id": job_id, "total": len(valid_urls), "message": "Importação iniciada"}


@router.get("/bulk-import/{job_id}")
async def get_bulk_import_status(job_id: str):
    job = _jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job não encontrado")
    return {"job_id": job_id, **job}


async def _process_bulk_import(
    job_id: str,
    urls: list[str],
    group_id: Optional[str],
    llm_provider: str,
):
    job = _jobs[job_id]

    for url in urls:
        try:
            async with AsyncSessionLocal() as db:
                # Check duplicate
                from sqlalchemy import select
                existing = await db.execute(select(Link).where(Link.url == url))
                if existing.scalar_one_or_none():
                    job["processed"] += 1
                    job["failed"] += 1
                    job["errors"].append({"url": url, "error": "URL já cadastrada"})
                    continue

                scraped = await scrape_url(url)
                result = await generate_summary(
                    title=scraped["title"],
                    content=scraped["content"],
                    provider=llm_provider,
                )

                link = Link(
                    url=url,
                    title=scraped["title"],
                    summary=result.get("summary", ""),
                    favicon=scraped["favicon"],
                    thumbnail=scraped["thumbnail"],
                    tags=result.get("tags", []),
                    group_id=group_id,
                    llm_provider=llm_provider,
                )
                db.add(link)

                if group_id:
                    group = await db.get(Group, group_id)
                    if group:
                        group.links_count = (group.links_count or 0) + 1

                await db.commit()
                job["success"] += 1

        except Exception as e:
            job["failed"] += 1
            job["errors"].append({"url": url, "error": str(e)[:100]})

        finally:
            job["processed"] += 1

        # Rate limit between requests
        await asyncio.sleep(0.5)

    job["done"] = True
