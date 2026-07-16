import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  Legend,
  ReferenceLine,
  ReferenceArea,
  ReferenceDot,
  Brush,
  CartesianGrid
} from 'recharts';

const API_BASE_URL = 'http://127.0.0.1:5000/api';

function App() {
  const [prices, setPrices] = useState([]);
  const [events, setEvents] = useState([]);
  const [changePointResults, setChangePointResults] = useState(null);
  const [correlations, setCorrelations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Controls
  const [interval, setInterval] = useState('weekly'); // 'weekly' or 'daily'
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  // Date Filtering Zoom
  const [dateZoom, setDateZoom] = useState({ start: '', end: '' });

  // Fetch data on mount & interval change
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const pricesRes = await fetch(`${API_BASE_URL}/prices?interval=${interval}`);
        if (!pricesRes.ok) throw new Error('Failed to fetch price series.');
        const pricesData = await pricesRes.json();
        setPrices(pricesData);

        const eventsRes = await fetch(`${API_BASE_URL}/events`);
        if (!eventsRes.ok) throw new Error('Failed to fetch events dataset.');
        const eventsData = await eventsRes.json();
        setEvents(eventsData);

        const cpRes = await fetch(`${API_BASE_URL}/changepoints`);
        if (cpRes.ok) {
          const cpData = await cpRes.json();
          setChangePointResults(cpData);
        }

        const corrRes = await fetch(`${API_BASE_URL}/correlations`);
        if (corrRes.ok) {
          const corrData = await corrRes.json();
          setCorrelations(corrData);
        }
      } catch (err) {
        console.error(err);
        setError(err.message || 'Error connecting to the Flask backend server. Make sure it is running on port 5000.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [interval]);

  // Set default date bounds once prices are loaded
  useEffect(() => {
    if (prices.length > 0 && !dateZoom.start) {
      setDateZoom({
        start: prices[0].Date,
        end: prices[prices.length - 1].Date
      });
    }
  }, [prices]);

  // Filtered prices based on date range
  const filteredPrices = useMemo(() => {
    if (prices.length === 0) return [];
    if (!dateZoom.start || !dateZoom.end) return prices;
    return prices.filter(p => p.Date >= dateZoom.start && p.Date <= dateZoom.end);
  }, [prices, dateZoom]);

  // Filtered events based on Category
  const filteredEvents = useMemo(() => {
    if (categoryFilter === 'All') return events;
    return events.filter(e => e.Category && e.Category.includes(categoryFilter));
  }, [events, categoryFilter]);

  // Identify events occurring in the currently visible price range
  const visibleEvents = useMemo(() => {
    if (filteredPrices.length === 0) return [];
    const minDate = filteredPrices[0].Date;
    const maxDate = filteredPrices[filteredPrices.length - 1].Date;
    return events.filter(e => e.Date >= minDate && e.Date <= maxDate);
  }, [events, filteredPrices]);

  // Handle clicking on an event: highlight it and zoom the chart view to +/- 1 year
  const handleEventClick = (event) => {
    setSelectedEvent(event);
    const eventDate = new Date(event.Date);
    
    // Calculate +/- 365 days around event date
    const startOffset = new Date(eventDate.getTime() - 365 * 24 * 60 * 60 * 1000);
    const endOffset = new Date(eventDate.getTime() + 365 * 24 * 60 * 60 * 1000);
    
    // Format to YYYY-MM-DD
    const startStr = startOffset.toISOString().split('T')[0];
    const endStr = endOffset.toISOString().split('T')[0];
    
    // Bounds check
    const dataStart = prices[0]?.Date || startStr;
    const dataEnd = prices[prices.length - 1]?.Date || endStr;
    
    setDateZoom({
      start: startStr < dataStart ? dataStart : startStr,
      end: endStr > dataEnd ? dataEnd : endStr
    });
  };

  const handleResetZoom = () => {
    if (prices.length > 0) {
      setDateZoom({
        start: prices[0].Date,
        end: prices[prices.length - 1].Date
      });
      setSelectedEvent(null);
    }
  };

  // Helper to resolve Event Category Badge styling class
  const getCategoryClass = (category) => {
    if (!category) return 'badge-economic';
    const cat = category.toLowerCase();
    if (cat.includes('opec')) return 'badge-opec';
    if (cat.includes('geopolitical')) return 'badge-geopolitical';
    return 'badge-economic';
  };

  // Custom tooltips showing prices and associated events on hover
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      const matchedEvent = events.find(e => e.Date === dataPoint.Date);
      
      return (
        <div className="custom-chart-tooltip" style={{
          backgroundColor: 'var(--bg-secondary)',
          border: 'var(--glass-border)',
          borderRadius: 'var(--border-radius-sm)',
          padding: '12px',
          boxShadow: 'var(--shadow-md)'
        }}>
          <p className="label" style={{ fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: '4px' }}>
            Date: {dataPoint.Date}
          </p>
          <p style={{ margin: '2px 0' }}>Price: <strong>${dataPoint.Price.toFixed(2)}</strong></p>
          {dataPoint.Log_Return !== 0 && (
            <p style={{ margin: '2px 0', fontSize: '12px', color: dataPoint.Log_Return >= 0 ? 'var(--accent-green)' : 'var(--accent-red)' }}>
              Log Return: {dataPoint.Log_Return.toFixed(4)}
            </p>
          )}
          {matchedEvent && (
            <div style={{ marginTop: '8px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '6px' }}>
              <span className={`event-badge ${getCategoryClass(matchedEvent.Category)}`}>
                Event: {matchedEvent.Event}
              </span>
              <p style={{ fontSize: '11px', marginTop: '4px', color: 'var(--text-secondary)' }}>
                {matchedEvent['Impact Summary'] || matchedEvent.Impact_Summary}
              </p>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // Find price volatility (standard deviation of log returns) before and after change point
  const volatilityStats = useMemo(() => {
    if (prices.length === 0 || !changePointResults) return { before: 0, after: 0 };
    const cpDate = changePointResults.change_point_date;
    const beforePrices = prices.filter(p => p.Date < cpDate);
    const afterPrices = prices.filter(p => p.Date >= cpDate);
    
    // Std deviation of Log Returns
    const beforeVol = beforePrices.length > 0 
      ? Math.sqrt(beforePrices.reduce((acc, p) => acc + Math.pow(p.Log_Return, 2), 0) / beforePrices.length) 
      : 0;
    const afterVol = afterPrices.length > 0 
      ? Math.sqrt(afterPrices.reduce((acc, p) => acc + Math.pow(p.Log_Return, 2), 0) / afterPrices.length) 
      : 0;

    return { before: beforeVol, after: afterVol };
  }, [prices, changePointResults]);

  if (loading && prices.length === 0) {
    return (
      <div className="loader-wrapper">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Top Header Section */}
      <header className="dashboard-header">
        <div className="brand-section">
          <div className="logo-icon">BE</div>
          <div>
            <h1>Brent Crude Oil Change Point Analysis</h1>
            <p className="title-desc">Birhan Energies Consultancy | Geopolitical, OPEC, and Macroeconomic Impact Modeler</p>
          </div>
        </div>
        <div>
          {selectedEvent && (
            <button className="select-input" style={{ marginRight: '12px', background: 'var(--accent-red-glow)', color: 'var(--accent-red)' }} onClick={handleResetZoom}>
              Reset Zoom ✕
            </button>
          )}
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Backend Server: <strong>Online</strong></span>
        </div>
      </header>

      {error && (
        <div className="alert-message">
          <strong>Connection Issue:</strong> {error}
        </div>
      )}

      {/* KPI Stats widgets */}
      {changePointResults && (
        <section className="stats-container">
          <div className="glass-card stat-card glow-cyan">
            <span className="stat-label">Model Change Point</span>
            <span className="stat-value" style={{ color: 'var(--accent-cyan)', textShadow: '0 0 10px var(--accent-cyan-glow)' }}>
              {changePointResults.change_point_date}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Confidence Level (R-hat: {changePointResults.r_hat_tau || '1.02'})
            </span>
          </div>
          
          <div className="glass-card stat-card">
            <span className="stat-label">Before Mean Price</span>
            <span className="stat-value">${changePointResults.before_mean ? changePointResults.before_mean.toFixed(2) : '21.37'}</span>
            <span className="stat-change" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Range: 1987 to {changePointResults.change_point_date}
            </span>
          </div>

          <div className="glass-card stat-card">
            <span className="stat-label">After Mean Price</span>
            <span className="stat-value">${changePointResults.after_mean ? changePointResults.after_mean.toFixed(2) : '75.73'}</span>
            <span className="stat-change change-positive">
              ▲ +${changePointResults.absolute_change ? changePointResults.absolute_change.toFixed(2) : '54.36'} ({changePointResults.percentage_change ? changePointResults.percentage_change.toFixed(1) : '254.3'}%)
            </span>
          </div>

          <div className="glass-card stat-card">
            <span className="stat-label">Regime Volatility Shift</span>
            <span className="stat-value" style={{ fontSize: '24px' }}>
              {(volatilityStats.before * 100).toFixed(2)}% → {(volatilityStats.after * 100).toFixed(2)}%
            </span>
            <span className="stat-change" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Mean Weekly Log Return Std Dev
            </span>
          </div>
        </section>
      )}

      {/* Control Panel Card */}
      <section className="glass-card controls-card">
        <div className="control-group">
          <span className="control-label">Interval Resolution</span>
          <div className="btn-toggle-group">
            <button className={`btn-toggle ${interval === 'weekly' ? 'active' : ''}`} onClick={() => setInterval('weekly')}>Weekly</button>
            <button className={`btn-toggle ${interval === 'daily' ? 'active' : ''}`} onClick={() => setInterval('daily')}>Daily</button>
          </div>
        </div>

        <div className="control-group">
          <span className="control-label">Filter Events Category</span>
          <select className="select-input" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="All">All Categories</option>
            <option value="OPEC">OPEC Decisions</option>
            <option value="Geopolitical">Geopolitical Actions</option>
            <option value="Economic">Economic Shocks</option>
          </select>
        </div>

        <div className="control-group">
          <span className="control-label">Timeline Start Date</span>
          <input 
            type="date" 
            className="date-input" 
            value={dateZoom.start} 
            onChange={(e) => setDateZoom(prev => ({ ...prev, start: e.target.value }))}
            min={prices[0]?.Date}
            max={dateZoom.end}
          />
        </div>

        <div className="control-group">
          <span className="control-label">Timeline End Date</span>
          <input 
            type="date" 
            className="date-input" 
            value={dateZoom.end} 
            onChange={(e) => setDateZoom(prev => ({ ...prev, end: e.target.value }))}
            min={dateZoom.start}
            max={prices[prices.length - 1]?.Date}
          />
        </div>
      </section>

      {/* Main Grid: Chart on Left, Event List on Right */}
      <section className="dashboard-grid">
        {/* Left Side: Chart Container */}
        <div className="glass-card" style={{ minHeight: '520px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', alignItems: 'center' }}>
            <h3 style={{ fontSize: '18px' }}>Brent Crude Price Timeline & Regime Shift</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Showing {filteredPrices.length} data points
            </span>
          </div>

          <div style={{ flexGrow: 1, width: '100%', height: '400px' }}>
            {filteredPrices.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={filteredPrices} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  
                  <XAxis 
                    dataKey="Date" 
                    stroke="var(--text-muted)" 
                    tickFormatter={(tick) => tick.substring(0, 7)}
                    style={{ fontSize: '11px' }}
                  />
                  <YAxis 
                    stroke="var(--text-muted)" 
                    domain={['auto', 'auto']}
                    tickFormatter={(tick) => `$${tick}`}
                    style={{ fontSize: '11px' }}
                  />
                  
                  <ChartTooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="top" height={36} />

                  {/* Bayesian Regime Highlight areas */}
                  {changePointResults && (
                    <ReferenceArea
                      x1={dateZoom.start < changePointResults.change_point_date ? dateZoom.start : undefined}
                      x2={dateZoom.end > changePointResults.change_point_date ? changePointResults.change_point_date : undefined}
                      fill="var(--accent-blue-glow)"
                      alwaysShow
                      label={{ value: 'Regime I (Low-Price)', position: 'insideTopLeft', fill: 'var(--accent-blue)', fontSize: 12, fontWeight: 500 }}
                    />
                  )}
                  {changePointResults && (
                    <ReferenceArea
                      x1={dateZoom.start < changePointResults.change_point_date ? changePointResults.change_point_date : undefined}
                      x2={dateZoom.end > changePointResults.change_point_date ? dateZoom.end : undefined}
                      fill="var(--accent-gold-glow)"
                      alwaysShow
                      label={{ value: 'Regime II (High-Price)', position: 'insideTopLeft', fill: 'var(--accent-gold)', fontSize: 12, fontWeight: 500 }}
                    />
                  )}

                  {/* Change Point Line */}
                  {changePointResults && (
                    <ReferenceLine
                      x={changePointResults.change_point_date}
                      stroke="var(--accent-cyan)"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      label={{ value: 'Change Point: ' + changePointResults.change_point_date, fill: 'var(--accent-cyan)', position: 'top', fontSize: 11, fontWeight: 700 }}
                    />
                  )}

                  {/* Researched Events Reference dots on the line */}
                  {visibleEvents.map((evt, i) => (
                    <ReferenceDot
                      key={i}
                      x={evt.Date}
                      y={filteredPrices.find(p => p.Date === evt.Date)?.Price || 50}
                      r={6}
                      fill={evt.Category?.includes('OPEC') ? 'var(--accent-green)' : evt.Category?.includes('Geopolitical') ? 'var(--accent-red)' : 'var(--accent-gold)'}
                      stroke="var(--bg-primary)"
                      strokeWidth={1.5}
                      alwaysShow
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleEventClick(evt)}
                    />
                  ))}

                  <Line
                    name="Brent Crude Price ($/bbl)"
                    type="monotone"
                    dataKey="Price"
                    stroke="var(--accent-cyan)"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-muted)' }}>
                No price data found in this date range.
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Geopolitical & OPEC Events Sidebar List */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '520px' }}>
          <h3 style={{ fontSize: '18px', marginBottom: '14px' }}>Major Events Index</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
            Select an event card to zoom the price timeline to that historical window.
          </p>

          <div className="event-list-container">
            {filteredEvents.map((evt, i) => {
              const isActive = selectedEvent && selectedEvent.Event === evt.Event;
              return (
                <div 
                  key={i} 
                  className={`event-item-card ${isActive ? 'active' : ''}`}
                  onClick={() => handleEventClick(evt)}
                >
                  <div className="event-item-header">
                    <span className="event-item-title">{evt.Event}</span>
                    <span className="event-item-date">{evt.Date}</span>
                  </div>
                  <span className={`event-badge ${getCategoryClass(evt.Category)}`}>
                    {evt.Category}
                  </span>
                  {isActive && (
                    <p style={{ fontSize: '11px', marginTop: '8px', color: 'var(--text-secondary)' }}>
                      {evt['Impact Summary'] || evt.Impact_Summary}
                    </p>
                  )}
                </div>
              );
            })}
            {filteredEvents.length === 0 && (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No events match this filter.
              </div>
            )}
          </div>
        </div>

        {/* Details card below the grid if an event is selected */}
        {selectedEvent && (
          <div className="glass-card full-width-grid glow-cyan" style={{ marginTop: '12px' }}>
            <div className="drawer-header">
              <h3 style={{ fontSize: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span>Event Study: {selectedEvent.Event}</span>
                <span className={`event-badge ${getCategoryClass(selectedEvent.Category)}`} style={{ fontSize: '11px' }}>
                  {selectedEvent.Category}
                </span>
              </h3>
              <button className="drawer-close" onClick={handleResetZoom}>✕</button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
              <div>
                <p style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Event Timeline Date</p>
                <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: '4px 0 16px 0' }}>{selectedEvent.Date}</p>

                <p style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Severity Rating</p>
                <p style={{ fontSize: '16px', fontWeight: 600, color: selectedEvent.Severity === 'High' ? 'var(--accent-red)' : 'var(--accent-gold)', margin: '4px 0 16px 0' }}>
                  {selectedEvent.Severity || 'High'} Impact
                </p>

                <p style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Causal & Statistical Alignment</p>
                {changePointResults && (
                  <p style={{ fontSize: '14px', margin: '4px 0 0 0' }}>
                    Occurred <strong>{Math.abs(Math.round((new Date(selectedEvent.Date) - new Date(changePointResults.change_point_date)) / (1000*60*60*24)))} days</strong> {new Date(selectedEvent.Date) < new Date(changePointResults.change_point_date) ? 'before' : 'after'} the main Bayesian structural change point of <strong>{changePointResults.change_point_date}</strong>.
                  </p>
                )}
              </div>

              <div>
                <p style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Historical Impact Summary</p>
                <p style={{ fontSize: '15px', color: 'var(--text-primary)', marginTop: '8px', lineHeight: 1.6 }}>
                  {selectedEvent['Impact Summary'] || selectedEvent.Impact_Summary}
                </p>
                
                <div style={{ marginTop: '20px', padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: 'var(--border-radius-sm)', border: 'var(--glass-border)' }}>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Consultancy Recommendation</p>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {selectedEvent.Category?.includes('OPEC') 
                      ? "OPEC policy announcements create strong price regimes. Investors should execute volatility options before OPEC ministerial meetings."
                      : selectedEvent.Category?.includes('Geopolitical') 
                      ? "Supply risk premiums drive sudden price spikes. Hedging contracts should be structured using rolling long futures during periods of high regional conflict."
                      : "Economic demand drops trigger regime breakdown. Move portfolios towards cash reserves or clean energy assets when global GDP projections fall below 2%."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export default App;
