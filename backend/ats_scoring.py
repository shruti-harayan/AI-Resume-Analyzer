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
        # Special logic for skills with non-alphanumeric characters
        if re.search(r'[^\w]', skill_lower):  # If skill has chars like +, #
            # Look for exact substring surrounded by word boundaries or punctuation, case insensitive
            pattern = r'(?<!\w)' + re.escape(skill_lower) + r'(?!\w)'
        else:
            pattern = r'\b' + re.escape(skill_lower) + r'\b'
        if re.search(pattern, text_lower):
            found.add(skill_lower)
    return found


# Semantic Similarity + ATS Score
def calc_similarity(text1, text2):
    emb1, emb2 = sbert_model.encode([text1, text2], convert_to_tensor=True)
    sim = util.pytorch_cos_sim(emb1, emb2)[0][0].item()
    return max(0.0, min(1.0, sim))


def has_internship_keywords(text):
    internship_terms = {"internship", "intern", "interned", "trainee", "apprentice"}
    text_lower = text.lower()
    return any(term in text_lower for term in internship_terms)

def classify_experience_level(resume_text):
    periods = extract_experience_periods(resume_text)
    total_years = calc_experience_years(periods)
    
    internship_flag = has_internship_keywords(resume_text)

    if internship_flag and total_years < 1:
        return "Internships"
    if total_years < 1:
        return "Fresher"
    if 1 <= total_years <= 2:
        return "Entry level"
    if 3 <= total_years <= 5:
        return "Mid level"
    if 6 <= total_years < 10:
        return "Senior level"
    if total_years >= 10:
        return "Experienced"
    return "Unknown"


def extract_experience_periods(text):
    """Find experience periods as pairs: [(start, end), ...]"""
    months = {"jan":1, "feb":2, "mar":3, "apr":4, "may":5, "jun":6,
              "jul":7, "aug":8, "sep":9, "sept":9, "oct":10, "nov":11, "dec":12 }
    # Match formats: "Aug 2015", "05/2015"
    matches = re.findall(r"([A-Za-z]{3,9})\s+(\d{4})|(\d{1,2})/(\d{4})", text)
    dates = []
    for m in matches:
        if m[0]:
            month = months.get(m[0][:3].lower())
            year = int(m[1])
            if month: dates.append(datetime(year, month, 1))
        elif m[2]:
            month = int(m[2])
            year = int(m[3])
            dates.append(datetime(year, month, 1))
    # Build experience periods as [start, end] pairs
    periods = []
    for i in range(0, len(dates), 2):
        start = dates[i]
        end = dates[i+1] if i+1 < len(dates) else datetime.now()
        if start > end: continue
        periods.append([start, end])
    return periods

def calc_experience_years(periods):
    """Sum total years of all periods, ignoring overlaps."""
    total = 0
    for start, end in periods:
        years = (end - start).days / 365.0
        if years > 0:
            total += years
    return round(total, 1)

def extract_skill_experience(text):
    exp_skill = {}
    generic_words = {"role", "job", "position", "for", "this", "the", "in", "with", "of", "experience"}
    # Make skill optional, but only add if present and non-generic
    pattern = r"(\d+)\s*\+?\s*(?:years?|yrs?|yoe)\s+(?:of\s+experience\s+)?(?:in|with|for)?\s*([a-zA-Z0-9_]+)?"
    matches = re.findall(pattern, text, re.IGNORECASE)
    for years, skill in matches:
        # Only add if skill is present and not generic
        skill_name = (skill or "").strip().lower()
        if skill_name and skill_name not in generic_words:
            exp_skill[skill_name] = int(years)
    return exp_skill


def detect_numeric_experience(text):
    """Detect explicit mentions like '5 years of experience'."""
    exp_match = re.search(r"(\d+)\s*\+?\s*(?:years?|yrs?|yoe?|years of experience)\b", text, re.IGNORECASE)
    return int(exp_match.group(1)) if exp_match else None


