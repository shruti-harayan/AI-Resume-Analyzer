# models.py

from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime,timezone

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)  # hashed
    role = Column(String, nullable=False)  # student / recruiter


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    student_email = Column(String, ForeignKey("users.email"), nullable=False) 
    ats_score = Column(Float, nullable=False)
    file_path = Column(String, nullable=True)
    upload_time = Column(DateTime, default=lambda: datetime.now(timezone.utc)) # timestamp for when saved
    # store ATS subfields (similarity, matched_skills, etc.)
    similarity = Column(Float, nullable=True)
    keyword_overlap = Column(Float, nullable=True)
    strictness_factor_applied = Column(String, nullable=True)
    matched_skills = Column(String, nullable=True)   # CSV string of skills
    missing_skills = Column(String, nullable=True)   # CSV string of skills
    resume_text = Column(String, nullable=True)         # Store full parsed resume text
    experience_level = Column(String, nullable=True)
    overqualified_msgs = Column(String, nullable=True)

    # relationship
    student = relationship("User", backref="resumes")
