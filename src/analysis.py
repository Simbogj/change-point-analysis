"""
Analysis functions for change point detection and Bayesian modeling.

This module provides the core functionality for fitting Bayesian change point
models and interpreting results.
"""

import numpy as np
import pandas as pd


def prepare_time_index(dates: pd.Series) -> np.ndarray:
    """
    Convert date series to numeric time index.
    
    Parameters
    ----------
    dates : pd.Series
        Series of dates
        
    Returns
    -------
    np.ndarray
        Numeric time index (0 to n-1)
    """
    return np.arange(len(dates))


def extract_change_point_summary(trace: object, burnin: int = 0) -> dict:
    """
    Extract summary statistics from MCMC trace.
    
    Parameters
    ----------
    trace : object
        PyMC trace object (arviz.InferenceData) from MCMC sampling
    burnin : int
        Number of iterations to discard as burn-in (if not already discarded)
        
    Returns
    -------
    dict
        Summary statistics including means, credible intervals, and r_hat values
    """
    import arviz as az
    
    # Get the summary dataframe using arviz
    summary_df = az.summary(trace)
    
    # Convert summary to a dictionary
    summary_dict = {}
    for var_name in summary_df.index:
        # Check if R_hat column exists
        r_hat_val = float(summary_df.loc[var_name, 'r_hat']) if 'r_hat' in summary_df.columns else None
        
        # Use fallback columns depending on the summary format
        mean_val = float(summary_df.loc[var_name, 'mean'])
        sd_val = float(summary_df.loc[var_name, 'sd'])
        
        # HDI or ETI limits (can be hdi_3%, hdi_97%, or eti89_lb, eti89_ub, etc.)
        hdi_low_col = [col for col in summary_df.columns if 'hdi' in col and ('3%' in col or 'lower' in col or '0.03' in col or '5%' in col) or 'lb' in col]
        hdi_high_col = [col for col in summary_df.columns if 'hdi' in col and ('97%' in col or 'upper' in col or '0.97' in col or '95%' in col) or 'ub' in col]
        
        hdi_low = float(summary_df.loc[var_name, hdi_low_col[0]]) if hdi_low_col else float('nan')
        hdi_high = float(summary_df.loc[var_name, hdi_high_col[0]]) if hdi_high_col else float('nan')
        
        summary_dict[var_name] = {
            'mean': mean_val,
            'sd': sd_val,
            'hdi_3%': hdi_low,
            'hdi_97%': hdi_high,
            'r_hat': r_hat_val if r_hat_val is not None else float('nan')
        }
        
    return summary_dict


def calculate_impact_quantification(before_values: np.ndarray, 
                                   after_values: np.ndarray) -> dict:
    """
    Quantify the impact of a change point.
    
    Parameters
    ----------
    before_values : np.ndarray
        Values before change point
    after_values : np.ndarray
        Values after change point
        
    Returns
    -------
    dict
        Impact statistics including mean change, percentage change, etc.
    """
    before_mean = before_values.mean()
    after_mean = after_values.mean()
    
    absolute_change = after_mean - before_mean
    percentage_change = (absolute_change / before_mean) * 100
    
    return {
        'before_mean': before_mean,
        'after_mean': after_mean,
        'absolute_change': absolute_change,
        'percentage_change': percentage_change
    }


def align_events_with_changepoints(events_df: pd.DataFrame,
                                   change_dates: list,
                                   window_days: int = 30) -> pd.DataFrame:
    """
    Associate detected change points with events.
    
    Parameters
    ----------
    events_df : pd.DataFrame
        DataFrame with events
    change_dates : list
        List of detected change point dates
    window_days : int
        Window size in days to match change points with events
        
    Returns
    -------
    pd.DataFrame
        Events with associated change points
    """
    alignments = []
    
    for cp_date in change_dates:
        cp_dt = pd.to_datetime(cp_date)
        # Find events within the window
        temp_diff = (events_df['Date'] - cp_dt).dt.days
        matched_events = events_df[temp_diff.abs() <= window_days].copy()
        
        if not matched_events.empty:
            for idx, row in matched_events.iterrows():
                alignments.append({
                    'Change_Point_Date': cp_dt,
                    'Event_Date': row['Date'],
                    'Event': row['Event'],
                    'Category': row['Category'],
                    'Severity': row['Severity'],
                    'Impact_Summary': row['Impact Summary'],
                    'Days_Difference': int((row['Date'] - cp_dt).days)
                })
        else:
            alignments.append({
                'Change_Point_Date': cp_dt,
                'Event_Date': pd.NaT,
                'Event': 'No matching event',
                'Category': 'N/A',
                'Severity': 'N/A',
                'Impact_Summary': 'No event occurred within the time window.',
                'Days_Difference': np.nan
            })
            
    return pd.DataFrame(alignments)
