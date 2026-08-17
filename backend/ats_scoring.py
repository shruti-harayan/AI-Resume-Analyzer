import re
import string
import spacy
import pandas as pd
from unidecode import unidecode
from sentence_transformers import SentenceTransformer, util
from datetime import datetime
from groq import Groq
import os,csv

# Load spaCy and SBERT
nlp = spacy.load("en_core_web_sm")
sbert_model = SentenceTransformer('paraphrase-MiniLM-L6-v2')

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
csv_path = os.path.join(BASE_DIR, "skill_aliases.csv")

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

def map_to_canonical(skills):
    mapped = set()

    for skill in skills:
        skill = skill.lower().strip()
        found = False

        for canonical, aliases in SKILL_ALIASES.items():
            if skill == canonical or skill in aliases:
                mapped.add(canonical)
                found = True
                break

        if not found:
            mapped.add(skill)

    return mapped

def clean_text(text):
    if not text:
        return ""

    text = unidecode(text)
    text = text.lower()

    # Standardize YOE
    text = re.sub(r"\bYOE\b", "years of experience", text, flags=re.I)

    # Replace punctuation with space (safe)
    text = re.sub(r"[^\w\s+]", " ", text)

    # Prevent word merging
    text = re.sub(r"\s+", " ", text).strip()

    return text


def load_skill_aliases(csv_path="skill_aliases.csv"):
    aliases_map = {}
    try:

        with open(csv_path, encoding='utf-8') as f:
            for line in f:
                if ',' not in line:
                    continue

                canonical, aliases_str = line.strip().split(',', 1)

                # skip header
                if "canonical" in canonical.lower():
                    continue

                canonical = canonical.strip().lower().strip('"')
                aliases = [
                    a.strip().lower().strip('"')
                    for a in aliases_str.split("|")
                    if a.strip()
                ]

                aliases_map[canonical] = aliases
        return aliases_map

    except Exception as e:
        print(f"❌ Error loading aliases CSV: {e}")
        return {}
    
SKILL_ALIASES = load_skill_aliases(csv_path)

# ─────────────────────────────────────────────────────────────────
# Comprehensive noise filter — concepts, qualifications, and vague
# phrases that are NOT concrete measurable skills.
# ─────────────────────────────────────────────────────────────────
CONCEPT_NOISE = {
    # Generic business concepts
    'business','business objectives','business goals','business analysis',
    'roi','roi goals','governance','digital transformation','transformation',
    'initiatives','continuous improvement','pm maturity','maturity',
    # Responsibilities (not skills)
    'budget ownership','team management','decision-making','decision making',
    'problem solving','problem-solving','strategic thinking','analytical',
    'analytical skills','analytical thinking','collaboration',
    'cross-functional','cross functional','oversight','supervision',
    'mentoring','coaching','stakeholder','alignment','standardized',
    # Qualifications / degrees
    "bachelor's degree","master's degree","bachelor degree","master degree",
    "bachelor's","master's",'degree','certification','certifications',
    'qualified','phd','mba',
    # Redundant tool variants (canonical already in master CSV)
    'jira software','ms project software','project tools','project management tools',
    # Adjectives misread as skills
    'hybrid','strong','advanced','excellent','proven','effective','efficient',
    # Vague concepts
    'kpis','dashboards','reporting','mechanisms','frameworks','methodologies',
    'it programs','programs','portfolio','large-scale','enterprise',
    'multinational','standardized','alignment','maturity model',
    # Generic phrases
    'experience','relevant experience','related experience','work experience',
    'background','knowledge','understanding','proficiency','expertise',
    'ability','capability','skills','competency','competencies',
    # Single generic words
    'management','strategy','planning','execution','delivery','performance',
    'quality','efficiency','effectiveness','innovation','operations',
    'technology','process','processes','systems','solutions','tools',
    'analysis','design','development','implementation','integration',
}

