from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from typing import Optional
from pydantic import BaseModel
import json

from app.core.database import get_db
from app.models.link import Link
from app.models.group import Group
from app.models.pdf import PDF
from app.services.scraper_service import scrape_url, is_valid_url
from app.services.llm_service import generate_summary

router = APIRouter()


class LinkCreate(BaseModel):
    url: str
    group_id: Optional[str] = None
    llm_provider: str = ""  # vazio = usa DEFAULT_LLM_PROVIDER do ambiente
    custom_title: Optional[str] = None
    custom_notes: Optional[str] = None
    # Campos enviados pela extensão Chrome (conteúdo já extraído do DOM)
    social_description: Optional[str] = None
    extracted_title: Optional[str] = None
    extracted_thumbnail: Optional[str] = None


class LinkUpdate(BaseModel):
    custom_title: Optional[str] = None
    custom_notes: Optional[str] = None
    group_id: Optional[str] = None
    is_favorite: Optional[bool] = None
    is_read: Optional[bool] = None
    tags: Optional[list[str]] = None


@router.post("/")
async def create_link(data: LinkCreate, db: AsyncSession = Depends(get_db)):
    if not is_valid_url(data.url):
        raise HTTPException(status_code=400, detail="URL inválida")

    # Check if URL already exists
    existing = await db.execute(select(Link).where(Link.url == data.url))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Este link já foi cadastrado")

    # Se a extensão já mandou o conteúdo extraído, pula o scraping
    if data.social_description and data.extracted_title:
        scraped = {
            "title": data.extracted_title,
            "content": data.social_description,
            "favicon": f"https://www.google.com/s2/favicons?domain={data.url.split('/')[2]}&sz=32",
            "thumbnail": data.extracted_thumbnail,
        }
    else:
        # Scraping normal para sites comuns
        try:
            scraped = await scrape_url(data.url)
        except ValueError as e:
            raise HTTPException(status_code=422, detail=str(e))

        # Se veio social_description do formulário manual, usa ela como conteúdo
        if data.social_description:
            scraped["content"] = data.social_description

    # Gera resumo com o melhor conteúdo disponível
    summary_content = scraped["content"] or scraped["title"]
    result = await generate_summary(
        title=data.custom_title or scraped["title"],
        content=summary_content,
        provider=data.llm_provider,
    )

    link = Link(
        url=data.url,
        title=scraped["title"],
        custom_title=data.custom_title,
        custom_notes=data.custom_notes,
        summary=result.get("summary", ""),
        favicon=scraped["favicon"],
        thumbnail=data.extracted_thumbnail or scraped.get("thumbnail"),
        tags=result.get("tags", []),
        group_id=data.group_id,
        llm_provider=data.llm_provider,
    )
    db.add(link)

    # Update group links count
    if data.group_id:
        group = await db.get(Group, data.group_id)
        if group:
            group.links_count = (group.links_count or 0) + 1

    await db.commit()
    await db.refresh(link)
    return _link_to_dict(link)


@router.get("/")
async def list_links(
    group_id: Optional[str] = None,
    search: Optional[str] = None,
    is_favorite: Optional[bool] = None,
    is_read: Optional[bool] = None,
    tag: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    query = select(Link).order_by(Link.created_at.desc())

    if group_id:
        query = query.where(Link.group_id == group_id)
    if is_favorite is not None:
        query = query.where(Link.is_favorite == is_favorite)
    if is_read is not None:
        query = query.where(Link.is_read == is_read)
    if search:
        search_term = f"%{search}%"
        query = query.where(
            or_(
                Link.title.ilike(search_term),
                Link.custom_title.ilike(search_term),
                Link.summary.ilike(search_term),
                Link.url.ilike(search_term),
            )
        )

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query)

    # Paginate
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)
    result = await db.execute(query)
    links = result.scalars().all()

    return {
        "items": [_link_to_dict(l) for l in links],
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": (total + page_size - 1) // page_size,
    }


@router.get("/{link_id}")
async def get_link(link_id: str, db: AsyncSession = Depends(get_db)):
    link = await db.get(Link, link_id)
    if not link:
        raise HTTPException(status_code=404, detail="Link não encontrado")
    await db.refresh(link, ["pdfs"])
    return _link_to_dict(link, include_pdfs=True)


@router.patch("/{link_id}")
async def update_link(link_id: str, data: LinkUpdate, db: AsyncSession = Depends(get_db)):
    link = await db.get(Link, link_id)
    if not link:
        raise HTTPException(status_code=404, detail="Link não encontrado")

    # Handle group change
    if data.group_id is not None and data.group_id != link.group_id:
        if link.group_id:
            old_group = await db.get(Group, link.group_id)
            if old_group:
                old_group.links_count = max(0, (old_group.links_count or 0) - 1)
        if data.group_id:
            new_group = await db.get(Group, data.group_id)
            if new_group:
                new_group.links_count = (new_group.links_count or 0) + 1

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(link, field, value)

    await db.commit()
    await db.refresh(link)
    return _link_to_dict(link)


@router.delete("/{link_id}")
async def delete_link(link_id: str, db: AsyncSession = Depends(get_db)):
    link = await db.get(Link, link_id)
    if not link:
        raise HTTPException(status_code=404, detail="Link não encontrado")

    if link.group_id:
        group = await db.get(Group, link.group_id)
        if group:
            group.links_count = max(0, (group.links_count or 0) - 1)

    await db.delete(link)
    await db.commit()
    return {"message": "Link removido com sucesso"}


@router.post("/{link_id}/regenerate-summary")
async def regenerate_summary(
    link_id: str,
    provider: str = "anthropic",
    db: AsyncSession = Depends(get_db),
):
    link = await db.get(Link, link_id)
    if not link:
        raise HTTPException(status_code=404, detail="Link não encontrado")

    try:
        scraped = await scrape_url(link.url)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    result = await generate_summary(
        title=scraped["title"],
        content=scraped["content"],
        provider=provider,
    )

    link.summary = result.get("summary", link.summary)
    link.tags = result.get("tags", link.tags)
    link.llm_provider = provider

    await db.commit()
    await db.refresh(link)
    return _link_to_dict(link)


def _link_to_dict(link: Link, include_pdfs: bool = False) -> dict:
    data = {
        "id": link.id,
        "url": link.url,
        "title": link.title,
        "custom_title": link.custom_title,
        "display_title": link.custom_title or link.title,
        "summary": link.summary,
        "custom_notes": link.custom_notes,
        "favicon": link.favicon,
        "thumbnail": link.thumbnail,
        "tags": link.tags or [],
        "is_favorite": link.is_favorite,
        "is_read": link.is_read,
        "group_id": link.group_id,
        "llm_provider": link.llm_provider,
        "created_at": link.created_at.isoformat() if link.created_at else None,
        "updated_at": link.updated_at.isoformat() if link.updated_at else None,
    }
    if include_pdfs and hasattr(link, "pdfs"):
        data["pdfs"] = [
            {
                "id": p.id,
                "filename": p.original_filename,
                "file_path": p.file_path,
                "file_size": p.file_size,
                "description": p.description,
                "pages": p.pages,
                "created_at": p.created_at.isoformat() if p.created_at else None,
            }
            for p in link.pdfs
        ]
    return data
