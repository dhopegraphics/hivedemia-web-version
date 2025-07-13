from pydantic import BaseModel, EmailStr
from typing import Optional
from uuid import UUID
from datetime import datetime


class UniversityBase(BaseModel):
    id: str
    name: str
    logo_url: Optional[str]


class UniversityRead(UniversityBase):
    created_at: datetime

    class Config:
        orm_mode = True


class ProfileBase(BaseModel):
    full_name: Optional[str]
    username: Optional[str]
    email: Optional[EmailStr]
    university_id: Optional[str]
    avatar_url: Optional[str]
    major: Optional[str]
    year: Optional[str]
    isPushNotification: Optional[bool] = True


class ProfileCreate(ProfileBase):
    user_id: UUID


class ProfileRead(ProfileBase):
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
