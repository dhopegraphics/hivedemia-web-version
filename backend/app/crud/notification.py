from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.notification import NotificationPreference
from app.schemas.notification import NotificationPreferenceCreate


async def create_or_update_preferences(db: AsyncSession, data: NotificationPreferenceCreate):
    existing = await db.execute(select(NotificationPreference).where(NotificationPreference.user_id == data.user_id))
    pref = existing.scalar_one_or_none()

    if pref:
        for key, value in data.dict().items():
            setattr(pref, key, value)
    else:
        pref = NotificationPreference(**data.dict())
        db.add(pref)

    await db.commit()
    return pref


async def get_preferences(db: AsyncSession, user_id):
    result = await db.execute(select(NotificationPreference).where(NotificationPreference.user_id == user_id))
    return result.scalar_one_or_none()
