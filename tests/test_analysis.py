"""
Unit tests for analysis module.
"""

import pytest
import pandas as pd
import numpy as np
from pathlib import Path
import sys

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'src'))

from analysis import prepare_time_index, calculate_impact_quantification, extract_change_point_summary


class TestAnalysis:
    """Tests for analysis functions."""
    
    def test_prepare_time_index(self):
        """Test time index preparation."""
        dates = pd.Series(pd.date_range('2020-01-01', periods=100))
        time_index = prepare_time_index(dates)
        
        assert len(time_index) == 100
        assert time_index[0] == 0
        assert time_index[-1] == 99
    
    def test_calculate_impact_quantification(self):
        """Test impact quantification."""
        before = np.array([50.0, 51.0, 52.0, 53.0, 54.0])
        after = np.array([60.0, 61.0, 62.0, 63.0, 64.0])
        
        impact = calculate_impact_quantification(before, after)
        
        assert 'before_mean' in impact
        assert 'after_mean' in impact
        assert 'absolute_change' in impact
        assert 'percentage_change' in impact
        
        assert impact['before_mean'] == 52.0
        assert impact['after_mean'] == 62.0
        assert impact['absolute_change'] == 10.0

    def test_extract_change_point_summary(self):
        """Test summary extraction from trace."""
        import arviz as az
        data = {
            'tau': np.random.randint(10, 50, size=(2, 100)),
            'mu': np.random.normal(50.0, 1.0, size=(2, 100))
        }
        trace = az.from_dict({'posterior': data})
        summary = extract_change_point_summary(trace)
        
        assert 'tau' in summary
        assert 'mu' in summary
        assert 'mean' in summary['tau']
        assert 'sd' in summary['tau']
        assert 'hdi_3%' in summary['tau']
        assert 'r_hat' in summary['tau']

    def test_align_events_with_changepoints(self):
        """Test event alignment with change points."""
        events_df = pd.DataFrame([
            {'Date': pd.Timestamp('2020-03-09'), 'Event': 'Pandemic', 'Category': 'Shock', 'Severity': 'High', 'Impact Summary': 'Demand crash'},
            {'Date': pd.Timestamp('2022-02-24'), 'Event': 'Conflict', 'Category': 'War', 'Severity': 'High', 'Impact Summary': 'Sanctions'}
        ])
        
        change_dates = [pd.Timestamp('2020-03-15'), pd.Timestamp('2021-06-01')]
        from analysis import align_events_with_changepoints
        alignment = align_events_with_changepoints(events_df, change_dates, window_days=10)
        
        assert len(alignment) == 2
        assert alignment.iloc[0]['Event'] == 'Pandemic'
        assert alignment.iloc[0]['Days_Difference'] == -6
        assert alignment.iloc[1]['Event'] == 'No matching event'
        assert pd.isna(alignment.iloc[1]['Event_Date'])


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
