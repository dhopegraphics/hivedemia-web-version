from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.database.database import AsyncSessionLocal
from app.crud import competition as crud
from app.schemas.competition import (
    CompetitionCreate, CompetitionRead,
    CompetitionQuestionCreate, CompetitionQuestionRead,
    CompetitionParticipantCreate, CompetitionParticipantRead,
    ParticipantAnswerCreate, ParticipantAnswerRead
)

router = APIRouter(prefix="/competitions", tags=["Competitions"])


async def get_db():
    async with AsyncSessionLocal() as session:
        yield session


@router.post("/", response_model=CompetitionRead)
async def create_competition(data: CompetitionCreate, db: AsyncSession = Depends(get_db)):
    return await crud.create_competition(db, data)


@router.get("/{competition_id}", response_model=CompetitionRead)
async def get_competition(competition_id: int, db: AsyncSession = Depends(get_db)):
    comp = await crud.get_competition(db, competition_id)
    if not comp:
        raise HTTPException(status_code=404, detail="Competition not found")
    return comp


@router.post("/question", response_model=CompetitionQuestionRead)
async def add_question(data: CompetitionQuestionCreate, db: AsyncSession = Depends(get_db)):
    return await crud.create_question(db, data)


@router.post("/join", response_model=CompetitionParticipantRead)
async def join_competition(data: CompetitionParticipantCreate, db: AsyncSession = Depends(get_db)):
    return await crud.create_participant(db, data)


@router.post("/submit", response_model=ParticipantAnswerRead)
async def submit_answer(data: ParticipantAnswerCreate, db: AsyncSession = Depends(get_db)):
    return await crud.submit_answer(db, data)
