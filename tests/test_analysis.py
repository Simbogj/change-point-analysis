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

from analysis import prepare_time_index, calculate_impact_quantification


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


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
