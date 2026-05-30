from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.core.config import settings
from urllib.parse import urlparse, urlunparse


def _build_engine():
    url = settings.DATABASE_URL

    url = url.replace("postgresql://", "postgresql+asyncpg://")
    url = url.replace("postgres://", "postgresql+asyncpg://")

    is_neon = "neon.tech" in url

    parsed = urlparse(url)
    url_clean = urlunparse((
        parsed.scheme,
        parsed.netloc,
        parsed.path,
        "", "", "",
    ))

    connect_args = {}
    if is_neon:
        connect_args["ssl"] = "require"

    return create_async_engine(
        url_clean,
        echo=settings.DEBUG,
        pool_pre_ping=True,
        pool_size=2 if is_neon else 5,
        max_overflow=3 if is_neon else 10,
        pool_recycle=300 if is_neon else 1800,
        connect_args=connect_args,
    )


engine = _build_engine()

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


async def create_tables():
    from app.models import link, group, pdf  # noqa: F401
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()