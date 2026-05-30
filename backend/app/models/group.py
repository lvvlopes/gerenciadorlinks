from sqlalchemy import Column, String, DateTime, Text, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.core.database import Base


class Group(Base):
    __tablename__ = "groups"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False, unique=True)
    description = Column(Text, nullable=True)
    color = Column(String(7), default="#6366f1")  # hex color
    icon = Column(String(50), default="folder")
    links_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    links = relationship("Link", back_populates="group", cascade="all, delete-orphan")
