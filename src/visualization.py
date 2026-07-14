"""
Visualization utilities for time series and analysis results.

This module provides functions to create publication-quality visualizations
of prices, change points, and model results.
"""

import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
import numpy as np


def plot_time_series(dates: pd.Series, prices: pd.Series, 
                     title: str = "Brent Oil Prices Over Time",
                     figsize: tuple = (14, 6)) -> plt.Figure:
    """
    Plot time series of oil prices.
    
    Parameters
    ----------
    dates : pd.Series
        Series of dates
    prices : pd.Series
        Series of prices
    title : str
        Plot title
    figsize : tuple
        Figure size (width, height)
        
    Returns
    -------
    plt.Figure
        Matplotlib figure object
    """
    fig, ax = plt.subplots(figsize=figsize)
    ax.plot(dates, prices, linewidth=1.5)
    ax.set_xlabel('Date')
    ax.set_ylabel('Price (USD per barrel)')
    ax.set_title(title)
    ax.grid(True, alpha=0.3)
    plt.tight_layout()
    return fig


def plot_log_returns(dates: pd.Series, log_returns: pd.Series,
                     figsize: tuple = (14, 6)) -> plt.Figure:
    """
    Plot log returns with volatility bands.
    
    Parameters
    ----------
    dates : pd.Series
        Series of dates
    log_returns : pd.Series
        Series of log returns
    figsize : tuple
        Figure size
        
    Returns
    -------
    plt.Figure
        Matplotlib figure object
    """
    fig, ax = plt.subplots(figsize=figsize)
    ax.plot(dates, log_returns, linewidth=0.8, alpha=0.7)
    ax.fill_between(dates, -3*log_returns.std(), 3*log_returns.std(), 
                     alpha=0.2, label='3σ band')
    ax.set_xlabel('Date')
    ax.set_ylabel('Log Returns')
    ax.set_title('Log Returns of Brent Oil Prices')
    ax.grid(True, alpha=0.3)
    ax.legend()
    plt.tight_layout()
    return fig


def plot_change_points(dates: pd.Series, prices: pd.Series,
                       change_points: list, figsize: tuple = (14, 8)) -> plt.Figure:
    """
    Plot time series with detected change points highlighted.
    
    Parameters
    ----------
    dates : pd.Series
        Series of dates
    prices : pd.Series
        Series of prices
    change_points : list
        List of change point dates
    figsize : tuple
        Figure size
        
    Returns
    -------
    plt.Figure
        Matplotlib figure object
    """
    fig, ax = plt.subplots(figsize=figsize)
    ax.plot(dates, prices, linewidth=1.5, label='Price')
    
    for cp_date in change_points:
        ax.axvline(cp_date, color='red', linestyle='--', alpha=0.7)
    
    ax.set_xlabel('Date')
    ax.set_ylabel('Price (USD per barrel)')
    ax.set_title('Brent Oil Prices with Detected Change Points')
    ax.grid(True, alpha=0.3)
    ax.legend()
    plt.tight_layout()
    return fig


def plot_posterior_distribution(posterior_samples: np.ndarray,
                                param_name: str = "Parameter",
                                figsize: tuple = (10, 6)) -> plt.Figure:
    """
    Plot posterior distribution from MCMC samples.
    
    Parameters
    ----------
    posterior_samples : np.ndarray
        Posterior samples from MCMC
    param_name : str
        Parameter name for title
    figsize : tuple
        Figure size
        
    Returns
    -------
    plt.Figure
        Matplotlib figure object
    """
    fig, ax = plt.subplots(figsize=figsize)
    ax.hist(posterior_samples, bins=50, alpha=0.7, edgecolor='black')
    ax.axvline(posterior_samples.mean(), color='red', linestyle='--', 
               label=f'Mean: {posterior_samples.mean():.2f}')
    ax.set_xlabel(param_name)
    ax.set_ylabel('Frequency')
    ax.set_title(f'Posterior Distribution of {param_name}')
    ax.legend()
    plt.tight_layout()
    return fig
