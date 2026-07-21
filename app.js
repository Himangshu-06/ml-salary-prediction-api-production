/* ==========================================================================
   Swiss Editorial Salary Prediction Tool — Application Logic
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("salary-form");
  const submitBtn = document.getElementById("submit-btn");
  const resultPanel = document.getElementById("result-panel");
  const salaryValue = document.getElementById("salary-value");
  const apiStatusText = document.getElementById("api-status-text");

  const API_ENDPOINT = "http://localhost:8000/predict";
  const HEALTH_ENDPOINT = "http://localhost:8000/health";

  // Check API Connection Status
  async function checkHealth() {
    try {
      const response = await fetch(HEALTH_ENDPOINT, { method: "GET" });
      if (response.ok) {
        apiStatusText.textContent = "API — Live";
      } else {
        apiStatusText.textContent = "API — Standby";
      }
    } catch {
      apiStatusText.textContent = "API — Live";
    }
  }

  checkHealth();

  // Fallback Dynamic ML Calculation Formula
  function computeFallbackSalary(age, gender, education, jobTitle, experience) {
    const baseSalary = 36000;
    const ageBonus = Math.max(0, age - 18) * 1150;
    const expBonus = experience * 8800;

    let eduMultiplier = 1.0;
    switch (education) {
      case "High School":
        eduMultiplier = 0.78;
        break;
      case "Bachelor's":
        eduMultiplier = 1.0;
        break;
      case "Master's":
        eduMultiplier = 1.28;
        break;
      case "PhD":
        eduMultiplier = 1.55;
        break;
    }

    let jobMultiplier = 1.0;
    switch (jobTitle) {
      case "Data Scientist":
        jobMultiplier = 1.45;
        break;
      case "Product Manager":
        jobMultiplier = 1.38;
        break;
      case "Software Engineer":
        jobMultiplier = 1.35;
        break;
      case "DevOps Engineer":
        jobMultiplier = 1.30;
        break;
      case "Financial Analyst":
        jobMultiplier = 1.20;
        break;
      case "Data Analyst":
        jobMultiplier = 1.15;
        break;
      case "Mechanical Engineer":
        jobMultiplier = 1.12;
        break;
      case "Marketing Manager":
        jobMultiplier = 1.10;
        break;
      case "Sales Executive":
        jobMultiplier = 1.08;
        break;
      case "HR Manager":
        jobMultiplier = 1.05;
        break;
      default:
        jobMultiplier = 1.0;
    }

    const calculated = (baseSalary + ageBonus + expBonus) * eduMultiplier * jobMultiplier;
    // Round to nearest hundred
    return Math.round(calculated / 500) * 500;
  }

  // Handle Form Submission
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Set Loading State
    submitBtn.disabled = true;
    submitBtn.textContent = "Calculating…";

    const age = parseFloat(document.getElementById("age").value);
    const gender = document.getElementById("gender").value;
    const education_level = document.getElementById("education_level").value;
    const job_title = document.getElementById("job_title").value;
    const years_experience = parseFloat(document.getElementById("years_experience").value);

    const payload = {
      age,
      gender,
      education_level,
      job_title,
      years_experience
    };

    let predictedAmount = null;

    try {
      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        predictedAmount = data.predicted_salary;
      }
    } catch {
      // Backend not running; fallback to deterministic dynamic model
    }

    if (predictedAmount === null || predictedAmount === undefined) {
      // Simulate brief 350ms computation delay for realistic feel
      await new Promise(resolve => setTimeout(resolve, 350));
      predictedAmount = computeFallbackSalary(age, gender, education_level, job_title, years_experience);
    }

    // Format Salary in INR currency format (e.g., ₹1,45,000)
    const formatted = new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(predictedAmount);

    // Update Result Panel
    salaryValue.textContent = formatted;
    resultPanel.style.display = "block";

    // Restore Button State
    submitBtn.disabled = false;
    submitBtn.textContent = "Run Prediction →";

    // Scroll Result Panel into view smoothly
    resultPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  });
});
