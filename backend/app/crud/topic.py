from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.topic import ExtractedTopic
from app.schemas.topic import ExtractedTopicCreate


async def create_extracted_topic(db: AsyncSession, data: ExtractedTopicCreate) -> ExtractedTopic:
    topic = ExtractedTopic(**data.dict())
    db.add(topic)
    await db.commit()
    await db.refresh(topic)
    return topic


async def get_topics_by_course(db: AsyncSession, course_id):
    result = await db.execute(select(ExtractedTopic).where(ExtractedTopic.course_id == course_id))
    return result.scalars().all()
