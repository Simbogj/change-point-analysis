"""
Data loading and preprocessing utilities for Change Point Analysis.

This module provides functions to load Brent oil price data and prepare it
for time series analysis and change point detection.
"""

import pandas as pd
import numpy as np
from pathlib import Path


def load_brent_prices(filepath: str) -> pd.DataFrame:
    """
    Load Brent oil price data from CSV file.
    
    Parameters
    ----------
    filepath : str
        Path to the CSV file containing Brent oil prices
        
    Returns
    -------
    pd.DataFrame
        DataFrame with 'Date' (datetime) and 'Price' (float) columns
        
    Raises
    ------
    FileNotFoundError
        If the specified file does not exist
    ValueError
        If the data format is invalid
    """
    try:
        df = pd.read_csv(filepath)
        df['Date'] = pd.to_datetime(df['Date'], format='mixed')
        df = df.sort_values('Date').reset_index(drop=True)
        return df
    except FileNotFoundError:
        raise FileNotFoundError(f"Data file not found: {filepath}")
    except Exception as e:
        raise ValueError(f"Error loading data: {str(e)}")


def load_events_data(filepath: str) -> pd.DataFrame:
    """
    Load geopolitical events data from CSV file.
    
    Parameters
    ----------
    filepath : str
        Path to the CSV file containing events data
        
    Returns
    -------
    pd.DataFrame
        DataFrame with event information
    """
    try:
        df = pd.read_csv(filepath)
        df['Date'] = pd.to_datetime(df['Date'])
        return df
    except FileNotFoundError:
        raise FileNotFoundError(f"Events file not found: {filepath}")
    except Exception as e:
        raise ValueError(f"Error loading events: {str(e)}")


def validate_data(df: pd.DataFrame) -> bool:
    """
    Validate the structure and content of price data.
    
    Parameters
    ----------
    df : pd.DataFrame
        DataFrame to validate
        
    Returns
    -------
    bool
        True if data is valid
        
    Raises
    ------
    ValueError
        If data validation fails
    """
    required_cols = ['Date', 'Price']
    if not all(col in df.columns for col in required_cols):
        raise ValueError(f"Missing required columns: {required_cols}")
    
    if df['Price'].isna().any():
        raise ValueError("Price column contains NaN values")
    
    if (df['Price'] <= 0).any():
        raise ValueError("Price values must be positive")
    
    return True
