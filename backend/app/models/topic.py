from sqlalchemy import Column, ForeignKey, BigInteger, Text, TIMESTAMP
from sqlalchemy.dialects.postgresql import UUID
from app.database.database import Base

class ExtractedTopic(Base):
    __tablename__ = "extracted_topics"

    id = Column(BigInteger, primary_key=True)
    coursefile_id = Column(BigInteger, ForeignKey("coursefiles.id"), nullable=False)
    name = Column(Text, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default="now()")
    course_id = Column(UUID(as_uuid=True), ForeignKey("course.id"))
