from sqlalchemy import Column, ForeignKey, Text, TIMESTAMP, Boolean, BigInteger, String
from sqlalchemy.dialects.postgresql import UUID
from app.database.database import Base
import uuid

class Course(Base):
    __tablename__ = "course"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    createdby = Column(UUID(as_uuid=True), ForeignKey("profiles.user_id"), nullable=False)
    title = Column(String, nullable=False)
    code = Column(String, unique=True, nullable=False)
    description = Column(Text)
    professor = Column(String)
    color = Column(String, default="#00DF82")
    icon = Column(String, default="school")
    created_at = Column(TIMESTAMP(timezone=True), server_default="now()")
    updated_at = Column(TIMESTAMP(timezone=True), server_default="now()")


class CourseFile(Base):
    __tablename__ = "coursefiles"

    id = Column(BigInteger, primary_key=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.user_id"), nullable=False)
    name = Column(Text, nullable=False)
    type = Column(Text, nullable=False)
    size = Column(Text)
    created_at = Column(TIMESTAMP(timezone=True), server_default="now()")
    is_private = Column(Boolean, default=True)
    url = Column(Text, default="")
    course_id = Column(UUID(as_uuid=True), ForeignKey("course.id"))
    path = Column(Text, unique=True)
