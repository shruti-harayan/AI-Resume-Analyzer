import re
import string
import spacy
import pandas as pd
from unidecode import unidecode
from sentence_transformers import SentenceTransformer, util
from datetime import datetime

# Load spaCy and SBERT
nlp = spacy.load("en_core_web_sm")
sbert_model = SentenceTransformer('paraphrase-MiniLM-L6-v2')

# Noise words list
NOISE_WORDS = set(spacy.lang.en.stop_words.STOP_WORDS).union({
    "company", "job", "position", "description", "requirement", "responsibility","preferred","role","technology", 
    "engineer", "developer",'skills', 'ideal', 'strong', 'familiarity','excellent', 'good', 'basic', 'new', 
    'team','members','entry', 'level', 'peers', 'planning', 'issues', 'applications','storage', 'usage',
    'features', 'passionate','fresh', 'innovations', 'debug', 'discussions'
})

# Load Skills from master CSV
def load_master_skills(csv_path="master_skills.csv"):
    try:
        df = pd.read_csv(csv_path)
        skills = set(df['skill'].dropna().str.lower().str.strip())
        return skills
    except Exception as e:
        print(f"Error loading skills CSV: {e}")
        return set()

MASTER_SKILL_LIST = load_master_skills("master_skills.csv")


# Load Skill Aliases from CSV
def load_skill_aliases(csv_path="skill_aliases.csv"):
    aliases_map = {}
    try:
        # Try standard CSV load
        df = pd.read_csv(csv_path, encoding="utf-8")

        # If canonical not found, retry with other delimiters
        if 'canonical' not in df.columns:
            # Try semicolon delimiter
            df = pd.read_csv(csv_path, encoding="utf-8", delimiter=';')
        if 'canonical' not in df.columns:
            # Try to split the first column manually
            raw = pd.read_csv(csv_path, encoding="utf-8", header=None)
            split_df = raw[0].str.split(',', n=1, expand=True)
            split_df.columns = ['canonical', 'aliases']
            df = split_df

        # Clean up
        df['canonical'] = df['canonical'].astype(str).str.strip().str.lower()
        df['aliases'] = df['aliases'].astype(str).str.strip().str.lower()

        for _, row in df.iterrows():
            if row['canonical']:
                aliases = [a.strip() for a in row['aliases'].split('|') if a.strip()]
                aliases_map[row['canonical']] = aliases
        return aliases_map

    except Exception as e:
        print(f"❌ Error loading aliases CSV: {e}")
        return {}

SKILL_ALIASES = load_skill_aliases("skill_aliases.csv")


# Text Cleaning & Normalization
def clean_text(text):
    """Normalize, standardize YOE, remove accents/punctuation, lowercase, but keep numbers for experience detection."""
    if not text:
        return ""
    text = unidecode(text)
    text = text.lower()

    # Standardize experience shorthand
    text = re.sub(r"\bYOE\b", "years of experience", text, flags=re.I)
    text = re.sub(r"\bY\.O\.E\b", "years of experience", text, flags=re.I)

    # Remove punctuation but keep + for phrases like "10+ years"
    text = re.sub(r"[{}]".format(string.punctuation.replace("+", "")), " ", text)

    # Normalize spaces
    text = re.sub(r"\s+", " ", text).strip()
    return text


def normalize_text_for_skills(text):
    """Replace known aliases with canonical forms."""
    text_norm = text.lower()
    for canonical, aliases in SKILL_ALIASES.items():
        for alias in aliases:
            text_norm = re.sub(r'\b' + re.escape(alias) + r'\b', canonical, text_norm)
    return text_norm


# Dynamic Skill Extraction
def extract_dynamic_skills(text, master_skills=MASTER_SKILL_LIST):
    text_lower = normalize_text_for_skills(text.lower())
    found = set()
    for skill in master_skills:
        skill_lower = skill.lower()
        if skill_lower in NOISE_WORDS:
            continue
        if re.search(r'\b' + re.escape(skill_lower) + r'\b', text_lower):
            found.add(skill_lower)
    return found


