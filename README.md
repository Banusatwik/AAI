# Mechanical Safety & Operations Decision System
### Industrial Mechanical Engineering Safety Intelligence & Multi-Agent Deterministic Decision Engine

[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React_19_TypeScript-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL_16-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Pytest](https://img.shields.io/badge/Tests-100%25_Passing-brightgreen?logo=pytest&logoColor=white)](https://pytest.org/)

---

## 1. Problem Statement

Industrial mechanical equipment—such as **centrifugal pumps, reciprocating gas compressors, high-speed cogeneration turbines, motors, and pressure containment systems**—operate within strict physical and thermodynamic safety envelopes. In modern plant operations, operators frequently need to evaluate whether a proposed operational change (e.g. ramping RPM, throttling flow, adjusting pressure) or an observed telemetry anomaly is safe.

Traditional approaches suffer from two failure modes:
1. **Unchecked Generative AI Hallucination:** Using an LLM directly to determine safety limits poses catastrophic risks because LLMs can hallucinate numerical thresholds, ignore strict engineering codes, or override hard boundaries.
2. **Inflexible Hardcoded Logic:** Hardcoding safety limits in source code (`MAX_RPM = 2800`) creates brittle systems that fail to track multi-version policy updates, API 610 revisions, or equipment-specific governance standards.

### The Solution: Agentic AI with Deterministic Policy Enforcement
This system combines **Multi-Agent Natural Language Understanding & Audit Reporting** with a **Deterministic Calculation Core** that reads safety policies dynamically from the database. It guarantees that:
* **No hardcoded safety limits** exist in the codebase.
* **LLMs never invent safety limits** or override hard policy boundaries.
* If a mandatory policy limit is violated, the operation is **strictly DENIED** regardless of risk score or optimization recommendations.
* If an operating parameter lacks an approved policy, the system explicitly returns **POLICY GAP** and records the gap in the governance registry instead of guessing.

---

## 2. System Architecture & Workflow

```
                       Operation Request
                   (Natural Language or Form)
                               ↓
                 ┌─────────────────────────────┐
                 │ Agent 1: NLP Understanding  │
                 └──────────────┬──────────────┘
                                ↓
                 ┌─────────────────────────────┐
                 │  Agent 2: Policy Retrieval  │
                 └──────────────┬──────────────┘
                                ↓
                 ┌─────────────────────────────┐
                 │ PostgreSQL Policy Database  │
                 └──────────────┬──────────────┘
                                │
                   ┌────────────┴────────────┐
                   ↓                         ↓
           [Policy Found]             [No Policy Found]
                   ↓                         ↓
       ┌───────────────────────┐      ┌──────────────┐
       │  Threshold Analysis   │      │  POLICY GAP  │
       └───────────┬───────────┘      └──────────────┘
                   │
        ┌──────────┴──────────┐
        ↓                     ↓
 [Hard Violation]      [Within Bounds]
        ↓                     ↓
   ┌──────────┐        ┌───────────────────────┐
   │  DENIED  │        │ Statistical Baseline  │
   └──────────┘        └───────────┬───────────┘
                                   ↓
                       ┌───────────────────────┐
                       │ Probability Modeling  │
                       └───────────┬───────────┘
                                   ↓
                       ┌───────────────────────┐
                       │   Rule-Based Score    │
                       └───────────┬───────────┘
                                   ↓
                       ┌───────────────────────┐
                       │  Parameter Optimizer  │
                       └───────────┬───────────┘
                                   ↓
                       ┌───────────────────────┐
                       │ Final Decision Engine │
                       └───────────┬───────────┘
                                   ↓
                       ┌───────────────────────┐
                       │  Agent 4: Explainer   │
                       └───────────┬───────────┘
                                   ↓
                       ┌───────────────────────┐
                       │ Immutable Audit Log   │
                       └───────────────────────┘
```

---

## 3. Agentic AI Architecture

| Logical Agent | Responsibility | Implementation & Fallback |
| :--- | :--- | :--- |
| **Agent 1 — Operation Understanding Agent** | Parses natural language or structured requests into structured mechanical parameters (`rpm`, `vibration`, `bearing_temperature`, `pressure`, etc.). | Calls OpenAI LLM if `OPENAI_API_KEY` is provided; seamlessly falls back to high-precision deterministic regex & semantic parser. |
| **Agent 2 — Policy Retrieval Agent** | Queries database for the active policy version matching the equipment type/code; extracts all clauses, numerical thresholds, rules, and owners. | Reads directly from PostgreSQL `policies`, `policy_versions`, `policy_clauses`, and `policy_thresholds` tables. Zero hardcoding. |
| **Deterministic Safety Engine** | Executes threshold checks, statistical $Z$-scores, historical failure probability estimation, and DB-rule scoring. | Pure Python, NumPy, and SciPy deterministic algorithms. |
| **Optimization Studio** | Searches parameter space to recommend safer operating points that minimize risk and maximize mechanical efficiency while respecting hard bounds. | Constrained non-linear optimization & affinity-law scaling. |
| **Agent 4 — Explanation & Audit Agent** | Generates an authoritative, audit-ready engineering summary citing exact clauses, effective dates, and delta recommendations. | LLM generation with comprehensive deterministic engineering template fallback. |

---

## 4. Analytical Sub-Engines

### A. Threshold Analysis
Compares operating values against dynamic policy thresholds:
* **Normal Operating Range:** $0 \le x \le \text{Normal Max}$
* **Warning Zone:** $x \ge \text{Warning Threshold}$
* **Critical Zone:** $x \ge \text{Critical Threshold}$
* **Hard Policy Limit:** $x > \text{Policy Max}$ $\rightarrow$ **MANDATORY VIOLATION**
* **Safety Margin:** $\Delta_{\text{margin}} = \text{Policy Max} - x_{\text{requested}}$

### B. Statistical Baseline Analysis
Computes parametric metrics from historical time-series data:
* **Mean ($\mu$)**, **Median ($P_{50}$)**, **Standard Deviation ($\sigma$)**, **Variance ($\sigma^2$)**
* **Percentiles:** $P_{90}$, $P_{95}$, $P_{99}$
* **Moving Average:** 5-period smoothed telemetry baseline
* **$Z$-Score Anomaly Detection:**
  $$Z = \frac{x - \mu}{\sigma}$$
  If $|Z| \ge 2.0\sigma$, the value is classified as a **Statistical Anomaly** contributing $+15$ risk penalty points.

### C. Empirical Failure Probability Modeling
Calculates empirical conditional failure probabilities based on recorded machine operations:
$$P(\text{Failure} \mid \text{Operating Band}) = \frac{\text{Historical Failures in Band}}{\text{Total Operations in Band}}$$
* **Sample Size Requirement:** If sample count $N < 10$, the system explicitly returns **`INSUFFICIENT DATA`** instead of fabricating probabilities.
* **Labeling:** Explicitly presented as **Historical/Estimated Probability**, never as absolute certainty.

### D. Deterministic Rule-Based Scoring
Risk scoring rules are stored in the database (`risk_scoring_rules` table), not hardcoded in application logic:
* Vibration warning exceeded: $+20$ pts
* Vibration critical reached: $+40$ pts
* Bearing temperature warning: $+20$ pts
* Bearing temperature critical: $+35$ pts
* Discharge pressure warning: $+25$ pts
* Failure probability $\ge 8.0\%$: $+20$ pts
* Failure probability $\ge 18.0\%$: $+30$ pts
* Statistical anomaly ($Z > 2.0\sigma$): $+15$ pts

**Risk Tiers (Configurable):**
* `0 – 25`: **LOW RISK**
* `26 – 50`: **MODERATE RISK**
* `51 – 75`: **HIGH RISK**
* `76 – 100`: **CRITICAL RISK**

### E. Parameter Optimization Studio
Given an operation point, the optimizer searches for an operating point $(RPM^*, Flow^*)$ that:
1. Strictly respects all policy hard limits: $RPM \le RPM_{\max}$, $Vibration(RPM) \le Vib_{\max}$.
2. Minimizes the deterministic risk score.
3. Maximizes mechanical/hydraulic efficiency based on pump affinity laws.
4. Returns `"NO SAFE OPERATING POINT FOUND"` if constraints are contradictory or infeasible.

---

## 5. Strict 3-Level Decision Hierarchy

```
Level 1: Hard Policy Violation ──────────────► DENIED (Overrides all scores & optimization)
Level 3: Missing Policy Parameter ──────────► POLICY GAP (Logged to DB; never assumes limits)
Level 2: Policy Exists & Bounds Respected ──► APPROVED / DENIED (Based on evaluated risk score)
```

> **Critical Safety Rule:** If an operation violates a mandatory policy limit (e.g. Requested 3000 RPM when Policy Max is 2850 RPM), the decision is **ALWAYS DENIED**, even if risk score is low.

---

## 6. Pre-Seeded Industrial Mechanical Dataset

The system includes realistic synthetic mechanical telemetry spanning 60 days across 5 industrial assets:
* **`P-101`**: Centrifugal Pump (Sulzer OH2-150-330 — Hydrocracker Feed)
* **`P-102`**: Centrifugal Pump (Flowserve Mark 3 ANSI — Distillation Booster)
* **`C-201`**: Reciprocating Compressor (Dresser-Rand HOS-4 — Hydrogen Gas)
* **`C-202`**: Reciprocating Compressor (Ariel JGK/4 — Syngas Train)
* **`T-301`**: Industrial Gas Turbine (Solar Taurus 60 — Cogeneration)

**Pre-Seeded Policies:**
* `MECH-PUMP-001 v1.0` (Historical: Max Vibration 5.0 mm/s, Max RPM 3000)
* `MECH-PUMP-001 v2.0` (Active: Max Vibration 4.5 mm/s, Max RPM 2850, Clause 4.2.1, 4.2.2, 4.2.3, 4.2.4)
* `MECH-COMP-002 v1.0` (Active: Discharge Pressure 45 bar, Lube Oil Pressure 2.0 bar, Clause 3.1.1, 3.1.2)
* `MECH-TURB-003 v1.0` (Active: Max Speed 6200 RPM, EGT Max 580°C, Clause 5.1.1, 5.1.2)

---

## 7. REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/evaluate` | Run full agentic & deterministic evaluation pipeline |
| `GET` | `/api/evaluate/history` | List evaluation history with decision badges and risk scores |
| `GET` | `/api/evaluate/{id}` | Detailed inspection of evaluation audit snapshot |
| `GET` | `/api/equipment` | Roster of equipment with active policy info & latest telemetry |
| `GET` | `/api/equipment/{id}` | Equipment detail with specs and measurement count |
| `POST` | `/api/equipment` | Register new equipment asset |
| `GET` | `/api/policies` | List policies with active version numbers |
| `GET` | `/api/policies/{id}` | Detailed policy with all versions, clauses, and thresholds |
| `POST` | `/api/policies` | Create new safety policy standard |
| `POST` | `/api/policies/{id}/versions` | Create a new policy version |
| `PUT` | `/api/policies/{id}/versions/{version_id}/activate` | Switch active policy version |
| `PUT` | `/api/policies/thresholds/{threshold_id}` | Edit threshold directly in DB without code change |
| `GET` | `/api/gaps` | List all policy gaps with occurrence counts |
| `PUT` | `/api/gaps/{id}` | Update gap status (OPEN, UNDER_REVIEW, RESOLVED) & notes |
| `GET` | `/api/statistics/{equipment_code}/{param}` | Statistical baseline metrics and time series |
| `GET` | `/api/probability/{equipment_code}/{param}` | Empirical failure probability across operating bins |
| `POST` | `/api/optimization` | Run parameter optimization solver |
| `GET` | `/api/dashboard` | Aggregated KPIs, risk distribution, and equipment health |
| `GET` | `/api/audit-logs` | Immutable system audit log |
| `GET` | `/api/rules` | List database-configured risk scoring rules |

---

## 8. Quickstart & Installation

### Option 1: Docker Compose (Recommended)

Run the complete multi-container stack (PostgreSQL + FastAPI Backend + React/Nginx Frontend):

```bash
docker compose up --build
```

Access the applications:
* **Web UI (Dashboard):** [http://localhost:3000](http://localhost:3000)
* **Backend API & Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
* **PostgreSQL:** `localhost:5432` (`mechanical_safety_db`)

---

### Option 2: Local Development Setup

#### Backend (Python 3.11+ / 3.14)
```bash
# 1. Navigate to backend directory
cd backend

# 2. Install dependencies
pip install -r requirements.txt

# 3. (Optional) Configure environment variables
cp ../.env.example ../.env

# 4. Seed database and start FastAPI server
python -m backend.app.main
```
The backend will automatically create tables, seed the 5 assets, policies, and 650+ historical measurements on startup at `http://localhost:8000`.

#### Frontend (React + TypeScript + Vite)
```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev
```
Access the frontend at `http://localhost:5173`.

---

## 9. Automated Testing Suite

The system includes a comprehensive automated test suite in `backend/tests/` covering all prompt requirements:

```bash
python -m pytest backend/tests -v
```

### Verified Test Suites:
1. `test_threshold.py`: Value $<$ limit $\rightarrow$ PASS, Value $=$ limit $\rightarrow$ PASS, Value $>$ limit $\rightarrow$ FAIL, safety margins.
2. `test_policy_gap.py`: Missing parameter (e.g. `shaft_misalignment`) $\rightarrow$ returns `POLICY GAP`, increments occurrence count, never invents limits.
3. `test_provenance.py`: Decisions output exact Policy Code, Clause Number, Version, Effective Date, Owner, and Limit.
4. `test_policy_version.py`: Active version resolution and runtime version switching (v1.0 vs v2.0) without code change.
5. `test_probability.py`: Empirical failure probability calculations and `INSUFFICIENT DATA` handling.
6. `test_statistics.py`: Mean, median, std dev, variance, 95th percentile, and $Z$-score anomaly metrics.
7. `test_risk_scoring.py`: Deterministic scoring from DB rules and classification into LOW, MODERATE, HIGH, CRITICAL.
8. `test_optimization.py`: Constraint adherence, risk reduction, and infeasible bound handling (`NO SAFE OPERATING POINT FOUND`).
9. `test_safety_override.py`: Policy Violation $+$ Low Risk Score $=$ **MUST BE DENIED** (Level 1 Hard Boundary).
10. `test_api_endpoints.py`: End-to-end integration tests on FastAPI routes.

---

## 10. End-to-End Demo Scenarios

Open the **Evaluate Operation** page in the UI to run the pre-configured 1-click demo presets:

### Demo 1: APPROVED Operation
* **Input:** Pump P-101 | RPM: 2700 | Vibration: 2.8 mm/s | Pressure: 11.5 bar | Bearing Temp: 62.0°C | Flow: 115 m³/h
* **Outcome:** `APPROVED`
* **Risk Score:** 20/100 (`LOW RISK`)
* **Provenance:** MECH-PUMP-001 v2.0 (Clause 4.2.1, 4.2.2, 4.2.3, 4.2.4)
* **Thresholds:** Vibration PASS (Margin: $+1.7$ mm/s), Speed PASS (Margin: $+150$ RPM), Temp PASS.

### Demo 2: DENIED — Hard Policy Limit Exceeded
* **Input:** Pump P-101 | RPM: 2950 (Policy Max: 2850) | Vibration: 5.2 mm/s (Policy Max: 4.5) | Pressure: 16.0 bar (Policy Max: 15.0)
* **Outcome:** `DENIED`
* **Reason:** Hard safety boundary violation on Vibration ($5.2 > 4.5$ mm/s, Cl. 4.2.1), Shaft Speed ($2950 > 2850$ RPM, Cl. 4.2.2), and Discharge Pressure ($16.0 > 15.0$ bar, Cl. 4.2.4).
* **Hierarchy:** Hard safety policy strictly overrides risk score.

### Demo 3: POLICY GAP Scenario
* **Input:** Pump P-101 | Shaft Misalignment: 2.4 mm
* **Outcome:** `POLICY GAP`
* **Reason:** No approved safety boundary exists in the database for `shaft_misalignment`. No limit assumed.
* **Registry:** Policy gap logged to Governance Registry with occurrence counter incremented.

### Demo 4: Parameter Optimization
* **Input:** Pump P-101 | RPM: 2840 | Vibration: 4.1 mm/s | Bearing Temp: 76.0°C | Flow: 128.0 m³/h
* **Current Point:** Risk Score: 55/100 (`HIGH RISK`), Efficiency: 83.2%
* **Recommended Point:** RPM: 2680, Vibration: 2.8 mm/s, Bearing Temp: 66.0°C
* **Result:** Risk reduced by 35 points ($55 \rightarrow 20$), Efficiency improved to 88.5%, all policy boundaries respected.

---

## 11. Governance & Auditability

Every single evaluation, policy version activation, threshold adjustment, and gap update is logged in the immutable `audit_logs` table with:
* Actor / Operator identity
* Event Type (`EVALUATION`, `VERSION_ACTIVATED`, `THRESHOLD_UPDATED`, `GAP_UPDATED`)
* Action summary and timestamp
* Full JSON snapshot of parameters, decisions, and policy versions used
