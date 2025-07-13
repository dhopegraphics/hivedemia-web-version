from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.database.database import AsyncSessionLocal
from app.crud import course as crud
from app.schemas.course import CourseCreate, CourseRead, CourseFileCreate, CourseFileRead

router = APIRouter(prefix="/courses", tags=["Courses"])

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

@router.post("/", response_model=CourseRead)
async def create_course(data: CourseCreate, db: AsyncSession = Depends(get_db)):
    return await crud.create_course(db, data)

@router.get("/code/{code}", response_model=CourseRead)
async def get_by_code(code: str, db: AsyncSession = Depends(get_db)):
    course = await crud.get_course_by_code(db, code)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course

@router.post("/file", response_model=CourseFileRead)
async def upload_file(data: CourseFileCreate, db: AsyncSession = Depends(get_db)):
    return await crud.upload_course_file(db, data)

@router.get("/{course_id}/files", response_model=List[CourseFileRead])
async def get_files(course_id: str, db: AsyncSession = Depends(get_db)):
    return await crud.get_course_files(db, course_id)
