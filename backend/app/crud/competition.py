from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update
from app.models.competition import (
    Competition,
    CompetitionQuestion,
    CompetitionParticipant,
    ParticipantAnswer
)
from app.schemas.competition import (
    CompetitionCreate,
    CompetitionQuestionCreate,
    CompetitionParticipantCreate,
    ParticipantAnswerCreate
)


async def create_competition(db: AsyncSession, data: CompetitionCreate) -> Competition:
    new_comp = Competition(**data.dict())
    db.add(new_comp)
    await db.commit()
    await db.refresh(new_comp)
    return new_comp


async def get_competition(db: AsyncSession, competition_id: int):
    result = await db.execute(select(Competition).where(Competition.id == competition_id))
    return result.scalar_one_or_none()


async def create_question(db: AsyncSession, data: CompetitionQuestionCreate) -> CompetitionQuestion:
    question = CompetitionQuestion(**data.dict())
    db.add(question)
    await db.commit()
    await db.refresh(question)
    return question


async def create_participant(db: AsyncSession, data: CompetitionParticipantCreate) -> CompetitionParticipant:
    participant = CompetitionParticipant(**data.dict())
    db.add(participant)
    await db.commit()
    await db.refresh(participant)
    return participant


async def join_competition(db: AsyncSession, participant_id: int):
    await db.execute(
        update(CompetitionParticipant)
        .where(CompetitionParticipant.id == participant_id)
        .values(has_joined=True)
    )
    await db.commit()


async def submit_answer(db: AsyncSession, data: ParticipantAnswerCreate) -> ParticipantAnswer:
    answer = ParticipantAnswer(**data.dict())
    db.add(answer)
    await db.commit()
    await db.refresh(answer)
    return answer
