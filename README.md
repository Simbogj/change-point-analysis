# Change Point Analysis and Statistical Modeling of Time Series Data

Detecting changes and associating causes on time series data - A comprehensive analysis of how political and economic events affect Brent oil prices.

## Overview

This project analyzes structural breaks in Brent oil prices over the past decade using Bayesian change point detection. The analysis identifies key events that have significantly impacted prices and quantifies their effects using rigorous statistical methods.

## Project Structure

```
change-point-analysis/
├── .vscode/                    # VS Code configuration
│   └── settings.json
├── .github/
│   └── workflows/              # GitHub Actions CI/CD
│       └── unittests.yml
├── .gitignore
├── requirements.txt            # Python dependencies
├── README.md
├── src/                        # Source code package
│   ├── __init__.py
│   ├── data_loader.py          # Data loading utilities
│   ├── preprocessing.py        # Data preprocessing
│   ├── analysis.py             # Analysis functions
│   └── visualization.py        # Plotting utilities
├── notebooks/                  # Jupyter notebooks
│   ├── __init__.py
│   ├── README.md
│   ├── 01_task1_foundation.ipynb        # Task 1: Data workflow & understanding
│   ├── 02_task2_changepoint.ipynb       # Task 2: Change point modeling
│   └── 03_task3_dashboard_analysis.ipynb # Task 3: Dashboard analysis
├── tests/                      # Unit tests
│   ├── __init__.py
│   ├── test_data_loader.py
│   ├── test_preprocessing.py
│   └── test_analysis.py
├── scripts/                    # Utility scripts
│   ├── __init__.py
│   ├── README.md
│   └── generate_events_data.py # Generate events dataset
├── data/                       # Data directory
│   ├── README.md
│   ├── raw/                    # Raw data files
│   ├── processed/              # Processed data
│   └── events/                 # Events data
└── reports/                    # Reports and outputs
    ├── README.md
    ├── figures/                # Generated figures
    └── outputs/                # Analysis outputs
```

## Quick Start

### Prerequisites

- Python 3.9+
- pip or conda

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd change-point-analysis
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

### Running the Analysis

1. **Task 1**: Explore the foundation and data workflow:
```bash
jupyter notebook notebooks/01_task1_foundation.ipynb
```

2. **Task 2**: Run change point modeling:
```bash
jupyter notebook notebooks/02_task2_changepoint.ipynb
```

3. **Task 3**: Dashboard development:
```bash
jupyter notebook notebooks/03_task3_dashboard_analysis.ipynb
```

### Running Tests

```bash
pytest tests/
```

## Project Objectives

1. **Identify** key events that have significantly impacted Brent oil prices
2. **Quantify** how much these events affect price changes using statistical methods
3. **Provide** clear, data-driven insights for investment strategies and policy development

## Tasks Overview

### Task 1: Laying the Foundation for Analysis
- Define data analysis workflow
- Research and compile geopolitical event data (10-15+ events)
- Document assumptions and limitations
- Analyze time series properties (trend, stationarity, volatility)
- **Deliverables**: Analysis plan, event dataset, assumptions documentation

### Task 2: Change Point Modeling and Insight Generation
- Load and explore Brent oil price data
- Build Bayesian change point model using PyMC
- Interpret model outputs and identify change points
- Associate changes with geopolitical events
- **Deliverables**: Jupyter notebook, visualizations, quantified impact statements

### Task 3: Interactive Dashboard Development
- Build Flask backend API
- Develop React frontend with visualizations
- Include event highlighting and filtering
- **Deliverables**: Working dashboard, API documentation, setup instructions

## Data

**Source**: Historical Brent oil prices (May 20, 1987 - September 30, 2022)

**Data Fields**:
- `Date`: Daily date (day-month-year format)
- `Price`: Brent oil price in USD per barrel

