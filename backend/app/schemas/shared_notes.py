from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime


class SharedNoteCreate(BaseModel):
    title: str
    description: Optional[str]
    subject: str
    url: str
    file_name: Optional[str]
    file_type: Optional[str]
    file_size: Optional[int]
    page_count: Optional[int]
    file_is_private: Optional[bool] = False
    allow_comments: Optional[bool] = True
    is_anonymous: Optional[bool] = False
    uploaded_by: Optional[UUID]
    real_author: Optional[str]
    is_real_author: Optional[bool] = False
    file_path: str


class SharedNoteRead(SharedNoteCreate):
    id: UUID
    created_at: datetime

    class Config:
        orm_mode = True


class SharedNoteCommentCreate(BaseModel):
    note_id: UUID
    user_id: Optional[UUID]
    content: str


class SharedNoteCommentRead(SharedNoteCommentCreate):
    id: UUID
    created_at: datetime

    class Config:
        orm_mode = True
