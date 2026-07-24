# CompAnalytics — Employee Salary Prediction API

A full-stack machine learning project that predicts employee salaries based on age, gender, education level, job title, and years of experience — trained with scikit-learn, served through a FastAPI backend, and paired with a live web frontend for real-time predictions.

Unlike a notebook-only ML exercise, this repo packages the trained model as a real, callable REST API with input validation and Supabase-backed request logging, and ships it to a public production deployment.

**🔗 Live app:** https://companalytics.yuvrajjitbaruah.in
**📖 Wiki:** https://github.com/ASU-ML-Project/ML-Salary-Prediction-Production/wiki

---

## Features

- EDA and preprocessing on employee salary data (`salaryPredictionTraining.ipynb`)
- Regression models trained and compared — Linear Regression, Random Forest (`train_model.py`)
- FastAPI backend serving real-time predictions (`main.py`)
- Request validation via Pydantic (age, experience ranges enforced server-side)
- Request logging to Supabase (`predictions` table)
- Static HTML/CSS/JS frontend for live salary predictions
- Auto-generated interactive API docs via FastAPI (`/docs`, `/redoc`)
- Deployed to a VPS behind Nginx, running as a systemd service

---

## Tech Stack

| Layer | Technology |
|---|---|
| Language | Python |
| Data & ML | Pandas, Scikit-learn, Joblib |
| Backend | FastAPI + Uvicorn |
| Data logging | **Supabase** (Postgres) |
| Frontend (deployed) | Static HTML, CSS, JavaScript |
| Frontend (unused scaffold) | Next.js + Clerk auth — present in the repo but incomplete, not what's live |
| Reverse proxy | Nginx (VPS) → Caddy (AIC Cloud edge) |

> **Note:** an earlier version of this README described SQLite and a `backend/` subfolder — neither is accurate. The backend is Supabase-only and `main.py` lives at the repo root.

---

## Project Structure (actual, repo root)

ML-Salary-Prediction-Production/
├── main.py # FastAPI app — /health, /predict, /stats
├── train_model.py # Standalone training script
├── salaryPredictionTraining.ipynb # EDA + training notebook
├── Salary_Data.csv # Training dataset (synthetic)
├── salary_model.pkl # Trained Random Forest model
├── scaler.pkl # Fitted scaler (used conditionally)
├── model_columns.pkl # Exact one-hot encoded column order the model expects
├── model_info.pkl # model_name, top_job_titles, uses_scaled_input
├── package.json / next.config.ts / eslint.config.mjs # unused Next.js scaffold
└── .gitignore

---

## Getting Started

### Prerequisites

- Python 3.10+
- pip, Git
- A Supabase project (URL + API key) — the app won't start without these

### 1. Clone

```bash
git clone https://github.com/ASU-ML-Project/ML-Salary-Prediction-Production.git
cd ML-Salary-Prediction-Production
```

### 2. Set up environment

```bash
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install fastapi uvicorn joblib pandas supabase
```

### 3. Create the Supabase table

`main.py` logs every prediction to Supabase; the table isn't auto-created:

```sql
create table predictions (
  id bigint generated always as identity primary key,
  timestamp text,
  age float8,
  gender text,
  education_level text,
  job_title text,
  years_experience float8,
  predicted_salary float8
);
```

### 4. Set environment variables

```bash
export SUPABASE_URL="your-supabase-project-url"
export SUPABASE_KEY="your-supabase-api-key"
```

### 5. Run the backend

```bash
uvicorn main:app --reload
```

- API: `http://127.0.0.1:8000`
- Docs: `http://127.0.0.1:8000/docs`

Full walkthrough (frontend, retraining, etc.) → [Getting Started wiki page](https://github.com/ASU-ML-Project/ML-Salary-Prediction-Production/wiki/Getting%E2%80%90Started)

---

## API Reference

Full docs: [API Documentation wiki page](https://github.com/ASU-ML-Project/ML-Salary-Prediction-Production/wiki/API%E2%80%90Documentation)

### `GET /health`

```json
{ "status": "ok", "model": "RandomForestRegressor" }
```

### `POST /predict`

**Request**
```json
{
  "age": 29,
  "gender": "Male",
  "education_level": "Bachelor's",
  "job_title": "Software Engineer",
  "years_experience": 4
}
```
Server-side validation: `15 < age < 100`, `0 ≤ years_experience ≤ 60`. Job titles outside the trained top 20 fall back to "Other".

**Response**
```json
{ "predicted_salary": 68500.25 }
```

### `GET /stats`

```json
{ "total_predictions": 132, "average_predicted_salary": 71234.50 }
```

> The live frontend's "Export Report" button doesn't currently call a real endpoint — no `/export-report` route exists in `main.py` yet. Tracked in the [Roadmap](https://github.com/ASU-ML-Project/ML-Salary-Prediction-Production/wiki/Roadmap).

---

## Model Performance

| Model | R² | MAE | Notes |
|---|---|---|---|
| Random Forest Regressor | **0.893** | **₹11,011** | Selected for production, trained on 1,792 rows |
| Linear Regression | *TBD* | *TBD* | Baseline comparison |

**Note:** This project uses a synthetically generated dataset intended for educational purposes. Predictions should not be interpreted as real-world compensation benchmarks.

---

## Deployment

Live at https://companalytics.yuvrajjitbaruah.in — VPS (AIC Cloud, Ubuntu 24.04) running Nginx + FastAPI (systemd service `salary-api`) behind AIC Cloud's Caddy edge proxy, with Supabase for prediction logging.

Full infrastructure breakdown → [Deployment wiki page](https://github.com/ASU-ML-Project/ML-Salary-Prediction-Production/wiki/Deployment)

---

## Roadmap

- [ ] Wire up a real `/export-report` endpoint
- [ ] Restrict CORS (currently `allow_origins=["*"]`)
- [ ] Add a pinned `requirements.txt`
- [ ] Finish or remove the unused Next.js scaffold
- [ ] Fill in Linear Regression comparison numbers
- [ ] Automated tests (pytest)
- [ ] CI/CD on push to `main`

Full roadmap → [Roadmap wiki page](https://github.com/ASU-ML-Project/ML-Salary-Prediction-Production/wiki/Roadmap)

---

## Contributing

1. Branch: `git checkout -b feature/short-description`
2. Commit with a clear message
3. PR into `main`
4. At least one team member reviews before merging

Details → [Contributing wiki page](https://github.com/ASU-ML-Project/ML-Salary-Prediction-Production/wiki/Contributing)

---

## Team

| Name | GitHub |
|---|---|
| Himangshu Keot | [@Himangshu-06](https://github.com/Himangshu-06) |
| Yuvrajjit Baruah | [@yuvrajjitbaruah](https://github.com/yuvrajjitbaruah) |
| Nishrit Kashyap | [@nishritkashyap](https://github.com/nishritkashyap) |

Built as part of an ML Internship at Assam Skill University.
