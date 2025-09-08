from fastapi import APIRouter, Depends, HTTPException, status,Request,Path
from sqlalchemy.orm import Session
from ats_scoring import classify_experience_level
import database
from models import Resume
from typing import List
from pydantic import BaseModel
from datetime import datetime
from fastapi.responses import FileResponse

router = APIRouter(prefix="/resume", tags=["resume"])

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Pydantic schema for response
class ResumeOut(BaseModel):
    id: int
    student_email: str
    ats_score: float
    resume_text: str | None
    upload_time: datetime
    similarity: float | None
    keyword_overlap: float | None
    strictness_factor_applied: str | None
    matched_skills: str | None
    missing_skills: str | None
    experience_level: str | None  

    class Config:
        from_attributes = True

@router.post("/save")
def save_resume(payload: dict, db: Session = Depends(get_db)):
    try:
        experience_level = classify_experience_level(payload.get("resume_text", ""))
        
        overqual = payload.get("overqualified", [])
        if isinstance(overqual, list):
            overqual_str = "; ".join(overqual)
        elif isinstance(overqual, str):
            overqual_str = overqual
        else:
            overqual_str = ""
            
        resume = Resume(
            student_email=payload["student_email"],
            ats_score=payload["ats_score"],
            resume_text=payload.get("resume_text", ""),
            similarity=payload.get("similarity"),
            keyword_overlap=payload.get("keyword_overlap"),
            strictness_factor_applied=payload.get("strictness_factor_applied"),
            matched_skills=payload.get("matched_skills"),
            missing_skills=payload.get("missing_skills"),
            file_path=payload.get("file_path"),
            experience_level=experience_level,
            overqualified_msgs=overqual_str
        )
        db.add(resume)
        db.commit()
        db.refresh(resume)
        return {"message": "Resume saved successfully", "id": resume.id}
    except Exception as e:
        db.rollback()
        return {"error": f"Failed to save resume: {str(e)}"}


@router.get("/list", response_model=List[ResumeOut])
def list_resumes(db: Session = Depends(get_db)):
    try:
        resumes = db.query(Resume).all()
        return resumes
    except Exception as e:
        print(f"Error fetching resumes: {e}")
        raise HTTPException(status_code=500, detail="Internal Server Error")


@router.get("/download/{resume_id}")
def download_resume(resume_id: int, db: Session = Depends(get_db)):
    resume_record = db.query(Resume).filter(Resume.id == resume_id).first()
    if not resume_record or not getattr(resume_record, "file_path", None):
        raise HTTPException(status_code=404, detail="Resume file not found.")
    return FileResponse(resume_record.file_path, filename=f"resume_{resume_record.student_email}.pdf")

