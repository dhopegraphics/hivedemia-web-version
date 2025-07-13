from sqlalchemy import Column, ForeignKey, Text, TIMESTAMP, Boolean, BigInteger, Integer
from sqlalchemy.dialects.postgresql import UUID
from app.database.database import Base
import uuid

class SharedNote(Base):
    __tablename__ = "shared_notes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(Text, nullable=False)
    description = Column(Text)
    subject = Column(Text, nullable=False)
    url = Column(Text, nullable=False)
    file_name = Column(Text)
    file_type = Column(Text)
    file_size = Column(BigInteger)
    page_count = Column(Integer)
    file_is_private = Column(Boolean, default=False, nullable=False)
    allow_comments = Column(Boolean, default=True, nullable=False)
    is_anonymous = Column(Boolean, default=False, nullable=False)
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("profiles.user_id"))
    created_at = Column(TIMESTAMP(timezone=True), server_default="now()")
    real_author = Column(Text)
    is_real_author = Column(Boolean, default=False, nullable=False)
    file_path = Column(Text, unique=True)


class SharedNoteComment(Base):
    __tablename__ = "shared_notes_comments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    note_id = Column(UUID(as_uuid=True), ForeignKey("shared_notes.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.user_id"))
    content = Column(Text, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default="now()")
