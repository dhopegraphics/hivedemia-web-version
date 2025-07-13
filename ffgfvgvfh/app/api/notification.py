from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.database import AsyncSessionLocal
from app.crud import notification as crud
from app.schemas.notification import NotificationPreferenceCreate, NotificationPreferenceRead
from uuid import UUID

router = APIRouter(prefix="/notifications", tags=["Notifications"])

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

@router.post("/", response_model=NotificationPreferenceRead)
async def update_preferences(data: NotificationPreferenceCreate, db: AsyncSession = Depends(get_db)):
    return await crud.create_or_update_preferences(db, data)

@router.get("/{user_id}", response_model=NotificationPreferenceRead)
async def get_preferences(user_id: UUID, db: AsyncSession = Depends(get_db)):
    return await crud.get_preferences(db, user_id)
