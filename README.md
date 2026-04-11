---

# 🚀 AI Resume Analyzer (CVisionary)

An **AI-powered Resume Analyzer** that uses **Natural Language Processing (NLP)** and **Semantic Similarity (SBERT)** to evaluate resumes against job descriptions and provide **ATS scores, skill gaps, and actionable feedback**.

---

## 📌 Project Overview

Traditional ATS systems rely on **keyword matching**, which often leads to:

* ❌ False positives (keyword stuffing)
* ❌ False negatives (synonyms missed)
* ❌ No feedback to candidates

This project solves these issues using:

* ✅ Semantic understanding (SBERT)
* ✅ Hybrid scoring (Semantic + Keywords)
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

* SBERT semantic similarity
* Keyword overlap analysis
* Hybrid scoring system
* Explainable feedback system

---

## 🧮 How Scoring Works

```
Final Score = (0.5 × Semantic Similarity) + (0.5 × Keyword Overlap)
```

* 📌 **Semantic Similarity** → SBERT embeddings
* 📌 **Keyword Overlap** → Skill matching
* ⚠️ **Strictness Penalty** → Applied if no skills match
* ⚠️ **Experience Penalty** → Applied for mismatch

---

## 🛠️ Tech Stack

### Frontend

* React.js
* Tailwind CSS

### Backend

* FastAPI (Python)
* spaCy (NLP)
* Sentence-BERT (SBERT)

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
│   ├── ATS.jsx
│   ├── StudentDashboard.jsx
│   ├── RecruiterDashboard.jsx
│   └── Login.jsx
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
<img width="1334" height="714" alt="Screenshot 2025-09-11 224207" src="https://github.com/user-attachments/assets/a114b021-0e1a-421a-b97a-7f804751c462" />
<img width="1084" height="701" alt="Screenshot 2025-09-11 225102" src="https://github.com/user-attachments/assets/70bf56e1-f6e5-4466-a751-b77f8602e130" />


### 📊 ATS Result
<img width="1019" height="821" alt="Screenshot 2025-09-11 225139" src="https://github.com/user-attachments/assets/4d6dce00-8f00-4efd-94f2-5297162354ae" />
<img width="503" height="395" alt="image" src="https://github.com/user-attachments/assets/cb4a464c-6ddb-4ea2-a626-bedf9af5e65f" />


### 📈 How Scoring Works
<img width="1267" height="872" alt="Screenshot 2025-09-12 163907" src="https://github.com/user-attachments/assets/0cb112f0-3632-42e7-839f-d9b3ca955c5a" />
<img width="825" height="787" alt="Screenshot 2025-09-12 163958" src="https://github.com/user-attachments/assets/c418ee10-4acc-469c-b412-3af09dc98465" />
<img width="1550" height="777" alt="Screenshot 2025-09-12 164059" src="https://github.com/user-attachments/assets/e5448ae1-39a4-409a-96f8-6b132e954553" />



### 🧑‍💼 Recruiter Dashboard

<img width="1574" height="662" alt="Screenshot 2025-09-17 144019" src="https://github.com/user-attachments/assets/a4bfcba2-a03b-4696-b162-c4fb67c2ffbb" />

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
