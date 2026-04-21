# llm_routes.py — Groq-powered (free, fast, production-ready)

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from groq import Groq
import os

router = APIRouter(prefix="/llm", tags=["LLM"])

def get_groq_client():
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="GROQ_API_KEY not set. Add it to your .env file."
        )
    return Groq(api_key=api_key)

MODEL = "llama-3.1-8b-instant" 

async def ask_groq(prompt: str) -> str:
    try:
        client = get_groq_client()
        chat = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model=MODEL,
            max_tokens=1024,
            temperature=0.7,
        )
        return chat.choices[0].message.content.strip()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Groq error: {str(e)}")


class FeedbackRequest(BaseModel):
    resume_text: str
    jd_text: str
    ats_score: float
    matched_skills: list[str]
    missing_skills: list[str]

class CoverLetterRequest(BaseModel):
    resume_text: str
    jd_text: str

class InterviewRequest(BaseModel):
    missing_skills: list[str]
    jd_text: str
    ats_score: float


@router.post("/feedback")
async def get_llm_feedback(req: FeedbackRequest):
    matched = ', '.join(req.matched_skills) or 'None'
    missing = ', '.join(req.missing_skills) or 'None'

    prompt = f"""You are an expert resume coach and recruiter reviewer.

ATS Score: {req.ats_score}%
Matched Skills: {matched}
Missing Skills: {missing}

JOB DESCRIPTION:
{req.jd_text[:1200]}

RESUME:
{req.resume_text[:1200]}

Respond in exactly this format:

SUMMARY: [2 sentences on overall fit and biggest strength]

TOP FIXES:
- [Specific fix #1 with concrete example]
- [Specific fix #2 with concrete example]  
- [Specific fix #3 with concrete example]

REWRITE: [Take one weak bullet from the resume, show: BEFORE → AFTER using JD language]"""

    return {"feedback": await ask_groq(prompt)}


@router.post("/cover-letter")
async def generate_cover_letter(req: CoverLetterRequest):
    prompt = f"""Write a professional cover letter (3 paragraphs, under 250 words).

JOB DESCRIPTION:
{req.jd_text[:1200]}

RESUME:
{req.resume_text[:1200]}

Rules: Start with "Dear Hiring Manager," — End with "Sincerely, [Candidate]"
Paragraph 1: Specific interest in the role (mention exact job title)
Paragraph 2: Connect 2-3 specific resume skills to JD requirements  
Paragraph 3: Confident closing with call to action
No clichés. No placeholder brackets except [Candidate]."""

    return {"cover_letter": await ask_groq(prompt)}


@router.post("/interview-questions")
async def get_interview_questions(req: InterviewRequest):
    missing = ', '.join(req.missing_skills) or 'general role competencies'

    prompt = f"""You are a senior technical interviewer.

JOB DESCRIPTION:
{req.jd_text[:1000]}

Candidate ATS Score: {req.ats_score}%
Missing Skills: {missing}

Generate exactly 5 interview questions targeting the skill gaps. For each:

Q1: [Question]
WHY ASKED: [One sentence]
HOW TO ANSWER: [One sentence tip]

(repeat for Q2-Q5)
No generic questions. Make them role-specific."""

    return {"questions": await ask_groq(prompt)}


