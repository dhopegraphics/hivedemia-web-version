from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.course import Course, CourseFile
from app.schemas.course import CourseCreate, CourseFileCreate


async def create_course(db: AsyncSession, data: CourseCreate) -> Course:
    course = Course(**data.dict())
    db.add(course)
    await db.commit()
    await db.refresh(course)
    return course


async def get_course_by_code(db: AsyncSession, code: str):
    result = await db.execute(select(Course).where(Course.code == code))
    return result.scalar_one_or_none()


async def upload_course_file(db: AsyncSession, data: CourseFileCreate) -> CourseFile:
    file = CourseFile(**data.dict())
    db.add(file)
    await db.commit()
    await db.refresh(file)
    return file


async def get_course_files(db: AsyncSession, course_id):
    result = await db.execute(select(CourseFile).where(CourseFile.course_id == course_id))
    return result.scalars().all()
