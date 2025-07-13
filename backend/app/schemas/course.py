from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID


class CourseBase(BaseModel):
    title: str
    code: str
    description: Optional[str]
    professor: Optional[str]
    color: Optional[str] = "#00DF82"
    icon: Optional[str] = "school"


class CourseCreate(CourseBase):
    createdby: UUID


class CourseRead(CourseBase):
    id: UUID
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        orm_mode = True


class CourseFileCreate(BaseModel):
    user_id: UUID
    name: str
    type: str
    size: Optional[str]
    is_private: Optional[bool] = True
    url: Optional[str] = ""
    course_id: Optional[UUID]
    path: str


class CourseFileRead(CourseFileCreate):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True
