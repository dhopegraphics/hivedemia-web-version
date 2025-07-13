from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.answer import QuestionAnswer
from app.schemas.answer import QuestionAnswerCreate


async def add_answer_option(db: AsyncSession, data: QuestionAnswerCreate) -> QuestionAnswer:
    answer = QuestionAnswer(**data.dict())
    db.add(answer)
    await db.commit()
    await db.refresh(answer)
    return answer


async def get_answers_for_question(db: AsyncSession, question_id: int):
    result = await db.execute(select(QuestionAnswer).where(QuestionAnswer.question_id == question_id))
    return result.scalars().all()
