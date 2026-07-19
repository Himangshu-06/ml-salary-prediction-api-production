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
├── data/               # Raw and processed dataset (Salary_Data.csv)
├── notebooks/          # EDA and model training notebook
├── train_model.py      # Standalone training script (EDA, preprocessing, training, evaluation)
├── model/              # Saved salary_model.pkl, scaler.pkl, model_columns.pkl, model_info.pkl
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
 
## 🧪 Model Training (`train_model.py`)
 
The training script (`train_model.py`) covers the full pipeline from raw CSV to a deployable model:
 
1. **EDA** — distribution plots, scatter/box plots against salary, and a correlation heatmap.
2. **Cleaning** — drops exact duplicate rows and rows with missing values (see the data note above), and standardizes inconsistent `Education Level` labels (e.g. `"Bachelor's Degree"` → `"Bachelor's"`, `"phD"` → `"PhD"`).
3. **Job title grouping** — of the ~190 distinct job titles, only the top 20 most frequent are kept as their own category; everything else is grouped into `"Other"` so the model has enough examples per category.
4. **Encoding** — `Gender`, `Education Level`, and `Job Title` are one-hot encoded (`drop_first=True`).
5. **Split & scale** — 80/20 train/test split (`random_state=42`); features are standardized with `StandardScaler` for Linear Regression. The Random Forest is trained on unscaled data since tree-based models don't need scaling.
6. **Train & evaluate** — both Linear Regression and Random Forest Regressor are trained and compared by R²; the better model is saved as `salary_model.pkl`.
7. **Artifacts saved** — `salary_model.pkl` (the winning model), `scaler.pkl`, `model_columns.pkl` (exact column order after encoding), and `model_info.pkl` (which model won, whether it needs scaled input, and the top job titles used for grouping).
**Important for the API:** the `/predict` endpoint must replicate this exact preprocessing at inference time — same one-hot encoding scheme, same column order (from `model_columns.pkl`), same `"Other"` bucketing for job titles not in `model_info.pkl["top_job_titles"]`, and scaling applied only if `model_info.pkl["uses_scaled_input"]` is `True`. Any drift between training-time and inference-time preprocessing will silently produce bad predictions.
 
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
| Linear Regression | 18,016.90 | 581,009,548.93 | 24,104.14 | 0.7879 |
| Random Forest Regressor | 11,011.38 | 292,656,575.78 | 17,107.21 | **0.8932** |
 
Random Forest Regressor is the better performer and is the model saved as `salary_model.pkl` for use by the API.
 
**Note:** This project uses a synthetically generated dataset intended for educational purposes. Predictions should not be interpreted as real-world compensation benchmarks.
 
**Data note:** The raw dataset (`Salary_Data.csv`, 6,704 rows) contains a large number of exact duplicate rows — after de-duplication and dropping a handful of rows with missing values, training uses **1,787 rows**. This is worth keeping in mind when interpreting model performance and when the dataset is updated in the future.
 
---
 
## 🗺️ Roadmap
 
- [x] EDA and preprocessing
- [x] Model training and evaluation
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

