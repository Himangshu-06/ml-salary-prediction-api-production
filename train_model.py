import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns

# =====================================================
# STEP 1: Load the dataset
# =====================================================
df = pd.read_csv("Salary_Data.csv")

print(df.head())
print(df.shape)
print(df.info())

# =====================================================
# STEP 2: Exploratory Data Analysis (EDA)
# =====================================================

print(df.describe())
print(df.isnull().sum())
print("duplicate rows:", df.duplicated().sum())

# salary distribution
plt.figure(figsize=(7,5))
sns.histplot(df["Salary"].dropna(), bins=30, kde=True)
plt.title("Salary Distribution")
plt.show()

# years of experience vs salary
plt.figure(figsize=(7,5))
sns.scatterplot(x="Years of Experience", y="Salary", data=df, alpha=0.3)
plt.title("Years of Experience vs Salary")
plt.show()

# education level vs salary
plt.figure(figsize=(8,5))
sns.boxplot(x="Education Level", y="Salary", data=df)
plt.title("Education Level vs Salary")
plt.xticks(rotation=30)
plt.tight_layout()
plt.show()

# correlation heatmap (numeric columns only)
plt.figure(figsize=(6,5))
sns.heatmap(df.corr(numeric_only=True), annot=True, cmap="coolwarm")
plt.title("Correlation Heatmap")
plt.show()

# =====================================================
# STEP 3: Data cleaning and preprocessing
# =====================================================

# --- 3a: remove duplicate rows ---
# this dataset has a LOT of exact duplicate rows, which would make the
# model think certain patterns are more common than they really are
print("shape before dropping duplicates:", df.shape)
df = df.drop_duplicates()
print("shape after dropping duplicates:", df.shape)

# --- 3b: drop rows with missing values ---
# only a handful of rows have missing data, so its safe to just drop them
print(df.isnull().sum())
df = df.dropna()
print("shape after dropping missing values:", df.shape)

# --- 3c: clean up inconsistent text in Education Level ---
# the dataset has "Bachelor's" and "Bachelor's Degree" as if they were
# different things, and "PhD" vs "phD" with different capitalization
# so we standardize these into one consistent set of labels
print("before cleaning:", df["Education Level"].unique())

education_mapping = {
    "Bachelor's Degree": "Bachelor's",
    "Master's Degree": "Master's",
    "phD": "PhD"
}
df["Education Level"] = df["Education Level"].replace(education_mapping)

print("after cleaning:", df["Education Level"].unique())

# --- 3d: group rare job titles into "Other" ---
# there are 193 different job titles, and many of them appear only once
# or twice. Keeping all of them would create too many columns and the
# model would not have enough examples to learn from the rare ones.
# so we keep the top 20 most common job titles, and group the rest as "Other"
top_job_titles = df["Job Title"].value_counts().nlargest(20).index
df["Job Title"] = df["Job Title"].apply(lambda x: x if x in top_job_titles else "Other")

print(df["Job Title"].value_counts())

# =====================================================
# STEP 4: Encode categorical features
# =====================================================

# Gender, Education Level, and Job Title are all text columns
# we use one-hot encoding to convert them into 0/1 numeric columns
categorical_cols = ["Gender", "Education Level", "Job Title"]

df_encoded = pd.get_dummies(df, columns=categorical_cols, drop_first=True)

print(df_encoded.shape)

# =====================================================
# STEP 5: Split features and target, then scale
# =====================================================

X = df_encoded.drop(columns=["Salary"])
y = df_encoded["Salary"]

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# =====================================================
# STEP 6: Train regression models
# =====================================================
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

lr = LinearRegression()
lr.fit(X_train_scaled, y_train)
y_pred_lr = lr.predict(X_test_scaled)

rf = RandomForestRegressor(n_estimators=100, random_state=42)
rf.fit(X_train, y_train)   # tree models dont need scaled data
y_pred_rf = rf.predict(X_test)

# =====================================================
# STEP 7: Evaluate the models
# =====================================================

def evaluate(name, y_true, y_pred):
    mae = mean_absolute_error(y_true, y_pred)
    mse = mean_squared_error(y_true, y_pred)
    rmse = np.sqrt(mse)
    r2 = r2_score(y_true, y_pred)
    print(f"\n{name}")
    print(f"MAE  : {mae:,.2f}")
    print(f"MSE  : {mse:,.2f}")
    print(f"RMSE : {rmse:,.2f}")
    print(f"R2   : {r2:.4f}")
    return r2

lr_r2 = evaluate("Linear Regression", y_test, y_pred_lr)
rf_r2 = evaluate("Random Forest Regressor", y_test, y_pred_rf)

# =====================================================
# STEP 8: Save the best model for use in the API
# =====================================================
import joblib

if rf_r2 >= lr_r2:
    best_model = rf
    best_model_name = "Random Forest Regressor"
    uses_scaled_input = False
else:
    best_model = lr
    best_model_name = "Linear Regression"
    uses_scaled_input = True

print(f"\nBest model: {best_model_name}")

joblib.dump(best_model, "salary_model.pkl")
joblib.dump(scaler, "scaler.pkl")
joblib.dump(X.columns.tolist(), "model_columns.pkl")
joblib.dump({
    "model_name": best_model_name,
    "uses_scaled_input": uses_scaled_input,
    "top_job_titles": top_job_titles.tolist(),
}, "model_info.pkl")

print("\nSaved files: salary_model.pkl, scaler.pkl, model_columns.pkl, model_info.pkl")
print("\nDone!")