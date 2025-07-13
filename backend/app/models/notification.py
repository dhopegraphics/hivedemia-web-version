from sqlalchemy import Column, Boolean, TIMESTAMP
from sqlalchemy.dialects.postgresql import UUID
from app.database.database import Base

class NotificationPreference(Base):
    __tablename__ = "notification_preferences"

    user_id = Column(UUID(as_uuid=True), primary_key=True)
    email_notifications = Column(Boolean, default=True, nullable=False)
    push_notifications = Column(Boolean, default=True, nullable=False)
    course_updates = Column(Boolean, default=True, nullable=False)
    assignment_reminders = Column(Boolean, default=True, nullable=False)
    discussion_activity = Column(Boolean, default=True, nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default="now()")
