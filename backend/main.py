from fastapi import FastAPI, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import ats_scoring as ats
import pdfplumber
import docx
import io
from auth import router as auth_router

app = FastAPI()
app.include_router(auth_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def parse_file(uploaded_file: UploadFile):
    """Parse text from PDF or DOCX."""
    file_text = ""
    content = uploaded_file.file.read()
    try:
        if uploaded_file.filename.endswith(".pdf"):
            with pdfplumber.open(io.BytesIO(content)) as pdf:
                file_text = " ".join([page.extract_text() or "" for page in pdf.pages])
        elif uploaded_file.filename.endswith(".docx"):
            doc = docx.Document(io.BytesIO(content))
            file_text = " ".join([para.text for para in doc.paragraphs])
    except Exception as e:
        return ""
    return file_text

@app.post("/analyze/")
async def analyze_resume(resume: UploadFile, jd: str = Form(...)):
    resume_text = parse_file(resume)
    if not resume_text.strip():
        return {"error": "Could not extract text from resume"}

    result = ats.ats_score_dynamic(
        resume_text, jd,
        sim_weight=0.5, key_weight=0.5,
        strictness_factor=0.5
    )

    explanation = ats.explain_ats_score(
        result["score"],
        {
            "similarity": result["similarity"],
            "keyword_overlap": result["keyword_overlap"],
            "strictness_factor_applied": result["strictness_factor_applied"]
        },
        result["matched_skills"],
        result["missing_skills"],
        result["jd_skills"]
    )

    warnings = ats.ats_unfriendly_features(resume_text)

    if result.get("experience_gap"):
        warnings.append(result["experience_gap"])


    return {
        "score": result["score"],
        "details": {
            "similarity": result["similarity"],
            "keyword_overlap": result["keyword_overlap"],
            "strictness_factor_applied": result["strictness_factor_applied"]
        },
        "matched_skills": result["matched_skills"],
        "missing_skills": result["missing_skills"],
        "explanation": explanation,
        "warnings": warnings,
        "tips": result["tips"],
        "experience_gap": result["experience_gap"],  
        "overqualified": result["overqualified"]
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)