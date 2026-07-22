import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import joblib
import pandas as pd
from datetime import datetime
from supabase import create_client, Client

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

# this allows the frontend (running on a different port/domain) to call this API
# without the browser blocking the request
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# =====================================================
# Set up Supabase connection
# =====================================================
# SUPABASE_URL and SUPABASE_KEY should be set as environment variables
# (never hardcode these directly in the file)

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("SUPABASE_URL and SUPABASE_KEY environment variables must be set")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# NOTE: unlike SQLite, Supabase does not auto-create tables from code.
# Create this table once in the Supabase SQL editor before running the app:
#
# create table predictions (
#     id bigint generated always as identity primary key,
#     timestamp text,
#     age float8,
#     gender text,
#     education_level text,
#     job_title text,
#     years_experience float8,
#     predicted_salary float8
# );

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

        # log this request into Supabase instead of SQLite
        row = {
            "timestamp": datetime.now().isoformat(),
            "age": data.age,
            "gender": data.gender,
            "education_level": data.education_level,
            "job_title": data.job_title,
            "years_experience": data.years_experience,
            "predicted_salary": prediction,
        }
        supabase.table("predictions").insert(row).execute()

        return {"predicted_salary": prediction}

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@app.get("/stats")
def get_stats():
    # get all predicted_salary values to compute count + average
    # (Supabase doesn't have a simple built-in AVG() call over the client,
    # so we pull the column and compute it ourselves)
    result = supabase.table("predictions").select("predicted_salary").execute()
    rows = result.data

    total_predictions = len(rows)
    if total_predictions > 0:
        avg_salary = sum(r["predicted_salary"] for r in rows) / total_predictions
    else:
        avg_salary = 0

    return {
        "total_predictions": total_predictions,
        "average_predicted_salary": round(avg_salary, 2) if avg_salary else 0
    }
