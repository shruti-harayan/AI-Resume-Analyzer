# llm_routes.py — Groq-powered (free, fast, production-ready)

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from groq import Groq
import os

router = APIRouter(prefix="/llm", tags=["LLM"])
MODEL = "openai/gpt-oss-120b" 

def get_groq_client():
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="GROQ_API_KEY not set. Add it to your .env file."
        )
    return Groq(api_key=api_key)


async def ask_groq(prompt: str, max_tokens: int = 1024) -> str:
    try:
        client = get_groq_client()
        chat = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model=MODEL,
            max_tokens=max_tokens,
            temperature=0.7,
        )
        return chat.choices[0].message.content.strip()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Groq API error: {str(e)}")


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


class RewriteRequest(BaseModel):
    bullet: str        # bullet point or section to rewrite
    jd_text: str       # job description — used for tone/style only, NOT for keyword injection
    resume_text: str   # full resume for voice consistency

# Route 4: Resume Bullet Rewriter
@router.post("/rewrite-bullet")
async def rewrite_bullet(req: RewriteRequest):
    """
    Rewrites a single bullet point using ONLY the facts already present —
    stronger verbs, better structure, metric placeholders.
    Never adds skills or tools not in the original.
    """
    prompt = f"""You are an expert resume writer. Your job is to improve HOW a bullet point is written — not WHAT it says.

ORIGINAL BULLET:
{req.bullet}

JOB DESCRIPTION (read only for tone and style — do NOT copy its tools or skills):
{req.jd_text[:1000]}

RESUME CONTEXT (for consistency of voice):
{req.resume_text[:600]}

STRICT RULES — violating any of these is unacceptable:
1. Use ONLY the tools, technologies, and skills already mentioned in the ORIGINAL BULLET. Do not add anything new.
2. Do NOT add Java, MongoDB, Docker, Kubernetes, or any other technology unless it is explicitly written in the original bullet.
3. Start each version with a different strong action verb.
4. Add a metric placeholder like [X%] or [N] ONLY where the original bullet already implies a measurable outcome.
5. Keep each version under 2 lines.
6. Improve clarity, impact, and ATS-friendliness — but stay 100% factually faithful to the original.

Respond in exactly this format — no preamble, no explanation:

VERSION 1 (ATS-optimized):
[rewritten bullet]

VERSION 2 (Impact-focused):
[rewritten bullet]

VERSION 3 (Concise):
[rewritten bullet]"""

    result = await ask_groq(prompt, max_tokens=600)
    return {"rewritten": result}


#Route 5: Full Resume Section Rewriter
@router.post("/rewrite-section")
async def rewrite_section(req: RewriteRequest):
    """
    Rewrites all bullets in a section using ONLY existing facts.
    Never adds skills or tools not present in the original.
    """
    input_lines = [l.strip() for l in req.bullet.strip().splitlines() if l.strip()]
    bullet_count = len(input_lines)

    prompt = f"""You are an expert resume writer. Your job is to improve HOW bullets are written — not WHAT they say.

ORIGINAL SECTION ({bullet_count} bullet point{"s" if bullet_count != 1 else ""}):
{req.bullet}

JOB DESCRIPTION (read only for tone/style — do NOT copy its tools or skills into the output):
{req.jd_text[:1000]}

STRICT RULES — violating any of these is unacceptable:
1. Output EXACTLY {bullet_count} bullet point{"s" if bullet_count != 1 else ""} — one rewrite per original bullet, in the same order.
2. Each rewritten bullet must correspond 1-to-1 with its original. Do not merge, split, or add bullets.
3. Use ONLY the tools, technologies, and skills already in each original bullet. Add nothing new.
4. Do NOT add Java, MongoDB, Docker, Kubernetes, or any technology unless it is explicitly in the original bullet.
5. Start each bullet with a strong action verb.
6. Add a metric placeholder like [X%] or [N] only where the original already implies a measurable outcome.
7. Keep each bullet under 2 lines.

Output format: one bullet per line, each starting with •
Nothing else — no headers, no explanation, no preamble."""

    result = await ask_groq(prompt, max_tokens=800)
    return {"rewritten": result}
