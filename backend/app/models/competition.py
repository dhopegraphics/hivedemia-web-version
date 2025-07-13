from sqlalchemy import (
    Column, ForeignKey, BigInteger, Boolean, Integer, Text,
    TIMESTAMP
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database.database import Base
import uuid


class Competition(Base):
    __tablename__ = "competitions"

    id = Column(BigInteger, primary_key=True, index=True)
    title = Column(Text, nullable=False)
    subject = Column(Text, nullable=False)
    question_count = Column(Integer, default=15, nullable=False)
    time_per_question = Column(Integer, default=60, nullable=False)
    max_participants = Column(Integer, default=5, nullable=False)
    difficulty = Column(Text, default="medium", nullable=False)
    is_private = Column(Boolean, default=False, nullable=False)
    allow_mid_join = Column(Boolean, default=True, nullable=False)
    show_leaderboard = Column(Boolean, default=True, nullable=False)
    duration = Column(Integer, default=60, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default="now()", nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("profiles.user_id"), nullable=False)
    started_at = Column(TIMESTAMP(timezone=True))
    ended_at = Column(TIMESTAMP(timezone=True))
    status = Column(Text, default="waiting", nullable=False)


class CompetitionQuestion(Base):
    __tablename__ = "competition_questions"

    id = Column(BigInteger, primary_key=True)
    competition_id = Column(BigInteger, ForeignKey("competitions.id"), nullable=False)
    question_text = Column(Text, nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default="now()", nullable=False)
    topic_id = Column(BigInteger, ForeignKey("competition_topics.id"))


class CompetitionTopic(Base):
    __tablename__ = "competition_topics"

    id = Column(BigInteger, primary_key=True)
    competition_id = Column(BigInteger, ForeignKey("competitions.id"), nullable=False)
    topic_id = Column(BigInteger, ForeignKey("extracted_topics.id"), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default="now()", nullable=False)


class CompetitionParticipant(Base):
    __tablename__ = "competition_participants"

    id = Column(BigInteger, primary_key=True)
    competition_id = Column(BigInteger, ForeignKey("competitions.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.user_id"), nullable=False)
    is_invited = Column(Boolean, default=True, nullable=False)
    has_joined = Column(Boolean, default=False, nullable=False)
    joined_at = Column(TIMESTAMP(timezone=True))
    score = Column(Integer, default=0, nullable=False)
    completed = Column(Boolean, default=False, nullable=False)
    completed_at = Column(TIMESTAMP(timezone=True))
    created_at = Column(TIMESTAMP(timezone=True), server_default="now()", nullable=False)


class ParticipantAnswer(Base):
    __tablename__ = "participant_answers"

    id = Column(BigInteger, primary_key=True)
    participant_id = Column(BigInteger, ForeignKey("competition_participants.id"), nullable=False)
    question_id = Column(BigInteger, ForeignKey("competition_questions.id"), nullable=False)
    answer_id = Column(BigInteger, ForeignKey("question_answers.id"))
    is_correct = Column(Boolean, default=False, nullable=False)
    time_taken = Column(Integer)
    created_at = Column(TIMESTAMP(timezone=True), server_default="now()", nullable=False)
