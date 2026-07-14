# Jupyter Notebooks

This directory contains all Jupyter notebooks for the Change Point Analysis project.

## Notebooks

### 01_task1_foundation.ipynb
**Objective**: Laying the Foundation for Analysis
- Data analysis workflow definition
- Event data compilation and exploration
- Time series properties analysis (trend, stationarity, volatility)
- Assumptions and limitations documentation
- Expected outputs of change point analysis

### 02_task2_changepoint.ipynb
**Objective**: Change Point Modeling and Insight Generation
- Data preparation and exploratory data analysis
- Bayesian change point model development using PyMC
- Model convergence diagnostics
- Change point identification and interpretation
- Event association and impact quantification

### 03_task3_dashboard_analysis.ipynb
**Objective**: Dashboard Development Analysis
- Analysis results preparation for dashboard
- Data aggregation for frontend consumption
- Visualization designs
- API endpoint specifications

## Running Notebooks

1. Ensure dependencies are installed:
```bash
pip install -r ../requirements.txt
```

2. Launch Jupyter:
```bash
jupyter notebook
```

3. Open desired notebook and run cells sequentially

## Notebook Standards

- Include markdown cells explaining each section
- Add comments in code cells
- Document assumptions clearly
- Include visualizations and interpretations
- Export key results to data files

## Output Data

Generated data and figures from notebooks are saved to:
- `../data/processed/` - Processed datasets
- `../data/events/` - Events datasets
- `../reports/figures/` - Generated visualizations
- `../reports/outputs/` - Analysis outputs
