from sqlalchemy import Column, String, DateTime, Text, ForeignKey, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.core.database import Base


class PDF(Base):
    __tablename__ = "pdfs"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    filename = Column(String(500), nullable=False)
    original_filename = Column(String(500), nullable=False)
    file_path = Column(Text, nullable=False)
    file_size = Column(Integer, default=0)  # bytes
    description = Column(Text, nullable=True)
    pages = Column(Integer, nullable=True)

    link_id = Column(String, ForeignKey("links.id", ondelete="CASCADE"), nullable=False)
    link = relationship("Link", back_populates="pdfs")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
