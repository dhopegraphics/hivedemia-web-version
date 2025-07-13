from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.database import AsyncSessionLocal
from app.crud import user as crud
from app.schemas.user import ProfileCreate, ProfileRead, UniversityRead
from typing import List

router = APIRouter(prefix="/users", tags=["Users"])

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

@router.post("/profile", response_model=ProfileRead)
async def create_profile(data: ProfileCreate, db: AsyncSession = Depends(get_db)):
    return await crud.create_profile(db, data)

@router.get("/profile/{user_id}", response_model=ProfileRead)
async def get_profile(user_id: str, db: AsyncSession = Depends(get_db)):
    return await crud.get_profile_by_user_id(db, user_id)

@router.get("/universities", response_model=List[UniversityRead])
async def list_universities(db: AsyncSession = Depends(get_db)):
    return await crud.list_universities(db)
