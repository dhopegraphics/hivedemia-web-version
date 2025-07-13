from sqlalchemy import Column, String, Boolean, TIMESTAMP, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from app.database.database import Base
import uuid

class University(Base):
    __tablename__ = "universities"

    id = Column(String, primary_key=True, index=True)
    name = Column(Text, nullable=False)
    logo_url = Column(Text)
    created_at = Column(TIMESTAMP(timezone=True), server_default="now()")


class Profile(Base):
    __tablename__ = "profiles"

    user_id = Column(UUID(as_uuid=True), primary_key=True, index=True)
    full_name = Column(Text)
    username = Column(Text, unique=True)
    university_id = Column(String, ForeignKey("universities.id"))
    created_at = Column(TIMESTAMP(timezone=True), server_default="now()")
    updated_at = Column(TIMESTAMP(timezone=True), server_default="now()")
    email = Column(Text, unique=True)
    avatar_url = Column(Text)
    major = Column(Text)
    year = Column(Text)
    isPushNotification = Column(Boolean, nullable=False, default=True)
