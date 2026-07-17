#  Employee Salary Prediction API

A full-stack machine learning project that predicts employee salaries based on demographic and professional attributes — trained with scikit-learn, served through a FastAPI backend, and paired with an interactive web frontend for real-time predictions.

Unlike a typical notebook-only ML project, this repo goes a step further: it packages the trained model as a real, callable REST API with input validation and request logging — demonstrating how a model actually gets deployed in a production system.

---

---

##  Features

-  Exploratory Data Analysis on employee salary data
-  Data preprocessing (encoding, scaling, missing value handling)
-  Regression model trained and evaluated (Linear Regression, Random Forest)
-  FastAPI backend serving real-time predictions
-  Input validation using Pydantic schemas
-  Request logging via SQLite
-  nteractive frontend for live salary predictions
-  Auto-generated API docs (Swagger UI via FastAPI)

---

##  Tech Stack

| Layer | Technology |
|---|---|
| Language | Python |
| Data & ML | Pandas, NumPy, Scikit-learn, Matplotlib, Seaborn |
| Backend | FastAPI |
| Database | SQLite |
| Frontend | HTML, CSS, JavaScript |
| Model Persistence | Joblib |

---

## 📁 Project Structure
```
salary-predictor-api/
├── data/               # Raw and processed dataset
├── notebooks/          # EDA and model training notebook
├── model/              # Saved model.joblib, scaler.joblib
├── backend/            # FastAPI application
│   ├── main.py
│   ├── schemas.py      # Pydantic request/response models
│   └── database.py     # SQLite logging
├── frontend/            # Web interface
├── requirements.txt
├── .gitignore
└── README.md
```
---

## ⚙️ Getting Started

### Prerequisites
- Python 3.10+
- pip
- Git

### 1. Clone the repository
```bash
git clone https://github.com/Himangshu-06/ml-salary-prediction-api-production.git
cd ml-salary-prediction-api-production
```

### 2. Set up a virtual environment
```bash
python -m venv venv
source venv/bin/activate      # on Windows: venv\Scripts\activate
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Run the backend
```bash
cd backend
uvicorn main:app --reload
```

The API will be running at `http://127.0.0.1:8000`  
Interactive docs available at `http://127.0.0.1:8000/docs`

### 5. Open the frontend
_(Add instructions once the frontend is built)_

---

## 📡 API Reference

### `GET /health`
Health check endpoint.
```json
{ "status": "ok" }
```

### `POST /predict`
Predicts salary based on employee attributes.

**Request:**
```json
{
  "age": 29,
  "gender": "Male",
  "education_level": "Bachelor's",
  "job_title": "Software Engineer",
  "years_experience": 4
}
```

**Response:**
```json
{
  "predicted_salary": 68500.25
}
```

### `GET /stats`
Returns aggregate statistics on predictions made so far.

Full interactive documentation available at `/docs` once the server is running.

---

## 📊 Model Performance

| Model | MAE | MSE | RMSE | R² |
|---|---|---|---|---|
| Linear Regression | _TBD_ | _TBD_ | _TBD_ | _TBD_ |
| Random Forest Regressor | _TBD_ | _TBD_ | _TBD_ | _TBD_ |

**Note:** This project uses a synthetically generated dataset intended for educational purposes. Predictions should not be interpreted as real-world compensation benchmarks.

---

## 🗺️ Roadmap

- [ ] EDA and preprocessing
- [ ] Model training and evaluation
- [ ] FastAPI backend with `/predict` endpoint
- [ ] SQLite request logging
- [ ] Frontend interface
- [ ] Deployment
- [ ] `/stats` analytics endpoint
- [ ] Automated tests (pytest)

See the full [Wiki](../../wiki) for detailed documentation.

---

## 🤝 Contributing

1. Create a new branch: `git checkout -b feature/short-description`
2. Commit your changes with a clear message
3. Push and open a Pull Request into `main`
4. At least one team member reviews before merging

See the [Contributing guide](../../wiki/Contributing) for more details.

---

## 👥 Team

| Name | GitHub |
|---|---|
| _Himangshu Keot_ | [@Himangshu-06](https://github.com/Himangshu-06) |
| _Yuvrajjit Baruah_ | [@yuvrajjitbaruah](https://github.com/yuvrajjitbaruah) | 
| _Nishrit Kashyap_ | [@nishritkashyap](https://github.com/nishritkashyap) | 