# Canonical deduplication map — maps verbose/variant forms to canonical skill name
# Prevents "jira software" and "jira" both showing as missing
SKILL_CANONICALIZE = {
    'jira software': 'jira',
    'ms project': 'ms project',
    'microsoft project': 'ms project',
    'node js': 'node.js',
    'nodejs': 'node.js',
    'reactjs': 'react',
    'react js': 'react',
    'vuejs': 'vue',
    'vue js': 'vue',
    'angular js': 'angular',
    'angularjs': 'angular',
    'postgres': 'postgresql',
    'mongo': 'mongodb',
    'mongo db': 'mongodb',
    'k8s': 'kubernetes',
    'gcp': 'google cloud',
    'amazon web services': 'aws',
    'prince 2': 'prince2',
    'pmi pmp': 'pmp',
    'agile scrum': 'agile',
    'scrum agile': 'agile',
    'ci/cd': 'ci/cd',
    'cicd': 'ci/cd',
}

def normalize_skill(skill: str) -> str:
    """Lowercase, strip, apply canonical map."""
    s = skill.strip().lower()
    return SKILL_CANONICALIZE.get(s, s)

def is_real_skill(skill: str) -> bool:
    """
    Return True only if this is a concrete, nameable skill/tool/cert/methodology.
    Rejects generic concepts, qualifications, personality traits, and vague phrases.
    """
    s = skill.strip().lower()
    if not s or len(s) < 2:
        return False
    if s in CONCEPT_NOISE:
        return False
    if s in NOISE_WORDS:
        return False
    # Reject multi-word phrases that are clearly not skills
    words = s.split()
    if len(words) > 4:          # real skills are rarely 5+ words
        return False
    if len(words) == 1 and len(s) < 3:  # single chars / 2-char noise
        return False
    # Reject if all words are in noise/concept sets (e.g. "strong communication skills")
    if all(w in NOISE_WORDS or w in {'strong','excellent','advanced','proven','good','basic'} for w in words):
        return False
    return True


def skill_in_text(skill: str, text: str) -> bool:
    """Check if a skill literally appears in the source text (hallucination guard)."""
    text_l  = text.lower()
    skill_l = skill.lower().strip()
    if not skill_l:
        return False
    if re.search(r'[^\w\s]', skill_l):   # c++, node.js, .net
        return skill_l in text_l
    pattern = r'\b' + re.escape(skill_l) + r'\b'
    return bool(re.search(pattern, text_l))


def parse_structured_groq_output(raw: str, source_text: str) -> set:
    """
    Parse the categorized Groq output format:
        TOOLS_AND_SOFTWARE: item1, item2
        CERTIFICATIONS: item1, item2
        ...
    Returns a verified, normalized, noise-filtered skill set.
    """
    skills = set()
    # Extract everything after the colon on each category line
    category_pattern = re.compile(
        r'^(?:TOOLS_AND_SOFTWARE|CERTIFICATIONS|METHODOLOGIES|TECHNICAL_SKILLS|SOFT_SKILLS)\s*:\s*(.+)$',
        re.MULTILINE | re.IGNORECASE
    )
    for match in category_pattern.finditer(raw):
        items_str = match.group(1).strip()
        if items_str.lower() in ('none', 'n/a', '-', ''):
            continue
        for item in items_str.split(','):
            item = item.strip().lower()
            if not item:
                continue
            canonical = normalize_skill(item)
            # Only keep if: real skill + literally in source text
            if is_real_skill(canonical):
                skills.add(canonical)
            elif is_real_skill(item) and skill_in_text(item, source_text):
                skills.add(canonical)
    return skills


