from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import joblib
import pandas as pd
import sqlite3
from datetime import datetime

# =====================================================
# Load the saved model and related files
# (these were created earlier by train_model.py)
# =====================================================
model = joblib.load("salary_model.pkl")
scaler = joblib.load("scaler.pkl")
model_columns = joblib.load("model_columns.pkl")
model_info = joblib.load("model_info.pkl")

print("Loaded model:", model_info["model_name"])

# =====================================================
# Create the FastAPI app
# =====================================================
app = FastAPI(title="Employee Salary Prediction API")

# this allows the frontend (running on a different port/file) to call this API
# without the browser blocking the request
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================================================
# Set up the database (SQLite)
# =====================================================

def init_db():
    conn = sqlite3.connect("predictions.db")
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS predictions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT,
            age REAL,
            gender TEXT,
            education_level TEXT,
            job_title TEXT,
            years_experience REAL,
            predicted_salary REAL
        )
    """)
    conn.commit()
    conn.close()

init_db()

# =====================================================
# Define what a valid request looks like (Pydantic model)
# =====================================================
# this automatically checks incoming data - wrong types or
# missing fields get rejected before our code even runs

class EmployeeData(BaseModel):
    age: float = Field(..., gt=15, lt=100, description="Employee age")
    gender: str = Field(..., description="Male, Female, or Other")
    education_level: str = Field(..., description="High School, Bachelor's, Master's, or PhD")
    job_title: str = Field(..., description="Employee's job title")
    years_experience: float = Field(..., ge=0, le=60, description="Years of work experience")

# =====================================================
# Helper function: turn user input into the exact format
# the model expects (same columns, same order, one-hot encoded)
# =====================================================

def prepare_input(data: EmployeeData):
    input_dict = {col: 0 for col in model_columns}

    input_dict["Age"] = data.age
    input_dict["Years of Experience"] = data.years_experience

    gender_col = f"Gender_{data.gender}"
    if gender_col in input_dict:
        input_dict[gender_col] = 1

    edu_col = f"Education Level_{data.education_level}"
    if edu_col in input_dict:
        input_dict[edu_col] = 1

    # if the job title wasn't one of the top 20 seen during training,
    # treat it as "Other" - same rule we used while training the model
    job_title = data.job_title
    if job_title not in model_info["top_job_titles"]:
        job_title = "Other"
    job_col = f"Job Title_{job_title}"
    if job_col in input_dict:
        input_dict[job_col] = 1

    input_df = pd.DataFrame([input_dict])[model_columns]
    return input_df

# =====================================================
# Routes (endpoints)
# =====================================================

@app.get("/health")
def health_check():
    return {"status": "ok", "model": model_info["model_name"]}


@app.post("/predict")
def predict_salary(data: EmployeeData):
    try:
        input_df = prepare_input(data)

        if model_info["uses_scaled_input"]:
            input_final = scaler.transform(input_df)
        else:
            input_final = input_df

        prediction = model.predict(input_final)[0]
        prediction = round(float(prediction), 2)

        # log this request into the database
        conn = sqlite3.connect("predictions.db")
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO predictions
            (timestamp, age, gender, education_level, job_title, years_experience, predicted_salary)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            datetime.now().isoformat(),
            data.age, data.gender, data.education_level,
            data.job_title, data.years_experience, prediction
        ))
        conn.commit()
        conn.close()

        return {"predicted_salary": prediction}

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/stats")
def get_stats():
    conn = sqlite3.connect("predictions.db")
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM predictions")
    total_predictions = cursor.fetchone()[0]

    cursor.execute("SELECT AVG(predicted_salary) FROM predictions")
    avg_salary = cursor.fetchone()[0]

    conn.close()

    return {
        "total_predictions": total_predictions,
        "average_predicted_salary": round(avg_salary, 2) if avg_salary else 0
    }