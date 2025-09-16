from fastapi import FastAPI, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
import ats_scoring as ats,os
import pdfplumber,docx,models,database,io,uvicorn
from auth import router as auth_router
from resume import router as resume_router


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router)
models.Base.metadata.create_all(bind=database.engine)
app.include_router(resume_router)

UPLOAD_FOLDER = "uploads"

def save_uploaded_file(file_bytes: bytes, filename: str) -> str:
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)
    file_location = os.path.join(UPLOAD_FOLDER, filename)
    with open(file_location, "wb") as f:
        f.write(file_bytes)
    return file_location


def parse_file(content: bytes, filename: str) -> str:
    file_text = ""
    try:
        if filename.endswith(".pdf"):
            with pdfplumber.open(io.BytesIO(content)) as pdf:
                file_text = " ".join([page.extract_text() or "" for page in pdf.pages])
        elif filename.endswith(".docx"):
            doc = docx.Document(io.BytesIO(content))
            file_text = " ".join([para.text for para in doc.paragraphs])
    except Exception as e:
        print(f"Error parsing file {filename}: {e}")
        return ""
    return file_text


@app.post("/analyze/")
async def analyze_resume(resume: UploadFile, jd: str = Form(...)):
    content = await resume.read()
    saved_file_path = save_uploaded_file(content,resume.filename)
    resume_text = parse_file(content,resume.filename)
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
        "resume_text": resume_text,
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
        "overqualified": result["overqualified"],
        "file_path": saved_file_path
    }


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)