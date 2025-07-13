from pydantic import BaseModel
from uuid import UUID
from datetime import datetime


class NotificationPreferenceCreate(BaseModel):
    user_id: UUID
    email_notifications: bool = True
    push_notifications: bool = True
    course_updates: bool = True
    assignment_reminders: bool = True
    discussion_activity: bool = True


class NotificationPreferenceRead(NotificationPreferenceCreate):
    updated_at: datetime

    class Config:
        orm_mode = True
