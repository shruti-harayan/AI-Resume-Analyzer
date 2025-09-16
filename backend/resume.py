from fastapi import APIRouter, Depends, HTTPException, status,Request,Path
from sqlalchemy.orm import Session
from ats_scoring import ats_score_dynamic, classify_experience_level
import database,os,fitz
from models import Resume
from typing import List
from pydantic import BaseModel
from datetime import datetime
from fastapi.responses import FileResponse
from docx import Document

router = APIRouter(prefix="/resume", tags=["resume"])

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()


def extract_text_from_pdf(file_path: str) -> str:
    text = ""
    doc = fitz.open(file_path)
    for page in doc:
        text += page.get_text()
    return text


def extract_text_from_docx(file_path: str) -> str:
    doc = Document(file_path)
    full_text = []
    for para in doc.paragraphs:
        full_text.append(para.text)
    return "\n".join(full_text)

def extract_text_from_file(file_path: str) -> str:
    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".pdf":
        return extract_text_from_pdf(file_path)
    elif ext in [".docx", ".doc"]:
        return extract_text_from_docx(file_path)
    else:
        # For plain text or unknown format, read as text file
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            return f.read()

# Pydantic schema for response
class ResumeOut(BaseModel):
    id: int
    student_email: str
    ats_score: float
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
        resume_raw_text = payload.get("resume_text") or extract_text_from_file(payload.get("file_path"))

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
            similarity=payload.get("similarity"),
            keyword_overlap=payload.get("keyword_overlap"),
            strictness_factor_applied=payload.get("strictness_factor_applied"),
            matched_skills=payload.get("matched_skills"),
            missing_skills=payload.get("missing_skills"),
            file_path=payload.get("file_path"),
            experience_level=experience_level,
            overqualified_msgs=overqual_str,
            resume_text=resume_raw_text,
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

@router.post("/jd_match")
def jd_match(payload: dict, db: Session = Depends(get_db)):
    jd_text = payload.get("jd_text", "")
    if not jd_text.strip():
        return {"matches": []}

    resumes = db.query(Resume).all()
    results = []

    for resume in resumes:
        if not resume.resume_text:
            continue  # skip if no resume text to analyze

        ats_result = ats_score_dynamic(resume.resume_text, jd_text)

        if ats_result.get("score", 0) > 20 or ats_result.get("matched_skills"):
            results.append({
                "id": resume.id,
                "student_email": resume.student_email,
                "ats_score": ats_result.get("score", 0),
                "matched_skills": ", ".join(ats_result.get("matched_skills", [])) if isinstance(ats_result.get("matched_skills"), list) else ats_result.get("matched_skills", ""),
                "missing_skills": ", ".join(ats_result.get("missing_skills", [])) if isinstance(ats_result.get("missing_skills"), list) else ats_result.get("missing_skills", ""),
                "experience_level": resume.experience_level or "N/A",
                "upload_time": (resume.upload_time.isoformat() if resume.upload_time else None),
            })

    results.sort(key=lambda x: x["ats_score"], reverse=True)
    return {"matches": results}
