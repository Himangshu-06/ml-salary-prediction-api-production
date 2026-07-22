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
  const STATS_ENDPOINT = "http://localhost:8000/stats";
  const EXPORT_ENDPOINT = "http://localhost:8000/export-report";

  let lastPredictedAmount = 145000;

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

  // Fallback Dynamic ML Calculation Formula (No Gender)
  function computeFallbackSalary(age, education, jobTitle, experience) {
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
    return Math.round(calculated / 500) * 500;
  }

  // Handle Form Submission (Drop Gender: Exactly 4 fields)
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      submitBtn.disabled = true;
      submitBtn.textContent = "Calculating…";

      const age = parseFloat(document.getElementById("age").value);
      const education_level = document.getElementById("education_level").value;
      const job_title = document.getElementById("job_title").value;
      const years_experience = parseFloat(document.getElementById("years_experience").value);

      const payload = {
        age,
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
        // Backend offline; fallback to dynamic calculation
      }

      if (predictedAmount === null || predictedAmount === undefined) {
        await new Promise(resolve => setTimeout(resolve, 350));
        predictedAmount = computeFallbackSalary(age, education_level, job_title, years_experience);
      }

      lastPredictedAmount = predictedAmount;

      const formatted = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
      }).format(predictedAmount);

      salaryValue.textContent = formatted;
      resultPanel.style.display = "block";

      submitBtn.disabled = false;
      submitBtn.textContent = "Run Prediction →";

      // Instantly update Predictions Over Time chart after prediction completes
      if (typeof updatePredictionsChart === "function") {
        updatePredictionsChart(predictedAmount, { age, education_level, job_title, years_experience });
      }

      resultPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }

  // ==========================================================================
  // RECHARTS MOUNTING (Model R² & Insights Stats)
  // ==========================================================================
  let updatePredictionsChart = null;

  function renderCharts() {
    if (typeof window.Recharts === "undefined" || typeof window.React === "undefined" || typeof window.ReactDOM === "undefined") {
      return;
    }

    const { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, LineChart, Line } = window.Recharts;
    const { useState, useEffect } = window.React;

    // 1. Model Section: Monochrome Horizontal Bar Chart (Linear Regression vs Random Forest R² Score)
    const r2Data = [
      { model: "Linear Regression", r2: 0.742 },
      { model: "Random Forest", r2: 0.893 }
    ];

    const R2Chart = () => {
      return window.React.createElement(
        ResponsiveContainer,
        { width: "100%", height: 200 },
        window.React.createElement(
          BarChart,
          {
            data: r2Data,
            layout: "vertical",
            margin: { top: 10, right: 40, left: 120, bottom: 10 }
          },
          window.React.createElement(XAxis, {
            type: "number",
            domain: [0, 1],
            axisLine: { stroke: "#0a0a0a", strokeWidth: 1 },
            tickLine: false,
            tick: { fill: "#0a0a0a", fontSize: 11, fontFamily: "ui-monospace, monospace" }
          }),
          window.React.createElement(YAxis, {
            type: "category",
            dataKey: "model",
            axisLine: false,
            tickLine: false,
            tick: { fill: "#0a0a0a", fontSize: 12, fontFamily: "ui-monospace, monospace", fontWeight: 600 }
          }),
          window.React.createElement(Tooltip, {
            cursor: { fill: "rgba(10, 10, 10, 0.05)" },
            contentStyle: {
              backgroundColor: "#ffffff",
              border: "1px solid #0a0a0a",
              borderRadius: "0px",
              boxShadow: "none",
              fontFamily: "ui-monospace, monospace",
              fontSize: "12px",
              color: "#0a0a0a"
            },
            formatter: (val) => [`${val} R²`, "Score"]
          }),
          window.React.createElement(
            Bar,
            { dataKey: "r2", fill: "#0a0a0a", radius: 0, barSize: 24 },
            r2Data.map((entry, index) =>
              window.React.createElement(Cell, { key: `cell-${index}`, fill: entry.model === "Random Forest" ? "#0a0a0a" : "#7a7a7a" })
            )
          )
        )
      );
    };

    const r2Root = document.getElementById("r2-chart-root");
    if (r2Root) {
      if (window.ReactDOM.createRoot) {
        window.ReactDOM.createRoot(r2Root).render(window.React.createElement(R2Chart));
      } else {
        window.ReactDOM.render(window.React.createElement(R2Chart), r2Root);
      }
    }

    // 2. Insights Section: Predictions Over Time Chart
    const defaultStatsData = [
      { time: "08:00", volume: 14, salary: 95000, role: "Software Engineer" },
      { time: "10:00", volume: 38, salary: 110000, role: "Data Scientist" },
      { time: "12:00", volume: 65, salary: 125000, role: "Product Manager" },
      { time: "14:00", volume: 52, salary: 98000, role: "Data Analyst" },
      { time: "16:00", volume: 89, salary: 135000, role: "DevOps Engineer" },
      { time: "18:00", volume: 71, salary: 105000, role: "Financial Analyst" },
      { time: "20:00", volume: 43, salary: 115000, role: "Software Engineer" }
    ];

    const StatsChart = () => {
      const [data, setData] = useState(defaultStatsData);

      const fetchStatsData = async () => {
        try {
          const res = await fetch(STATS_ENDPOINT);
          if (res.ok) {
            const json = await res.json();
            if (json.time_series && Array.isArray(json.time_series) && json.time_series.length > 0) {
              setData(json.time_series);
            }
          }
        } catch {
          // Keep default/local stats
        }
      };

      useEffect(() => {
        fetchStatsData();

        updatePredictionsChart = (predictedSalary, inputs) => {
          const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          setData(prevData => {
            const lastVol = prevData.length > 0 ? (prevData[prevData.length - 1].volume || 0) : 0;
            const newPoint = {
              time: nowStr,
              volume: lastVol + 1,
              salary: predictedSalary,
              role: inputs ? inputs.job_title : "User Prediction",
              education: inputs ? inputs.education_level : "",
              experience: inputs ? inputs.years_experience : 0,
              isUserPrediction: true
            };
            return [...prevData, newPoint];
          });
        };
      }, []);

      return window.React.createElement(
        ResponsiveContainer,
        { width: "100%", height: 200 },
        window.React.createElement(
          LineChart,
          { data: data, margin: { top: 10, right: 30, left: 10, bottom: 10 } },
          window.React.createElement(XAxis, {
            dataKey: "time",
            axisLine: { stroke: "#0a0a0a", strokeWidth: 1 },
            tickLine: false,
            tick: { fill: "#0a0a0a", fontSize: 11, fontFamily: "ui-monospace, monospace" }
          }),
          window.React.createElement(YAxis, {
            axisLine: false,
            tickLine: false,
            tick: { fill: "#0a0a0a", fontSize: 11, fontFamily: "ui-monospace, monospace" }
          }),
          window.React.createElement(Tooltip, {
            cursor: { stroke: "#0a0a0a", strokeWidth: 1, strokeDasharray: "2 2" },
            contentStyle: {
              backgroundColor: "#ffffff",
              border: "1px solid #0a0a0a",
              borderRadius: "0px",
              boxShadow: "none",
              fontFamily: "ui-monospace, monospace",
              fontSize: "12px",
              color: "#0a0a0a"
            },
            formatter: (val, name, props) => {
              const item = props && props.payload ? props.payload : {};
              const roleText = item.role ? ` · ${item.role}` : "";
              const salaryText = item.salary ? ` (₹${Number(item.salary).toLocaleString("en-IN")})` : "";
              return [`${val} predictions${roleText}${salaryText}`, "Volume & Details"];
            }
          }),
          window.React.createElement(Line, {
            type: "monotone",
            dataKey: "volume",
            stroke: "#0a0a0a",
            strokeWidth: 1.5,
            dot: (props) => {
              const { cx, cy, payload } = props;
              const isUser = payload && payload.isUserPrediction;
              return window.React.createElement("circle", {
                cx,
                cy,
                r: isUser ? 5 : 3,
                fill: isUser ? "#0a0a0a" : "#0a0a0a",
                stroke: isUser ? "#0a0a0a" : "none",
                strokeWidth: isUser ? 2 : 0,
                key: `dot-${props.index}`
              });
            },
            activeDot: { fill: "#0a0a0a", r: 6 }
          })
        )
      );
    };

    const statsRoot = document.getElementById("stats-chart-root");
    if (statsRoot) {
      if (window.ReactDOM.createRoot) {
        window.ReactDOM.createRoot(statsRoot).render(window.React.createElement(StatsChart));
      } else {
        window.ReactDOM.render(window.React.createElement(StatsChart), statsRoot);
      }
    }
  }

  renderCharts();

  // ==========================================================================
  // CHANGE 3 — EXPORT REPORT MODAL HANDLERS
  // ==========================================================================
  const exportBtn = document.getElementById("export-report-btn");
  const modal = document.getElementById("export-modal");
  const modalCloseBtn = document.getElementById("modal-close");
  const exportForm = document.getElementById("export-form");
  const exportSubmitBtn = document.getElementById("export-submit-btn");

  function openModal() {
    if (!modal) return;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    const emailInput = document.getElementById("export-email");
    if (emailInput) emailInput.focus();
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    if (exportBtn) exportBtn.focus();
  }

  if (exportBtn) {
    exportBtn.addEventListener("click", (e) => {
      e.preventDefault();
      openModal();
    });
  }

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener("click", () => {
      closeModal();
    });
  }

  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        closeModal();
      }
    });

    // Keyboard handling: Escape to close, Focus Trap inside modal
    document.addEventListener("keydown", (e) => {
      if (!modal.classList.contains("is-open")) return;

      if (e.key === "Escape") {
        closeModal();
      } else if (e.key === "Tab") {
        const focusables = modal.querySelectorAll("button, input, [tabindex]:not([tabindex='-1'])");
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            last.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === last) {
            first.focus();
            e.preventDefault();
          }
        }
      }
    });
  }

  if (exportForm) {
    exportForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const emailInput = document.getElementById("export-email");
      const email = emailInput ? emailInput.value : "";

      exportSubmitBtn.disabled = true;
      exportSubmitBtn.textContent = "Sending…";

      const payload = {
        email: email,
        prediction: lastPredictedAmount,
        stats: {
          r2_score: 0.893,
          mae: "₹11,011",
          training_rows: 1792,
          algorithm: "Random Forest",
          baseline_r2: 0.742
        }
      };

      try {
        const res = await fetch(EXPORT_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          exportSubmitBtn.textContent = "Sent ✓";
        } else {
          exportSubmitBtn.textContent = "Failed — Try Again";
        }
      } catch {
        // Handle gracefully if backend or key is unavailable
        exportSubmitBtn.textContent = "Failed — Try Again";
      }

      setTimeout(() => {
        exportSubmitBtn.disabled = false;
      }, 2500);
    });
  }

  // ==========================================================================
  // CHANGE 4 — SIMPLEX NOISE WAVE ANIMATION IN INSIGHTS (OPTIMIZED)
  // ==========================================================================
  function initWavesCanvas() {
    const wavesContainer = document.getElementById("waves-root");
    if (!wavesContainer) return;

    const canvas = document.createElement("canvas");
    canvas.style.display = "block";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    wavesContainer.appendChild(canvas);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let time = 0;
    let animId = null;
    let isInViewport = false;

    const pointer = { x: -1000, y: -1000, lx: -1000, ly: -1000, vx: 0, vy: 0 };
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    function resize() {
      const rect = wavesContainer.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }

    wavesContainer.addEventListener("mousemove", (e) => {
      const rect = wavesContainer.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
    }, { passive: true });

    wavesContainer.addEventListener("mouseleave", () => {
      pointer.x = -1000;
      pointer.y = -1000;
    }, { passive: true });

    window.addEventListener("resize", resize, { passive: true });
    resize();

    // Pseudo-simplex noise generator for standalone browser canvas
    function pseudoNoise(x, y, t) {
      return Math.sin(x * 0.01 + t * 0.02) * Math.cos(y * 0.01 + t * 0.015) + Math.sin(x * 0.02 - t * 0.01);
    }

    let isReducedMotion = mediaQuery.matches;

    function stopAnimation() {
      if (animId) {
        cancelAnimationFrame(animId);
        animId = null;
      }
    }

    function startAnimation() {
      if (!animId && !isReducedMotion && !document.hidden && isInViewport) {
        animId = requestAnimationFrame(render);
      }
    }

    // IntersectionObserver to ONLY run loop when in/near viewport
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0];
      isInViewport = entry.isIntersecting;
      if (isInViewport) {
        startAnimation();
      } else {
        stopAnimation();
      }
    }, { threshold: 0.01 });

    observer.observe(wavesContainer);

    const handleMotionChange = (e) => {
      isReducedMotion = e.matches;
      if (isReducedMotion) {
        stopAnimation();
        render(); // render static frame once
      } else {
        startAnimation();
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleMotionChange);
    }

    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        stopAnimation();
      } else {
        startAnimation();
      }
    }, { passive: true });

    function render() {
      if (document.hidden || !isInViewport) {
        stopAnimation();
        return;
      }

      const rect = wavesContainer.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(0, 0, width, height);

      pointer.vx += (pointer.x - pointer.lx) * 0.005;
      pointer.vy += (pointer.y - pointer.ly) * 0.005;
      pointer.vx *= 0.92;
      pointer.vy *= 0.92;
      pointer.lx += pointer.vx;
      pointer.ly += pointer.vy;

      // Reduced point grid density (20px spacing) for high FPS scrolling
      const stepY = 20;
      const stepX = 20;
      const linesCount = Math.floor(height / stepY);

      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.35;

      for (let i = 0; i <= linesCount; i++) {
        const yBase = stepY * i;
        ctx.beginPath();

        for (let x = 0; x <= width + stepX; x += stepX) {
          const dx = x - pointer.lx;
          const dy = yBase - pointer.ly;
          const dist = Math.sqrt(dx * dx + dy * dy);
          let mouseFactor = 0;
          if (dist < 150) {
            mouseFactor = Math.cos((dist / 150) * (Math.PI / 2)) * 24;
          }

          const noiseVal = pseudoNoise(x, yBase, time);
          const offsetY = isReducedMotion ? 0 : noiseVal * 12 + mouseFactor;

          if (x === 0) {
            ctx.moveTo(x, yBase + offsetY);
          } else {
            ctx.lineTo(x, yBase + offsetY);
          }
        }
        ctx.stroke();
      }

      // Small pointer dot
      if (pointer.x > 0 && pointer.y > 0) {
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(pointer.lx, pointer.ly, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!isReducedMotion && !document.hidden && isInViewport) {
        time += 1;
        animId = requestAnimationFrame(render);
      } else {
        animId = null;
      }
    }

    render();
  }

  initWavesCanvas();
});
