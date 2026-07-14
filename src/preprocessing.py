"""
Data preprocessing utilities for time series analysis.

This module provides functions to clean, normalize, and transform
Brent oil price data for analysis.
"""

import pandas as pd
import numpy as np
from scipy import stats


def calculate_log_returns(prices: pd.Series) -> pd.Series:
    """
    Calculate log returns from price series.
    
    Log returns are calculated as: log(price_t) - log(price_{t-1})
    
    Parameters
    ----------
    prices : pd.Series
        Series of price values
        
    Returns
    -------
    pd.Series
        Series of log returns (with first value as NaN)
    """
    return np.log(prices / prices.shift(1))


def test_stationarity(series: pd.Series) -> dict:
    """
    Perform Augmented Dickey-Fuller (ADF) test for stationarity.
    
    Parameters
    ----------
    series : pd.Series
        Time series to test
        
    Returns
    -------
    dict
        Results including test statistic, p-value, and critical values
    """
    from statsmodels.tsa.stattools import adfuller
    
    result = adfuller(series.dropna())
    
    return {
        'test_statistic': result[0],
        'p_value': result[1],
        'lags_used': result[2],
        'observations': result[3],
        'critical_values': result[4],
        'is_stationary': result[1] < 0.05
    }


def normalize_series(series: pd.Series) -> pd.Series:
    """
    Normalize series to zero mean and unit variance.
    
    Parameters
    ----------
    series : pd.Series
        Series to normalize
        
    Returns
    -------
    pd.Series
        Normalized series
    """
    return (series - series.mean()) / series.std()


def remove_outliers(series: pd.Series, threshold: float = 3.0) -> pd.Series:
    """
    Remove outliers using z-score method.
    
    Parameters
    ----------
    series : pd.Series
        Series to clean
    threshold : float
        Z-score threshold for outlier detection (default: 3.0)
        
    Returns
    -------
    pd.Series
        Series with outliers replaced by median
    """
    z_scores = np.abs(stats.zscore(series.dropna()))
    outlier_mask = z_scores > threshold
    
    series_clean = series.copy()
    series_clean[series.index[1:][outlier_mask]] = series_clean.median()
    
    return series_clean
