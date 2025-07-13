from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.database import AsyncSessionLocal
from app.crud import shared_notes as crud
from app.schemas.shared_notes import (
    SharedNoteCreate, SharedNoteRead,
    SharedNoteCommentCreate, SharedNoteCommentRead
)
from typing import List
from uuid import UUID

router = APIRouter(prefix="/shared-notes", tags=["Shared Notes"])

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

@router.post("/", response_model=SharedNoteRead)
async def upload_note(data: SharedNoteCreate, db: AsyncSession = Depends(get_db)):
    return await crud.upload_note(db, data)

@router.get("/", response_model=List[SharedNoteRead])
async def list_notes(db: AsyncSession = Depends(get_db)):
    return await crud.list_public_notes(db)

@router.get("/{note_id}", response_model=SharedNoteRead)
async def get_note(note_id: UUID, db: AsyncSession = Depends(get_db)):
    return await crud.get_note_by_id(db, note_id)

@router.post("/comment", response_model=SharedNoteCommentRead)
async def comment(data: SharedNoteCommentCreate, db: AsyncSession = Depends(get_db)):
    return await crud.add_comment(db, data)

@router.get("/{note_id}/comments", response_model=List[SharedNoteCommentRead])
async def get_comments(note_id: UUID, db: AsyncSession = Depends(get_db)):
    return await crud.get_comments(db, note_id)
