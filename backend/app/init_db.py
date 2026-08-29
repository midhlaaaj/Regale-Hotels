import asyncio

from sqlmodel import SQLModel

from app import models  # noqa: F401  (import registers all tables on SQLModel.metadata)
from app.db import engine


async def init_db() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    print("Tables created.")


if __name__ == "__main__":
    asyncio.run(init_db())
