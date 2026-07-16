import os
import json
import sys
from pathlib import Path
from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
import numpy as np

# Set project root to import src modules
project_root = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(project_root))

from src.data_loader import load_brent_prices, load_events_data
from src.preprocessing import calculate_log_returns
from src.analysis import align_events_with_changepoints, calculate_impact_quantification

app = Flask(__name__)
# Enable CORS for React frontend on local port 5173
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Paths
PRICES_PATH = project_root / 'data' / 'raw' / 'BrentOilPrices.csv'
EVENTS_PATH = project_root / 'data' / 'events.csv'
RESULTS_PATH = project_root / 'reports' / 'outputs' / 'change_point_results.json'

def load_all_data():
    """Helper to load Brent oil prices, events, and results."""
    try:
        df_prices = load_brent_prices(str(PRICES_PATH))
        df_prices['Log_Return'] = calculate_log_returns(df_prices['Price']).fillna(0)
    except Exception as e:
        print(f"Error loading price data: {e}")
        df_prices = pd.DataFrame(columns=['Date', 'Price', 'Log_Return'])

    try:
        df_events = load_events_data(str(EVENTS_PATH))
    except Exception as e:
        print(f"Error loading events data: {e}")
        df_events = pd.DataFrame(columns=['Date', 'Event', 'Category', 'Severity', 'Impact Summary'])

    results = {}
    if RESULTS_PATH.exists():
        try:
            with open(RESULTS_PATH, 'r') as f:
                results = json.load(f)
        except Exception as e:
            print(f"Error loading results JSON: {e}")
            
    return df_prices, df_events, results

@app.route('/api/status', methods=['GET'])
def get_status():
    return jsonify({
        "status": "healthy",
        "project": "Birhan Energies - Brent Oil Change Point Analysis API",
        "version": "1.0.0"
    })

@app.route('/api/prices', methods=['GET'])
def get_prices():
    """Get Brent crude prices and log returns.
    Query parameter:
      - interval: 'daily' (default) or 'weekly'
    """
    df_prices, _, _ = load_all_data()
    interval = request.args.get('interval', 'daily')
    
    if interval == 'weekly':
        df_prices.set_index('Date', inplace=True)
        # Resample prices and calculate log returns on weekly data
        df_weekly = df_prices['Price'].resample('W').mean().reset_index()
        df_weekly['Log_Return'] = calculate_log_returns(df_weekly['Price']).fillna(0)
        df_res = df_weekly
    else:
        df_res = df_prices

    # Format Date column for JSON response
    df_res['Date'] = df_res['Date'].dt.strftime('%Y-%m-%d')
    records = df_res.to_dict(orient='records')
    return jsonify(records)

@app.route('/api/events', methods=['GET'])
def get_events():
    """Get the researched list of geopolitical and economic events."""
    _, df_events, _ = load_all_data()
    # Format Date column for JSON response
    df_events['Date'] = df_events['Date'].dt.strftime('%Y-%m-%d')
    records = df_events.to_dict(orient='records')
    return jsonify(records)

@app.route('/api/changepoints', methods=['GET'])
def get_changepoints():
    """Get Bayesian change point model outputs (results of Task 2)."""
    _, _, results = load_all_data()
    return jsonify(results)

@app.route('/api/correlations', methods=['GET'])
def get_correlations():
    """Get detected change point(s) aligned with their nearest events within a window."""
    df_prices, df_events, results = load_all_data()
    
    if not results or 'change_point_date' not in results:
        return jsonify([])
        
    cp_date_str = results['change_point_date']
    cp_date = pd.to_datetime(cp_date_str)
    
    # Run alignment using 180-day window
    df_align = align_events_with_changepoints(df_events, [cp_date], window_days=180)
    
    # Calculate statistics around the change point (e.g. before/after prices)
    # We can also add impact details directly from results
    alignments = []
    for idx, row in df_align.iterrows():
        alignments.append({
            "change_point_date": cp_date_str,
            "event_date": row['Event_Date'].strftime('%Y-%m-%d') if pd.notna(row['Event_Date']) else None,
            "event_name": row['Event'],
            "category": row['Category'],
            "severity": row['Severity'],
            "impact_summary": row['Impact_Summary'],
            "days_difference": int(row['Days_Difference']) if pd.notna(row['Days_Difference']) else None,
            "before_mean": results.get('before_mean'),
            "after_mean": results.get('after_mean'),
            "absolute_change": results.get('absolute_change'),
            "percentage_change": results.get('percentage_change')
        })
        
    return jsonify(alignments)

if __name__ == '__main__':
    # Start the server on port 5000
    app.run(host='127.0.0.1', port=5000, debug=True)