# Semantic Similarity + ATS Score
def calc_similarity(text1, text2):
    emb1, emb2 = sbert_model.encode([text1, text2], convert_to_tensor=True)
    sim = util.pytorch_cos_sim(emb1, emb2)[0][0].item()
    return max(0.0, min(1.0, sim))



def extract_experience_from_dates(text):
    """Parse job timelines like 'Aug 2015 – Present' or '01/2018 - 07/2020' and estimate total YOE."""
    months = {
        "jan": 1, "feb": 2, "mar": 3, "apr": 4, "may": 5, "jun": 6,
        "jul": 7, "aug": 8, "sep": 9, "sept": 9, "oct": 10, "nov": 11, "dec": 12
    }

    # Match "Aug 2015", "January 2018", or "05/2015"
    date_regex = re.findall(r"([A-Za-z]{3,9})\s+(\d{4})|(\d{1,2})/(\d{4})", text)

    dates = []
    for match in date_regex:
        if match[0]:  # Month name + Year
            month = months.get(match[0].lower()[:3])
            year = int(match[1])
            if month and year:
                dates.append(datetime(year, month, 1))
        elif match[2]:  # Numeric month/year
            month = int(match[2])
            year = int(match[3])
            if month and year:
                dates.append(datetime(year, month, 1))

    total_years = 0
    # Assume pairs of [start, end]
    for i in range(0, len(dates), 2):
        start = dates[i]
        end = dates[i+1] if i+1 < len(dates) else datetime.now()
        diff_years = (end - start).days / 365
        total_years += diff_years

    return round(total_years)


def detect_numeric_experience(text):
    """Detect explicit mentions like '5 years of experience'."""
    exp_match = re.search(r"(\d+)\s*\+?\s*(?:years?|yrs?|yoe)\b", text, re.IGNORECASE)
    return int(exp_match.group(1)) if exp_match else None


def check_experience_gap(resume_text, jd_text):
    """
    Compare JD required experience vs resume years of experience.
    Returns: exp_gap_message, overqualified_message
    """

    # JD requirement
    exp_req = detect_numeric_experience(jd_text)
    # Resume experience (try numeric first, then dates)
    resume_years = detect_numeric_experience(resume_text)
    if not resume_years:
        resume_years = extract_experience_from_dates(resume_text)

    exp_gap = None
    overqualified = None

    if exp_req:
        if not resume_years or resume_years < exp_req:
            exp_gap = (
                f"JD requires {exp_req}+ years of experience, "
                f"but resume shows only {resume_years or 0} years."
            )
        elif resume_years > exp_req + 5:  
            overqualified = (
                f"Resume shows {resume_years} years, "
                f"while JD requires only {exp_req}+ years. "
                "You may be considered overqualified."
            )

    return exp_gap, overqualified


#Strict ATS score: semantic similarity is penalized when keyword overlap is low.
def ats_score_dynamic(resume_text, jd_text, sim_weight=0.5, key_weight=0.5, top_missing=15, strictness_factor=0.5):
    resume_clean = clean_text(resume_text)
    jd_clean = clean_text(jd_text)

    # Extract skills
    jd_skills = extract_dynamic_skills(jd_clean)
    resume_skills = extract_dynamic_skills(resume_clean)

    # Base semantic similarity
    sim = calc_similarity(resume_clean, jd_clean)

    # Keyword overlap ratio
    overlap = len(resume_skills & jd_skills) / len(jd_skills) if jd_skills else 0.0

    if overlap == 0:
        sim *= strictness_factor  

    score = sim_weight * sim + key_weight * overlap

    missing_skills = sorted(list(jd_skills - resume_skills))[:top_missing]
    matched_skills = sorted(list(resume_skills & jd_skills))

    exp_gap, overqualified = check_experience_gap(resume_text, jd_text)
    # Penalize score if gap exists
    if exp_gap:
        score *= 0.6  # 40% reduction

    return {
        "score": round(score * 100),
        "similarity": round(sim, 2),
        "keyword_overlap": round(overlap, 2),
        "strictness_factor_applied": overlap == 0,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "jd_skills": list(jd_skills),
        "experience_gap": exp_gap,   
        "overqualified": overqualified,
        "tips": get_recommendations(missing_skills, sim, overlap,score),
    }

