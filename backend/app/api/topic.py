from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.database.database import AsyncSessionLocal
from app.crud import topic as crud
from app.schemas.topic import ExtractedTopicCreate, ExtractedTopicRead

router = APIRouter(prefix="/topics", tags=["Topics"])

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

@router.post("/", response_model=ExtractedTopicRead)
async def create_topic(data: ExtractedTopicCreate, db: AsyncSession = Depends(get_db)):
    return await crud.create_extracted_topic(db, data)

@router.get("/course/{course_id}", response_model=List[ExtractedTopicRead])
async def get_by_course(course_id: str, db: AsyncSession = Depends(get_db)):
    return await crud.get_topics_by_course(db, course_id)
