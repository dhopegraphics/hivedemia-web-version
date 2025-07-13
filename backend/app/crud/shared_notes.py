from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.shared_notes import SharedNote, SharedNoteComment
from app.schemas.shared_notes import SharedNoteCreate, SharedNoteCommentCreate


async def upload_note(db: AsyncSession, data: SharedNoteCreate) -> SharedNote:
    note = SharedNote(**data.dict())
    db.add(note)
    await db.commit()
    await db.refresh(note)
    return note


async def list_public_notes(db: AsyncSession):
    result = await db.execute(select(SharedNote).where(SharedNote.file_is_private == False))
    return result.scalars().all()


async def get_note_by_id(db: AsyncSession, note_id):
    result = await db.execute(select(SharedNote).where(SharedNote.id == note_id))
    return result.scalar_one_or_none()


async def add_comment(db: AsyncSession, data: SharedNoteCommentCreate) -> SharedNoteComment:
    comment = SharedNoteComment(**data.dict())
    db.add(comment)
    await db.commit()
    await db.refresh(comment)
    return comment


async def get_comments(db: AsyncSession, note_id):
    result = await db.execute(select(SharedNoteComment).where(SharedNoteComment.note_id == note_id))
    return result.scalars().all()