#a human-friendly explanation for the given ATS score and details.
def explain_ats_score(score, details, matched_skills, missing_skills, jd_skills):
    explanation = []

    # Case 1: No skill overlap at all
    if len(jd_skills) == 0:
        return "No recognizable skills were extracted from the job description. Please ensure the JD is properly formatted and the skills CSV is comprehensive."
    
    if len(matched_skills) == 0:
        explanation.append(
            "⚠️ None of the required skills in the job description were found in your resume. This triggers a strict mismatch penalty, and the score reflects a low compatibility."
        )
        explanation.append(
            f"Missing key skills: {', '.join(missing_skills)}."
        )
        if details.get("similarity", 0) > 0.25:
            explanation.append(
                f"Some general experience overlaps were detected (semantic similarity: {details['similarity']:.2f}), but core skills did not match."
            )
    
    # Case 2: Partial skill match
    elif len(matched_skills) > 0 and details['keyword_overlap'] < 0.6:
        explanation.append(
            f"✅ Some required skills matched: {', '.join(matched_skills)}."
        )
        explanation.append(
            f"⚠️ However, these keywords are still missing: {', '.join(missing_skills)}."
        )
        explanation.append(
            f"Semantic similarity is moderate ({details['similarity']:.2f}), indicating partial relevance, but not all skills are covered."
        )
    
    # Case 3: High skill match
    elif details['keyword_overlap'] >= 0.6:
        explanation.append(
            f"✅ Most required skills matched: {', '.join(matched_skills)}."
        )
        explanation.append(
            f"Your resume is a close fit to the job description's requirements! ATS score is high due to both strong skill coverage and semantic relevance."
        )
        
    # Add score-specific nudge
    if score < 30 and not explanation:
        explanation.append("The ATS score is very low, indicating your resume is not a good fit for this job based on key skills and content relevance.")
    elif score < 60 and not explanation:
        explanation.append("The ATS score is moderate, with some relevant overlap. Adding more of the employer's required skills and using their wording could improve your match.")
    elif not explanation:
        explanation.append("Great! Your resume covers most key requirements from the job description.")

    return "\n\n".join(explanation)

def get_recommendations(missing_skills, semantic_similarity, keyword_overlap, score, max_skills_display=6):
    parts = []

    # Tone based on score
    if score < 30:
        tone_prefix = "⚠️ This role appears to be a poor match based on your current resume. "
    elif score < 60:
        tone_prefix = "This role is a partial match for your resume. "
    else:
        tone_prefix = "✅ Strong alignment detected. "

    parts.append(tone_prefix)

    # Missing Skills Summary
    if missing_skills:
        display_skills = missing_skills[:max_skills_display]
        if len(missing_skills) > max_skills_display:
            skill_text = ", ".join(display_skills) + ", and more"
        else:
            skill_text = ", ".join(display_skills)
        parts.append(f"Consider adding or emphasizing {skill_text} to better align with the job requirements.")

    # Semantic Similarity Feedback
    if semantic_similarity < 0.4 and keyword_overlap > 0:
        parts.append("Your resume includes some relevant terms, but you could rephrase your experience to more closely match the JD's language.")
    elif semantic_similarity < 0.25:
        parts.append("Content similarity with the JD is low; tailoring project and experience descriptions could significantly improve the match rate.")

    # If almost perfect match
    if not missing_skills and score >= 80:
        parts = ["🌟 Excellent match! Your resume already covers the core skills and aligns well with the job requirements."]

    return " ".join(parts)


#Warns about tables, graphics, and HTML tags.
def ats_unfriendly_features(text):
    warnings = []
    if re.search(r'[\u2500-\u25FF]', text):
        warnings.append("Avoid tables or graphics: Detected special/box characters.")
    if re.search(r"<img|<table", text):
        warnings.append("Images/table HTML tags detected.")
    return warnings