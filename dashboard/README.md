# Birhan Energies | Brent Crude Oil Change Point Analysis Dashboard

This interactive dashboard visualizes the results of our change point analysis and statistical modeling of Brent oil prices. It allows stakeholders to explore how geopolitical events, OPEC decisions, and economic shocks impact historical Brent crude prices (1987-2022).

---

## 1. Project Architecture

The dashboard is structured as a decoupled web application:
- **Backend (Flask)**: Serves clean JSON API endpoints, loading historical prices, log returns, and MCMC change point parameters directly from the analysis outputs.
- **Frontend (React + Vite)**: Renders a premium, high-fidelity dark-mode interface featuring dynamic charts, interactive filters, event mapping markers, and detailed event study cards.

---

## 2. API Endpoints Documentation

The backend server runs by default on `http://127.0.0.1:5000`.

### `GET /api/status`
Returns API health check and version metadata.
* **Response**: `{"status": "healthy", "project": "...", "version": "1.0.0"}`

### `GET /api/prices`
Returns Brent oil daily or weekly prices and calculated log returns.
* **Query Parameters**:
  - `interval`: `'weekly'` (default for dashboard charting performance) or `'daily'`.
* **Response JSON Format**:
  ```json
  [
    {
      "Date": "2020-03-09",
      "Price": 34.36,
      "Log_Return": -0.27
    }
  ]
  ```

### `GET /api/events`
Returns the complete list of 19 compiled geopolitical and economic events.
* **Response JSON Format**:
  ```json
  [
    {
      "Date": "2022-02-24",
      "Event": "Russia-Ukraine Conflict",
      "Category": "Geopolitical / Economic",
      "Severity": "High",
      "Impact Summary": "Russian invasion triggers Western sanctions..."
    }
  ]
  ```

### `GET /api/changepoints`
Serves the posterior summary statistics computed from the PyMC MCMC simulation.
* **Response JSON Format**:
  ```json
  {
    "change_point_date": "2005-03-06",
    "before_mean": 21.37,
    "after_mean": 75.73,
    "absolute_change": 54.36,
    "percentage_change": 254.33,
    "r_hat_tau": 1.02
  }
  ```

### `GET /api/correlations`
Returns aligned events that fall within a +/- 180-day window of the detected Bayesian change point date, along with quantified shifts.
* **Response JSON Format**:
  ```json
  [
    {
      "change_point_date": "2005-03-06",
      "event_date": "2005-03-20",
      "event_name": "...",
      "days_difference": 14,
      "before_mean": 21.37,
      "after_mean": 75.73,
      "absolute_change": 54.36,
      "percentage_change": 254.33
    }
  ]
  ```

---

## 3. Setup and Installation Instructions

Make sure you have **Python 3.9+** and **Node.js 18+** installed.

### Step 1: Run the Backend (Flask)

1. Open a new terminal and navigate to the project directory:
   ```bash
   cd change-point-analysis
   ```
2. Activate the virtual environment:
   - On Windows (Command Prompt/PowerShell):
     ```cmd
     venv\Scripts\activate
     ```
   - On Unix/macOS:
     ```bash
     source venv/bin/activate
     ```
3. Run the Flask application:
   ```bash
   python dashboard/backend/app.py
   ```
   The backend API will start on `http://127.0.0.1:5000`.

### Step 2: Run the Frontend (React + Vite)

1. Open a second terminal and navigate to the frontend directory:
   ```bash
   cd change-point-analysis/dashboard/frontend
   ```
2. Run the development server:
   ```bash
   npm run dev
   ```
3. Open your browser and navigate to `http://localhost:5173`.

---

## 4. Key Dashboard Features

1. **Regime Shifting Overlay**: The line chart displays the price timeline colored in distinct background blocks corresponding to the two main regimes detected by our Bayesian change point model (Regime I: Low-Price, Regime II: High-Price).
2. **Event Markers & Study Drawer**: Researched historical events are overlaid as color-coded dots directly on the price line. Clicking an event automatically zooms the chart to a 2-year window around that event and opens a details panel containing historical context and strategic advice.
3. **Date Filters & Resolution Toggle**: Users can slice the data dynamically using calendar inputs and toggle between daily noise and weekly averages instantly.
