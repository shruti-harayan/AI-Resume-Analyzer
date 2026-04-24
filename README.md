---

# 🚀 AI Resume Analyzer (CVisionary)

An **AI-powered Resume Analyzer** that evaluates resumes against job descriptions using **semantic similarity, hybrid ATS scoring, and LLM-based feedback**.

Built to simulate **real recruiter evaluation** — not just keyword matching.

---

## 📌 Project Overview

Traditional ATS systems rely on **keyword matching**, which often leads to:

* ❌ False positives (keyword stuffing)
* ❌ False negatives (synonyms missed)
* ❌ No feedback to candidates

This project solves these issues using:

* ✅ Semantic understanding (SBERT)
* ✅ Hybrid scoring (Semantic + Keywords)
* ✅ Alias normalization (real-world skill mapping)
* ✅ Explainable AI feedback
* ✅ Skill gap detection

📄 Based on your project documentation 

---

## ✨ Features

### 👩‍🎓 Student Features

* Upload resume (PDF/DOCX)
* Paste job description
* Get ATS score instantly
* View:

  * ✅ Matched skills
  * ❌ Missing skills
  * ⚠️ Experience gaps
* Download report (CSV/PDF)

### 🧑‍💼 Recruiter Features

* View all candidates
* Filter by job description
* Compare ATS scores
* Download resumes

### 🧠 AI Features

- SBERT semantic similarity
- Hybrid skill matching (exact + semantic)
- Alias normalization (e.g., *spreadsheet → Excel*)
- Composite skill handling (*planning & scheduling*)
- LLM-powered:
  - Resume bullet rewriting
  - Resume improvement suggestions
  - Interview questions

---

## 🧮 How Scoring Works

```
Final Score = (0.4 × Semantic Similarity) + (0.6 × Keyword Overlap)
```

* 📌 **Semantic Similarity** → SBERT embeddings
* 📌 **Keyword Overlap** → Skill matching
* ⚠️ **Strictness Penalty** → Applied if no skills match
* ⚠️ **Experience Penalty** → Applied for mismatch

---

## 🛠️ Tech Stack

### Frontend

* React.js (Vite)
* Tailwind CSS

### Backend

* FastAPI (Python)
* spaCy (NLP)
* Sentence-BERT (Sentence Transformers)
* Groq API (LLM)

### Database

* SQLite
* SQLAlchemy ORM

---

## 📂 Project Structure

```
├── backend/
│   ├── main.py
│   ├── ats_scoring.py
│   ├── resume.py
│   ├── auth.py
│   └── models.py
│
├── frontend/
│   ├── src/
│ ├── components/
│ └── pages/
│
└── README.md
```

---

## 📸 Screenshots

### 🏠 Homepage

<img width="1877" height="540" alt="Screenshot 2025-09-11 222424" src="https://github.com/user-attachments/assets/a1c4750e-6097-42c4-ab1b-06411f30dc24" />
<img width="1919" height="871" alt="Screenshot 2025-09-11 222445" src="https://github.com/user-attachments/assets/6dd60648-4830-4441-bad7-26af6140ac1e" />
<img width="1910" height="893" alt="Screenshot 2025-09-11 222504" src="https://github.com/user-attachments/assets/a88aaed4-87cd-4786-8dac-bb9e15065568" />

### 🔐 Login & Signup

<img width="478" height="474" alt="Screenshot 2025-09-11 224146" src="https://github.com/user-attachments/assets/0db699c9-17ed-4db9-a78e-824c74564a1e" />
<img width="585" height="559" alt="Screenshot 2025-09-11 223955" src="https://github.com/user-attachments/assets/c7155524-e7a0-4780-9ad2-fe68f4d63a45" />

### 🎓 Student Dashboard
<img width="1907" height="895" alt="Screenshot 2026-04-24 155244" src="https://github.com/user-attachments/assets/96ace654-5ee0-4126-a776-899849ba402f" />
<img width="1237" height="750" alt="Screenshot 2026-04-24 155407" src="https://github.com/user-attachments/assets/73178baf-df29-4ba8-84fc-fad171574939" />