# ─────────────────────────────────────────────────────────────────
# Groq-powered skill extractor — Structured Categorized Approach
#
# Why categorized instead of free-form:
#   Free-form: "what skills are in this text?" → Groq extracts noun
#   phrases from sentences, hallucinates common tech skills, returns
#   things like "project managers", "reporting mechanisms", "bachelor's"
#
#   Categorized: "which TOOLS / CERTIFICATIONS / METHODOLOGIES appear?"
#   → Forces Groq to classify each item, preventing sentence-fragment
#   extraction and dramatically reducing hallucination.
#
# Final verification step checks every item against source text —
# guarantees nothing appears that wasn't literally written.
# ─────────────────────────────────────────────────────────────────
def extract_skills_via_groq(text: str) -> set:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return set()
    try:
        client = Groq(api_key=api_key)
        prompt = f"""Analyze the text below and extract only EXPLICITLY mentioned skills, tools, and credentials.

Extract into these 5 categories:
1. TOOLS_AND_SOFTWARE: Named software, platforms, tools (e.g. Jira, MS Project, Salesforce, Docker)
2. CERTIFICATIONS: Named certifications and credentials (e.g. PMP, AWS-SAA, PRINCE2, PgMP)
3. METHODOLOGIES: Named frameworks and methodologies (e.g. Agile, Scrum, Waterfall, ITIL, Kanban)
4. TECHNICAL_SKILLS: Specific professional/technical skills explicitly listed (e.g. Risk Management, Budgeting, SQL, Python)
5. SOFT_SKILLS: Interpersonal skills ONLY if explicitly listed as requirements (e.g. Leadership, Communication)

RULES — follow exactly:
- Only include items EXPLICITLY and CLEARLY named in the text
- Job responsibilities are NOT skills → skip ("manage project managers", "monitor project health")
- Degree requirements are NOT skills → skip ("bachelor's degree", "master's degree")
- Vague contextual phrases are NOT skills → skip ("reporting mechanisms", "project portfolio", "governance models")
- Adjectives describing experience level are NOT skills → skip ("strong", "proven", "advanced")
- When uncertain, leave the item out

TEXT:
{text[:2000]}

Output ONLY in this exact format — no other text:
TOOLS_AND_SOFTWARE: item1, item2
CERTIFICATIONS: item1, item2
METHODOLOGIES: item1, item2
TECHNICAL_SKILLS: item1, item2
SOFT_SKILLS: item1, item2"""

        response = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="openai/gpt-oss-120b",
            max_tokens=200,
            temperature=0.0,
        )
        raw = response.choices[0].message.content.strip()
        return parse_structured_groq_output(raw, text)

    except Exception as e:
        print(f"Groq skill extraction failed (falling back to CSV only): {e}")
        return set()


# ─────────────────────────────────────────────────────────────────
# Text Cleaning & Normalization
# ─────────────────────────────────────────────────────────────────


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
    text_norm = text.lower()

    for canonical, aliases in SKILL_ALIASES.items():
        for alias in aliases:
            pattern = r'(?<!\w)' + re.escape(alias) + r'(?!\w)'
            text_norm = re.sub(pattern, canonical, text_norm)

    return text_norm

# Dynamic Skill Extraction — CSV-based (fast, deterministic)
def extract_csv_skills(text, master_skills=MASTER_SKILL_LIST):
    """Match skills from text against the master CSV list + aliases, with normalization."""
    text_lower = normalize_text_for_skills(text.lower())
    found = set()
    for skill in master_skills:
        skill_lower = skill.lower()
        if skill_lower in NOISE_WORDS or not is_real_skill(skill_lower):
            continue
        if re.search(r'[^\w]', skill_lower):
            pattern = r'(?<!\w)' + re.escape(skill_lower) + r'(?!\w)'
        else:
            pattern = r'\b' + re.escape(skill_lower) + r'\b'
        if re.search(pattern, text_lower):
            found.add(normalize_skill(skill_lower))
        else:
            #  NEW: partial phrase match
            words = skill_lower.split()
            if len(words) > 1:
                # ONLY allow full phrase match (no partial word match)
                if re.search(r'\b' + re.escape(skill_lower) + r'\b', text_lower):
                    found.add(normalize_skill(skill_lower))
    return found


