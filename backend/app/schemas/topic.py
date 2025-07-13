from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID


class ExtractedTopicCreate(BaseModel):
    coursefile_id: int
    name: str
    course_id: Optional[UUID]


class ExtractedTopicRead(ExtractedTopicCreate):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True
