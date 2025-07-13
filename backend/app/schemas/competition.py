from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID


class CompetitionBase(BaseModel):
    title: str
    subject: str
    question_count: Optional[int] = 15
    time_per_question: Optional[int] = 60
    max_participants: Optional[int] = 5
    difficulty: Optional[str] = "medium"
    is_private: Optional[bool] = False
    allow_mid_join: Optional[bool] = True
    show_leaderboard: Optional[bool] = True
    duration: Optional[int] = 60


class CompetitionCreate(CompetitionBase):
    created_by: UUID


class CompetitionRead(CompetitionBase):
    id: int
    created_by: UUID
    status: str
    created_at: datetime
    started_at: Optional[datetime]
    ended_at: Optional[datetime]

    class Config:
        orm_mode = True


class CompetitionQuestionBase(BaseModel):
    question_text: str
    topic_id: Optional[int]


class CompetitionQuestionCreate(CompetitionQuestionBase):
    competition_id: int


class CompetitionQuestionRead(CompetitionQuestionCreate):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True


class CompetitionParticipantCreate(BaseModel):
    competition_id: int
    user_id: UUID
    is_invited: Optional[bool] = True


class CompetitionParticipantRead(BaseModel):
    id: int
    competition_id: int
    user_id: UUID
    has_joined: bool
    joined_at: Optional[datetime]
    score: int
    completed: bool
    completed_at: Optional[datetime]
    created_at: datetime

    class Config:
        orm_mode = True


class ParticipantAnswerCreate(BaseModel):
    participant_id: int
    question_id: int
    answer_id: Optional[int]
    time_taken: Optional[int]


class ParticipantAnswerRead(ParticipantAnswerCreate):
    id: int
    is_correct: bool
    created_at: datetime

    class Config:
        orm_mode = True
