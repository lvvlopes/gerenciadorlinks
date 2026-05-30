from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Boolean, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.core.database import Base


class Link(Base):
    __tablename__ = "links"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    url = Column(Text, nullable=False)
    title = Column(String(500), nullable=False)
    custom_title = Column(String(500), nullable=True)
    summary = Column(Text, nullable=True)
    custom_notes = Column(Text, nullable=True)
    favicon = Column(Text, nullable=True)
    thumbnail = Column(Text, nullable=True)
    tags = Column(JSON, default=list)
    is_favorite = Column(Boolean, default=False)
    is_read = Column(Boolean, default=False)
    llm_provider = Column(String(20), default="anthropic")

    group_id = Column(String, ForeignKey("groups.id", ondelete="SET NULL"), nullable=True)
    group = relationship("Group", back_populates="links")
    pdfs = relationship("PDF", back_populates="link", cascade="all, delete-orphan")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    @property
    def display_title(self):
        return self.custom_title or self.title
