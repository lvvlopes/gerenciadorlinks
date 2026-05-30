from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel
from typing import Optional

from app.core.database import get_db
from app.models.group import Group

router = APIRouter()


class GroupCreate(BaseModel):
    name: str
    description: Optional[str] = None
    color: str = "#6366f1"
    icon: str = "folder"


class GroupUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    icon: Optional[str] = None


@router.post("/")
async def create_group(data: GroupCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(Group).where(Group.name == data.name))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Grupo com este nome já existe")

    group = Group(**data.model_dump())
    db.add(group)
    await db.commit()
    await db.refresh(group)
    return _group_to_dict(group)


@router.get("/")
async def list_groups(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Group).order_by(Group.name))
    groups = result.scalars().all()
    return [_group_to_dict(g) for g in groups]


@router.get("/{group_id}")
async def get_group(group_id: str, db: AsyncSession = Depends(get_db)):
    group = await db.get(Group, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Grupo não encontrado")
    return _group_to_dict(group)


@router.patch("/{group_id}")
async def update_group(group_id: str, data: GroupUpdate, db: AsyncSession = Depends(get_db)):
    group = await db.get(Group, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Grupo não encontrado")

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(group, field, value)

    await db.commit()
    await db.refresh(group)
    return _group_to_dict(group)


@router.delete("/{group_id}")
async def delete_group(group_id: str, db: AsyncSession = Depends(get_db)):
    group = await db.get(Group, group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Grupo não encontrado")

    await db.delete(group)
    await db.commit()
    return {"message": "Grupo removido com sucesso"}


def _group_to_dict(group: Group) -> dict:
    return {
        "id": group.id,
        "name": group.name,
        "description": group.description,
        "color": group.color,
        "icon": group.icon,
        "links_count": group.links_count or 0,
        "created_at": group.created_at.isoformat() if group.created_at else None,
    }