def check_experience_gap(resume_text, jd_text):
    jd_exp_skill = extract_skill_experience(jd_text)  # {skill: years}
    resume_exp_skill = extract_skill_experience(resume_text)  # {skill: years}
    exp_gap = []
    overqualified = []
    periods = extract_experience_periods(resume_text)
    total_years = calc_experience_years(periods)
    
    # Skill-specific JD requirement
    if jd_exp_skill:
        for skill, req in jd_exp_skill.items():
            cand_years = resume_exp_skill.get(skill, 0)
            if cand_years < req:
                exp_gap.append(f"JD requires {req}+ years in {skill}, but resume shows {cand_years}.")
            elif cand_years > req + 5:
                overqualified.append(f"Resume shows {cand_years} years in {skill}: overqualified for JD requiring {req}+.")
    # Fallback: JD has numeric experience requirement, but no skill
    else:
        req = detect_numeric_experience(jd_text) or 0
        if req > 0:  # JD requires at least some experience
            if total_years < req:
                exp_gap.append(f"JD requires {req}+ years overall; resume shows {total_years}.")
            elif total_years > req + 5:
                overqualified.append(f"Resume has {total_years} years; JD only requires {req}+.")

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
        "tips": get_recommendations(missing_skills, sim, overlap,score*100 if score < 2 else score),
    }

#a human-friendly explanation for the given ATS score and details.
def explain_ats_score(score, details, matched_skills, missing_skills, jd_skills, experience_gap=None):
    explanation = []
    # Case 1: No skill overlap at all
    if len(jd_skills) == 0:
        return "No recognizable skills were extracted from the job description. Please ensure the JD is properly formatted."
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
        # Add gap warning if present or score is low
        if experience_gap and (isinstance(experience_gap, list) and experience_gap) or (isinstance(experience_gap, str) and experience_gap.strip() != ""):
            explanation.append(
                f"⚠️ Experience gap detected: {experience_gap if isinstance(experience_gap, str) else '; '.join(experience_gap)}"
            )
            explanation.append(
                f"Score is low due to the experience gap with required years."
            )
        elif score < 60:
            explanation.append(
                f"Your resume matches key skills, but your overall ATS score is moderate due to other factors."
            )
        else:
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
    # Ensure score is in 0-100 range
    if score <= 1.0:
        score = score * 100
    parts = []

    if score < 30:
        tone_prefix = "⚠️ This role appears to be a poor match."
    elif score < 60:
        tone_prefix = "This role is a partial match for your resume."
    elif score < 80:
        tone_prefix = "👍 Good match detected."
    else:
        tone_prefix = "🌟 Excellent match!"
    parts.append(tone_prefix)

    if missing_skills:
        display_skills = missing_skills[:max_skills_display]
        if len(missing_skills) > max_skills_display:
            skill_text = ", ".join(display_skills) + ", and more"
        else:
            skill_text = ", ".join(display_skills)
        parts.append(
            f"Consider adding or emphasizing {skill_text} to better align with the job requirements.")
    
    # Semantic similarity feedback
    if semantic_similarity < 0.4 and keyword_overlap > 0:
        parts.append("Your resume includes some relevant terms, but rephrasing your experience to match the JD's language could help.")
    elif semantic_similarity < 0.25:
        parts.append("Content similarity with the JD is low; tailoring your project and experience descriptions could improve your match rate.")

    # If perfect match
    if not missing_skills and score >= 80:
        return "🌟 Excellent match! Your resume already covers the core skills and aligns well with the job requirements."

    return " ".join(parts)


#Warns about tables, graphics, and HTML tags.
def ats_unfriendly_features(text):
    warnings = []
    if re.search(r'[\u2500-\u25FF]', text):
        warnings.append("Avoid tables or graphics: Detected special/box characters.")
    if re.search(r"<img|<table", text):
        warnings.append("Images/table HTML tags detected.")
    return warnings
