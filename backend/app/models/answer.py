from sqlalchemy import Column, ForeignKey, BigInteger, Text, Boolean, TIMESTAMP
from app.database.database import Base

class QuestionAnswer(Base):
    __tablename__ = "question_answers"

    id = Column(BigInteger, primary_key=True)
    question_id = Column(BigInteger, ForeignKey("competition_questions.id"), nullable=False)
    answer_text = Column(Text, nullable=False)
    is_correct = Column(Boolean, default=False, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default="now()", nullable=False)
