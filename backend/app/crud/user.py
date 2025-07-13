from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.user import Profile, University
from app.schemas.user import ProfileCreate


async def create_profile(db: AsyncSession, data: ProfileCreate) -> Profile:
    profile = Profile(**data.dict())
    db.add(profile)
    await db.commit()
    await db.refresh(profile)
    return profile


async def get_profile_by_user_id(db: AsyncSession, user_id):
    result = await db.execute(select(Profile).where(Profile.user_id == user_id))
    return result.scalar_one_or_none()


async def list_universities(db: AsyncSession):
    result = await db.execute(select(University))
    return result.scalars().all()