### 📊 ATS Result
<img width="1160" height="668" alt="Screenshot 2026-04-24 155422" src="https://github.com/user-attachments/assets/7db493f3-6dec-49bd-8cd6-3af516ea8ebc" />
<img width="448" height="323" alt="image" src="https://github.com/user-attachments/assets/1e2d9077-ba33-4576-9e17-521658533f6f" />


### Cover Letter Generation
<img width="1036" height="795" alt="Screenshot 2026-04-24 155548" src="https://github.com/user-attachments/assets/e3b3b001-5eff-4b03-b37a-db8d766e93e0" />

### Interview Question Generator
<img width="1037" height="791" alt="Screenshot 2026-04-24 155611" src="https://github.com/user-attachments/assets/185bd76c-eb47-44d1-8507-c797436a6d3d" />

### Resume Rewriter
<img width="1028" height="780" alt="Screenshot 2026-04-24 155657" src="https://github.com/user-attachments/assets/75bf57b5-f16c-44b3-a3e9-242960770b2e" />
<img width="1039" height="596" alt="Screenshot 2026-04-24 155727" src="https://github.com/user-attachments/assets/9f2e1b4f-9f47-42ca-b4d1-fad461c81e27" />
<img width="894" height="770" alt="Screenshot 2026-04-24 155822" src="https://github.com/user-attachments/assets/16b5ab6c-1aa7-444a-9be4-bb10039052fb" />


### 📈 How Scoring Works
<img width="964" height="838" alt="Screenshot 2026-04-24 155850" src="https://github.com/user-attachments/assets/1179bb37-81ae-4cef-9e7d-84dd1c90a023" />
<img width="984" height="889" alt="Screenshot 2026-04-24 155908" src="https://github.com/user-attachments/assets/71c1a0be-1eda-493d-b0d1-de48a69a91b0" />
<img width="1344" height="871" alt="Screenshot 2026-04-24 155925" src="https://github.com/user-attachments/assets/14a151f4-5c9d-4cb8-b389-49ac9466cd75" />

### 🧑‍💼 Recruiter Dashboard

<img width="1574" height="662" alt="Screenshot 2025-09-17 144019" src="https://github.com/user-attachments/assets/a4bfcba2-a03b-4696-b162-c4fb67c2ffbb" />

### Downloaded ATS Result
<img width="494" height="778" alt="Screenshot 2026-04-24 160450" src="https://github.com/user-attachments/assets/b05ba27a-21b9-4b66-a033-bf9612e448ae" />
<img width="681" height="516" alt="Screenshot 2026-04-24 160503" src="https://github.com/user-attachments/assets/93d90ce9-f1a3-4b25-a48a-9057d5b47422" />

---

## ⚙️ Installation & Setup

### 1️⃣ Clone Repository

```bash
git clone https://github.com/your-username/ai-resume-analyzer.git
cd ai-resume-analyzer
```

### 2️⃣ Backend Setup

```bash
cd backend
pip install -r requirements.txt
python -m spacy download en_core_web_sm
uvicorn main:app --reload
```

### 3️⃣ Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## 📦 Environment Variables

Create a `.env` file in backend:

```
SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

---

## 📊 Sample Output

* ATS Score: **16%**
* Matched Skills: `Python, Flask`
* Missing Skills: `Django, Microservices, NumPy`
* Experience Gap: `3+ years required, 0 found`

---

## 🤝 Contribution

Contributions are welcome!

```bash
1. Fork the repo
2. Create a new branch
3. Commit changes
4. Open a Pull Request
```

---

## 📜 License

This project is licensed under the **MIT License**.

---

## 👩‍💻 Author

**Shruti Harayan**
MSc IT academic topper | Research-based Project | Published Research Paper

---

## ⭐ Support

If you like this project:

* ⭐ Star the repo
* 🍴 Fork it
* 📢 Share it

---