# Keep old name as alias so existing callers still work
def extract_dynamic_skills(text, master_skills=MASTER_SKILL_LIST):
    return extract_csv_skills(text, master_skills)


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
    """
    Extract experience periods by finding DATE RANGE patterns directly
    (e.g. '09/2015 – Present', 'Jan 2012 – Aug 2015', '2010 – 2012').
    This is far more accurate than the old approach of extracting individual
    dates and pairing them sequentially (which failed whenever dates appeared
    out of order in the resume layout).
    """
    MONTH_MAP = {
        'jan':1,'feb':2,'mar':3,'apr':4,'may':5,'jun':6,
        'jul':7,'aug':8,'sep':9,'sept':9,'oct':10,'nov':11,'dec':12
    }

    def parse_token(token):
        token = token.strip()
        if re.match(r'^(present|current|now|till\s*date|to\s*date)$', token, re.IGNORECASE):
            return datetime.now()
        # MM/YYYY
        m = re.match(r'^(\d{1,2})/(\d{4})$', token)
        if m:
            month, year = int(m.group(1)), int(m.group(2))
            if 1 <= month <= 12:
                return datetime(year, month, 1)
        # Month YYYY  (e.g. "Sep 2015", "September 2015")
        m = re.match(r'^([A-Za-z]{3,9})[\s.,]+(\d{4})$', token)
        if m:
            mo = MONTH_MAP.get(m.group(1)[:3].lower())
            if mo:
                return datetime(int(m.group(2)), mo, 1)
        # YYYY only
        m = re.match(r'^(\d{4})$', token)
        if m:
            return datetime(int(m.group(1)), 6, 1)  # assume mid-year
        return None

    # Build separator as a variable to avoid raw-string unicode escape issues
    SEP        = '[\u2013\u2014\u2012\u2015-]'   # en-dash, em-dash, figure-dash, horizontal bar, hyphen
    DATE_TOKEN = r'(?:\d{1,2}/\d{4}|[A-Za-z]{3,9}[\s.,]+\d{4}|\d{4})'
    END_TOKEN  = r'(?:present|current|now|till\s*date|to\s*date|' + DATE_TOKEN + r')'

    RANGE_FULL = re.compile(
        r'(' + DATE_TOKEN + r')'
        r'\s*' + SEP + r'+\s*'
        r'(' + END_TOKEN + r')',
        re.IGNORECASE
    )

    periods = []
    seen = set()
    for m in RANGE_FULL.finditer(text):
        s = parse_token(m.group(1))
        e = parse_token(m.group(2))
        if s and e and s <= e:
            key = (s.year, s.month, e.year, e.month)
            if key not in seen:
                seen.add(key)
                periods.append([s, e])
    return periods


def calc_experience_years(periods):
    """
    Calculate total experience by merging overlapping date ranges.
    Prevents double counting.
    """
    if not periods:
        return 0.0

    # Sort by start date
    periods = sorted(periods, key=lambda x: x[0])

    merged = []

    for start, end in periods:
        if not merged:
            merged.append([start, end])
        else:
            last_start, last_end = merged[-1]

            # If overlapping or continuous → merge
            if start <= last_end:
                merged[-1][1] = max(last_end, end)
            else:
                merged.append([start, end])

    # Now calculate total duration
    total_days = 0
    for start, end in merged:
        total_days += (end - start).days

    years = total_days / 365.25
    return round(years, 1)


def extract_skill_experience(text):
    """
    Extract skill-specific experience requirements like '3+ years in Java'.
    Deliberately ignores generic phrases like 'years in project/program management'
    because those refer to overall career experience, not a specific measurable skill.
    """
    # Words that are too generic to be treated as a specific skill requirement
    GENERIC_WORDS = {
        'project', 'program', 'management', 'experience', 'role', 'work',
        'field', 'industry', 'relevant', 'related', 'it', 'domain', 'area',
        'position', 'function', 'practice', 'business', 'environment'
    }

    exp_skill = {}
    pattern = r'(\d+)\s*\+?\s*(?:years?|yrs?|yoe)\s+(?:of\s+experience\s+)?(?:in|with|for)?\s*([a-zA-Z][a-zA-Z0-9_+#.]*)?'
    matches = re.findall(pattern, text, re.IGNORECASE)
    for years_str, skill in matches:
        skill_name = (skill or '').strip().lower().rstrip('/')
        # Only record if it's a concrete, non-generic skill name
        if skill_name and skill_name not in GENERIC_WORDS and len(skill_name) > 2:
            exp_skill[skill_name] = int(years_str)
    return exp_skill


