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

![Homepage](<img width="1877" height="540" alt="Screenshot 2025-09-11 222424" src="https://github.com/user-attachments/assets/a1c4750e-6097-42c4-ab1b-06411f30dc24" />
)(<img width="1919" height="871" alt="Screenshot 2025-09-11 222445" src="https://github.com/user-attachments/assets/6dd60648-4830-4441-bad7-26af6140ac1e" />
)(<img width="1910" height="893" alt="Screenshot 2025-09-11 222504" src="https://github.com/user-attachments/assets/a88aaed4-87cd-4786-8dac-bb9e15065568" />
)

### 🔐 Login & Signup

![Login](./screenshots/login.png)
![Signup](./screenshots/signup.png)

### 🎓 Student Dashboard

![Student Dashboard](./screenshots/student-dashboard.png)

### 📊 ATS Result

![ATS Result](./screenshots/ats-result.png)

### 📈 How Scoring Works

![Scoring](./screenshots/scoring.png)

### 🧑‍💼 Recruiter Dashboard

![Recruiter Dashboard](./screenshots/recruiter-dashboard.png)

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

## 🎯 Future Enhancements

* 🔄 Fine-tuned SBERT models
* ⚖️ Bias detection (AI fairness)
* 🌐 Integration with job portals
* 📊 Advanced analytics dashboard
* 🤖 Real-time learning from recruiter feedback

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
MSc IT | AI Resume Analyzer Project

---

## ⭐ Support

If you like this project:

* ⭐ Star the repo
* 🍴 Fork it
* 📢 Share it

---
