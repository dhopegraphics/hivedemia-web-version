from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.database import AsyncSessionLocal
from app.crud import answer as crud
from app.schemas.answer import QuestionAnswerCreate, QuestionAnswerRead
from typing import List

router = APIRouter(prefix="/answers", tags=["Answers"])

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

@router.post("/", response_model=QuestionAnswerRead)
async def add_answer(data: QuestionAnswerCreate, db: AsyncSession = Depends(get_db)):
    return await crud.add_answer_option(db, data)

@router.get("/question/{question_id}", response_model=List[QuestionAnswerRead])
async def get_answers(question_id: int, db: AsyncSession = Depends(get_db)):
    return await crud.get_answers_for_question(db, question_id)