def detect_numeric_experience(text):
    """
    Detect the highest overall experience requirement from text.
    Handles ranges like '10-15+ years' by taking the upper bound.
    """
    # Try range first: '10-15 years', '10–15+ years'
    range_match = re.search(r'(\d+)\s*[-–]+\s*(\d+)\s*\+?\s*years?', text, re.IGNORECASE)
    if range_match:
        return int(range_match.group(2))  # use the higher end
    # Single value: '10+ years', '15 years'
    single_match = re.search(r'(\d+)\s*\+?\s*years?', text, re.IGNORECASE)
    if single_match:
        return int(single_match.group(1))
    return None


def check_experience_gap(resume_text, jd_text):
    jd_exp_skill     = extract_skill_experience(jd_text)
    resume_exp_skill = extract_skill_experience(resume_text)
    exp_gap      = []
    overqualified = []

    periods     = extract_experience_periods(resume_text)
    total_years = calc_experience_years(periods)

    if jd_exp_skill:
        for skill, req in jd_exp_skill.items():
            cand_years = resume_exp_skill.get(skill, 0)
            if cand_years < req:
                exp_gap.append(f"JD requires {req}+ years in {skill}, but resume shows {cand_years}.")
            elif cand_years > req + 5:
                overqualified.append(f"Resume shows {cand_years} years in {skill}: overqualified for JD requiring {req}+.")
    else:
        # Fall back to total years comparison
        req = detect_numeric_experience(jd_text) or 0
        if req > 0:
            if total_years < req:
                exp_gap.append(f"JD requires {req}+ years overall; resume shows {total_years}.")
            elif total_years > req + 7:
                if req > 2:
                    overqualified.append(f"Resume has {total_years} years; JD only requires {req}+.")

    return exp_gap, overqualified


def expand_composite_skills(skills):
    expanded = set()

    for skill in skills:
        parts = re.split(r'[,&/]| and ', skill)
        parts = [p.strip() for p in parts if len(p.strip()) > 2]

        if len(parts) > 1:
            expanded.update(parts)
        expanded.add(skill)

    return expanded

def filter_irrelevant_skills(skills, reference_text):
    filtered = set()
    ref_text = reference_text.lower()

    for skill in skills:
        if re.search(r'\b' + re.escape(skill) + r'\b', ref_text):
            filtered.add(skill)

    return filtered

def strict_jd_filter(skills, jd_text):
    jd_text = jd_text.lower()
    filtered = set()

    for skill in skills:
        # allow if exact or partial presence
        if skill in jd_text:
            filtered.add(skill)
        else:
            words = skill.split()
            if any(w in jd_text for w in words):
                filtered.add(skill)

    return filtered

def strict_jd_skill_validation(skills, jd_text):
    jd_text = jd_text.lower()
    validated = set()

    for skill in skills:
        # exact phrase present
        if skill in jd_text:
            validated.add(skill)
            continue

        # check meaningful partial match (not single words like "testing")
        words = skill.split()
        if len(words) > 1 and all(w in jd_text for w in words):
            validated.add(skill)

    return validated


def normalize_skill_set(skills):
    normalized = set()

    for skill in skills:
        skill = skill.lower().strip()

        # direct canonical match
        if skill in SKILL_ALIASES:
            normalized.add(skill)
            continue

        # reverse alias match
        found = False
        for canonical, aliases in SKILL_ALIASES.items():
            if skill == canonical or skill in aliases:
                normalized.add(canonical)
                found = True
                break

        if not found:
            normalized.add(skill)

    return normalized


