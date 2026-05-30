from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
import os
import uuid
import aiofiles

from app.core.database import get_db
from app.core.config import settings
from app.models.pdf import PDF
from app.models.link import Link

router = APIRouter()

MAX_FILE_SIZE = settings.MAX_FILE_SIZE_MB * 1024 * 1024


@router.post("/upload/{link_id}")
async def upload_pdf(
    link_id: str,
    file: UploadFile = File(...),
    description: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
):
    link = await db.get(Link, link_id)
    if not link:
        raise HTTPException(status_code=404, detail="Link não encontrado")

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Apenas arquivos PDF são aceitos")

    # Read file content
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"Arquivo muito grande. Máximo: {settings.MAX_FILE_SIZE_MB}MB",
        )

    # Save file
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    file_id = str(uuid.uuid4())
    filename = f"{file_id}.pdf"
    file_path = os.path.join(settings.UPLOAD_DIR, filename)

    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)

    # Count pages
    pages = _count_pdf_pages(content)

    pdf = PDF(
        filename=filename,
        original_filename=file.filename,
        file_path=f"/uploads/{filename}",
        file_size=len(content),
        description=description,
        pages=pages,
        link_id=link_id,
    )
    db.add(pdf)
    await db.commit()
    await db.refresh(pdf)

    return {
        "id": pdf.id,
        "filename": pdf.original_filename,
        "file_path": pdf.file_path,
        "file_size": pdf.file_size,
        "description": pdf.description,
        "pages": pdf.pages,
        "created_at": pdf.created_at.isoformat() if pdf.created_at else None,
    }


@router.get("/download/{pdf_id}")
async def download_pdf(pdf_id: str, db: AsyncSession = Depends(get_db)):
    pdf = await db.get(PDF, pdf_id)
    if not pdf:
        raise HTTPException(status_code=404, detail="PDF não encontrado")

    file_path = os.path.join(settings.UPLOAD_DIR, pdf.filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Arquivo não encontrado no servidor")

    return FileResponse(
        file_path,
        media_type="application/pdf",
        filename=pdf.original_filename,
        headers={"Content-Disposition": f'attachment; filename="{pdf.original_filename}"'},
    )


@router.get("/view/{pdf_id}")
async def view_pdf(pdf_id: str, db: AsyncSession = Depends(get_db)):
    pdf = await db.get(PDF, pdf_id)
    if not pdf:
        raise HTTPException(status_code=404, detail="PDF não encontrado")

    file_path = os.path.join(settings.UPLOAD_DIR, pdf.filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Arquivo não encontrado no servidor")

    return FileResponse(
        file_path,
        media_type="application/pdf",
        filename=pdf.original_filename,
        headers={"Content-Disposition": "inline"},
    )


@router.delete("/{pdf_id}")
async def delete_pdf(pdf_id: str, db: AsyncSession = Depends(get_db)):
    pdf = await db.get(PDF, pdf_id)
    if not pdf:
        raise HTTPException(status_code=404, detail="PDF não encontrado")

    # Remove physical file
    file_path = os.path.join(settings.UPLOAD_DIR, pdf.filename)
    if os.path.exists(file_path):
        os.remove(file_path)

    await db.delete(pdf)
    await db.commit()
    return {"message": "PDF removido com sucesso"}


def _count_pdf_pages(content: bytes) -> Optional[int]:
    try:
        import PyPDF2
        import io
        reader = PyPDF2.PdfReader(io.BytesIO(content))
        return len(reader.pages)
    except Exception:
        return None
