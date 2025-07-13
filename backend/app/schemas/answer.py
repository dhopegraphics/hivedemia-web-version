from pydantic import BaseModel
from datetime import datetime


class QuestionAnswerCreate(BaseModel):
    question_id: int
    answer_text: str
    is_correct: bool = False


class QuestionAnswerRead(QuestionAnswerCreate):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True