#Strict ATS score: semantic similarity is penalized when keyword overlap is low.
def ats_score_dynamic(resume_text, jd_text, sim_weight=0.4, key_weight=0.6, top_missing=15, strictness_factor=0.5):
    resume_clean = clean_text(resume_text)
    jd_clean = clean_text(jd_text)

    # ── Step 1: CSV-based skill extraction (fast, always runs) ──
    jd_skills_csv     = extract_csv_skills(jd_clean)
    resume_skills_csv = extract_csv_skills(resume_clean)

    # ── Step 2: Groq-based skill extraction (global coverage) ──
    # Run on original text (not cleaned) for better Groq comprehension
    jd_skills_groq     = extract_skills_via_groq(jd_text)
    resume_skills_groq = extract_skills_via_groq(resume_text)

    # ── Step 3: Merge — CSV is authoritative, Groq adds what CSV missed ──
    jd_raw_skills = jd_skills_csv | jd_skills_groq
    jd_skills = expand_composite_skills(
    jd_skills_csv | filter_irrelevant_skills(jd_skills_groq, jd_text)
)

    resume_skills = expand_composite_skills(
        resume_skills_csv | filter_irrelevant_skills(resume_skills_groq, resume_text)
    )

    #  APPLY ALIAS NORMALIZATION HERE
    jd_skills = map_to_canonical(jd_skills)
    resume_skills = map_to_canonical(resume_skills)
   
    jd_skills = strict_jd_skill_validation(jd_skills, jd_text)


    # ── Step 4: Semantic similarity (unchanged) ──
    sim = calc_similarity(resume_clean, jd_clean)

    # ── Step 5: Keyword overlap ratio ──
    # Exact match
    exact_matched = resume_skills & jd_skills

    # Semantic match
    semantic_matched, _ = semantic_skill_match(resume_skills, jd_skills)

    # Combine both
    matched_skills = exact_matched | semantic_matched
    missing_skills = jd_skills - matched_skills

    # Overlap
    overlap = len(matched_skills) / len(jd_skills) if jd_skills else 0.0

    # Sort for output
    matched_skills = sorted(list(matched_skills))
    missing_skills = sorted(list(missing_skills))[:top_missing]

    if overlap < 0.1:
        sim *= 0.95

    score = sim_weight * sim + key_weight * overlap
   
    exp_gap, overqualified = check_experience_gap(resume_text, jd_text)
    if exp_gap:
        score *= 0.6  # 40% reduction


    return {
        "score": round(score * 100),
        "similarity": round(sim, 2),
        "keyword_overlap": round(overlap, 2),
        "strictness_factor_applied": overlap < 0.2,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "jd_skills": list(jd_skills),
        "experience_gap": exp_gap,
        "overqualified": overqualified,
        "tips": get_recommendations(missing_skills, sim, overlap, score * 100 if score < 2 else score),
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



def semantic_skill_match(resume_skills, jd_skills, threshold=0.35):
    matched = set()
    missing = set(jd_skills)

    if not resume_skills or not jd_skills:
        return set(), jd_skills

    resume_list = list(resume_skills)
    jd_list = list(jd_skills)

    embeddings = sbert_model.encode(resume_list + jd_list, convert_to_tensor=True)

    res_emb = embeddings[:len(resume_list)]
    jd_emb = embeddings[len(resume_list):]

    for i, jd_skill in enumerate(jd_list):
        sims = util.cos_sim(jd_emb[i], res_emb)[0]

        if max(sims) >= threshold:
            matched.add(jd_skill)
            missing.discard(jd_skill)

    return matched, missing


#Warns about tables, graphics, and HTML tags.
def ats_unfriendly_features(text):
    warnings = []

    # Detect real table structures (lines, boxes)
    if re.search(r'[\u2500-\u257F]{3,}', text):
        warnings.append("Avoid tables or graphics: Detected table-like structures.")

    # Detect HTML tables/images
    if re.search(r"<img|<table", text):
        warnings.append("Images/table HTML tags detected.")

    return warnings