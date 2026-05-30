from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.database import get_db
from app.models.link import Link
from app.models.group import Group
from app.models.pdf import PDF

router = APIRouter()


@router.get("/")
async def get_stats(db: AsyncSession = Depends(get_db)):
    total_links = await db.scalar(select(func.count(Link.id)))
    total_groups = await db.scalar(select(func.count(Group.id)))
    total_pdfs = await db.scalar(select(func.count(PDF.id)))
    favorite_links = await db.scalar(select(func.count(Link.id)).where(Link.is_favorite == True))
    unread_links = await db.scalar(select(func.count(Link.id)).where(Link.is_read == False))

    # Links per provider
    provider_result = await db.execute(
        select(Link.llm_provider, func.count(Link.id)).group_by(Link.llm_provider)
    )
    providers = {row[0]: row[1] for row in provider_result.fetchall()}

    return {
        "total_links": total_links or 0,
        "total_groups": total_groups or 0,
        "total_pdfs": total_pdfs or 0,
        "favorite_links": favorite_links or 0,
        "unread_links": unread_links or 0,
        "links_by_provider": providers,
    }
