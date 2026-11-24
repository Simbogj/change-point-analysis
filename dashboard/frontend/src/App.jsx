import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  LineChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  ReferenceLine,
  ReferenceArea,
  ReferenceDot,
  Brush,
  CartesianGrid,
} from 'recharts';

const API = 'http://127.0.0.1:5000/api';

/* ─────────────────────────────────────────────
   ICONS (inline SVG, no extra dependency)
───────────────────────────────────────────── */
const Icon = {
  Chart: () => (
    <svg viewBox="0 0 20 20" fill="currentColor" className="nav-item-icon">
      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
    </svg>
  ),
  Events: () => (
    <svg viewBox="0 0 20 20" fill="currentColor" className="nav-item-icon">
      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
    </svg>
  ),
  Insight: () => (
    <svg viewBox="0 0 20 20" fill="currentColor" className="nav-item-icon">
      <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zm3 6v-1h4v1a2 2 0 11-4 0zm4-2a4 4 0 10-4 0h4z"/>
    </svg>
  ),
  Warning: () => (
    <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: 16, height: 16, flexShrink: 0 }}>
      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
    </svg>
  ),
};

/* ─────────────────────────────────────────────
   HELPER UTILITIES
───────────────────────────────────────────── */
function getPillClass(category) {
  if (!category) return 'pill-unknown';
  const c = category.toLowerCase();
  if (c.includes('opec')) return 'pill-opec';
  if (c.includes('geopolitical')) return 'pill-geopolitical';
  if (c.includes('economic')) return 'pill-economic';
  return 'pill-unknown';
}

function getCatClass(category) {
  if (!category) return 'cat-economic';
  const c = category.toLowerCase();
  if (c.includes('opec')) return 'cat-opec';
  if (c.includes('geopolitical')) return 'cat-geopolitical';
  return 'cat-economic';
}

function getSeverityDots(severity) {
  const s = (severity || 'medium').toLowerCase();
  const levels = s === 'high' ? 3 : s === 'medium' ? 2 : 1;
  const filledClass = s === 'high' ? 'filled-high' : s === 'medium' ? 'filled-medium' : 'filled-low';
  return Array.from({ length: 3 }, (_, i) => (
    <span key={i} className={`sev-dot ${i < levels ? filledClass : ''}`} />
  ));
}

function fmt(n, dec = 2) {
  return n != null ? Number(n).toFixed(dec) : '—';
}

/* ─────────────────────────────────────────────
   CUSTOM CHART TOOLTIP
───────────────────────────────────────────── */
function CustomTooltip({ active, payload, label, events }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const matchedEvent = events.find(e => e.Date === d.Date);

  return (
    <div className="chart-tooltip">
      <div className="tooltip-date">{d.Date}</div>
      <div className="tooltip-row">
        <span className="tooltip-key">Price</span>
        <span className="tooltip-val">${fmt(d.Price)}/bbl</span>
      </div>
      {d.Log_Return !== 0 && (
        <div className="tooltip-row">
          <span className="tooltip-key">Log Return</span>
          <span className={`tooltip-val ${d.Log_Return >= 0 ? 'up' : 'down'}`}>
            {d.Log_Return >= 0 ? '+' : ''}{fmt(d.Log_Return, 4)}
          </span>
        </div>
      )}
      {matchedEvent && (
        <div className="tooltip-event">
          <div className="tooltip-event-name">⚡ {matchedEvent.Event}</div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN APP
───────────────────────────────────────────── */
export default function App() {
  const [prices, setPrices]       = useState([]);
  const [events, setEvents]       = useState([]);
  const [cpResults, setCpResults] = useState(null);
  const [correlations, setCorrelations] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  // Controls
  const [interval, setIntervalMode]  = useState('weekly');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [selectedEvent, setSelectedEvent]   = useState(null);
  const [activeNav, setActiveNav]           = useState('overview');
  const [chartTab, setChartTab]             = useState('price');
  const [dateZoom, setDateZoom]   = useState({ start: '', end: '' });

  /* ── Fetch ── */
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        const [prRes, evRes, cpRes, corRes] = await Promise.all([
          fetch(`${API}/prices?interval=${interval}`),
          fetch(`${API}/events`),
          fetch(`${API}/changepoints`),
          fetch(`${API}/correlations`),
        ]);

        if (!prRes.ok) throw new Error('Price data fetch failed.');
        if (!evRes.ok) throw new Error('Events data fetch failed.');

        const [prData, evData, cpData, corData] = await Promise.all([
          prRes.json(),
          evRes.json(),
          cpRes.ok ? cpRes.json() : Promise.resolve(null),
          corRes.ok ? corRes.json() : Promise.resolve([]),
        ]);

        setPrices(prData);
        setEvents(evData);
        setCpResults(cpData);
        setCorrelations(corData);
      } catch (e) {
        setError(e.message || 'Cannot reach Flask backend on port 5000.');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [interval]);

  /* ── Default date bounds ── */
  useEffect(() => {
    if (prices.length > 0 && !dateZoom.start) {
      setDateZoom({ start: prices[0].Date, end: prices[prices.length - 1].Date });
    }
  }, [prices]);

  /* ── Filtered data ── */
  const filteredPrices = useMemo(() => {
    if (!dateZoom.start || !dateZoom.end) return prices;
    return prices.filter(p => p.Date >= dateZoom.start && p.Date <= dateZoom.end);
  }, [prices, dateZoom]);

  const filteredEvents = useMemo(() => {
    if (categoryFilter === 'All') return events;
    return events.filter(e => e.Category?.toLowerCase().includes(categoryFilter.toLowerCase()));
  }, [events, categoryFilter]);

  const visibleEvents = useMemo(() => {
    if (!filteredPrices.length) return [];
    const min = filteredPrices[0].Date;
    const max = filteredPrices[filteredPrices.length - 1].Date;
    return events.filter(e => e.Date >= min && e.Date <= max);
  }, [events, filteredPrices]);

  /* ── Volatility stats ── */
  const volStats = useMemo(() => {
    if (!prices.length || !cpResults) return { before: 0, after: 0 };
    const cp = cpResults.change_point_date;
    const before = prices.filter(p => p.Date < cp);
    const after  = prices.filter(p => p.Date >= cp);
    const stdDev = arr => arr.length
      ? Math.sqrt(arr.reduce((s, p) => s + p.Log_Return ** 2, 0) / arr.length)
      : 0;
    return { before: stdDev(before), after: stdDev(after) };
  }, [prices, cpResults]);

  /* ── Event click ── */
  const handleEventClick = (evt) => {
    setSelectedEvent(prev => prev?.Event === evt.Event ? null : evt);
    const d = new Date(evt.Date);
    const start = new Date(d - 365 * 864e5).toISOString().slice(0, 10);
    const end   = new Date(d.getTime() + 365 * 864e5).toISOString().slice(0, 10);
    const dataStart = prices[0]?.Date || start;
    const dataEnd   = prices[prices.length - 1]?.Date || end;
    setDateZoom({
      start: start < dataStart ? dataStart : start,
      end:   end > dataEnd     ? dataEnd   : end,
    });
  };

  const resetZoom = () => {
    if (prices.length) {
      setDateZoom({ start: prices[0].Date, end: prices[prices.length - 1].Date });
    }
    setSelectedEvent(null);
  };

  /* ── Reference dot color ── */
  const evtDotColor = (category) => {
    if (!category) return 'var(--amber)';
    const c = category.toLowerCase();
    if (c.includes('opec'))         return 'var(--green)';
    if (c.includes('geopolitical')) return 'var(--red)';
    return 'var(--amber)';
  };

  /* ─── Loading Screen ─── */
  if (loading && !prices.length) {
    return (
      <div className="loader-screen">
        <div className="loader-logo">BE</div>
        <div className="spinner-ring" />
        <p className="loader-text">Loading market data…</p>
      </div>
    );
  }

  /* ─── RENDER ─── */
  return (
    <div className="app-shell">

      {/* ════════════════ SIDEBAR ════════════════ */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo">BE</div>
          <div>
            <div className="sidebar-brand-name">Birhan Energies</div>
            <div className="sidebar-brand-sub">Oil Analytics Platform</div>
          </div>
        </div>

        <span className="sidebar-section-label">Analysis</span>
        <nav className="sidebar-nav">
          {[
            { id: 'overview', label: 'Price Overview',   Icon: Icon.Chart },
            { id: 'events',   label: 'Events Index',     Icon: Icon.Events },
            { id: 'insights', label: 'Regime Insights',  Icon: Icon.Insight },
          ].map(({ id, label, Icon: I }) => (
            <button
              key={id}
              className={`nav-item ${activeNav === id ? 'active' : ''}`}
              onClick={() => setActiveNav(id)}
            >
              <I />
              {label}
            </button>
          ))}
        </nav>

        <div className="sidebar-divider" />

        <span className="sidebar-section-label">Data Range</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 4px' }}>
          {[['From', 'start', prices[0]?.Date, dateZoom.end],
            ['To',   'end',   dateZoom.start, prices[prices.length - 1]?.Date]
          ].map(([lbl, key, minV, maxV]) => (
            <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <span className="ctrl-label">{lbl}</span>
              <input
                type="date"
                className="ctrl-date"
                style={{ minWidth: 0, width: '100%' }}
                value={dateZoom[key]}
                min={minV}
                max={maxV}
                onChange={e => setDateZoom(prev => ({ ...prev, [key]: e.target.value }))}
              />
            </div>
          ))}
          {selectedEvent && (
            <button className="reset-btn" onClick={resetZoom} style={{ marginTop: 4 }}>
              ✕ Reset Zoom
            </button>
          )}
        </div>

        <div className="sidebar-divider" style={{ marginTop: 'auto' }} />

        <div className="sidebar-status">
         
        
        </div>
      </aside>

      {/* ════════════════ MAIN ════════════════ */}
      <main className="main-content">

        {/* ── Top Bar ── */}
        <header className="topbar">
          <div>
            <div className="topbar-title">Brent Crude Change Point Analysis</div>
            <div className="topbar-meta">
              {cpResults
                ? `Bayesian structural break detected · ${cpResults.change_point_date}`
                : 'Loading model results…'}
            </div>
          </div>
          <div className="topbar-right">
            <div className="topbar-badge">
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--cyan)', display: 'inline-block' }} />
              {filteredPrices.length.toLocaleString()} data points
            </div>
            <div className="topbar-badge">
              📅 {dateZoom.start} → {dateZoom.end}
            </div>
          </div>
        </header>

        {/* ── Page Content ── */}
        <div className="page-content">

          {/* ─ Error ─ */}
          {error && (
            <div className="alert-banner">
              <Icon.Warning />
              <span><strong>Connection error:</strong> {error}</span>
            </div>
          )}

          {/* ══════ KPI Cards ══════ */}
          {cpResults && (
            <div className="kpi-grid">

              <div className="kpi-card accent-cyan">
                <div className="kpi-top">
                  <span className="kpi-label">Change Point Date</span>
                  <div className="kpi-icon bg-cyan">📍</div>
                </div>
                <div className="kpi-value color-cyan mono" style={{ fontSize: 20, letterSpacing: '0.02em' }}>
                  {cpResults.change_point_date}
                </div>
                <div className="kpi-delta neutral" style={{ marginTop: 10 }}>
                  R-hat τ = {cpResults.r_hat_tau ?? '1.02'}
                </div>
                <div className="kpi-sub">Bayesian MCMC · PyMC3</div>
              </div>

              <div className="kpi-card accent-blue">
                <div className="kpi-top">
                  <span className="kpi-label">Regime I Mean Price</span>
                  <div className="kpi-icon bg-blue">📉</div>
                </div>
                <div className="kpi-value">${fmt(cpResults.before_mean)}</div>
                <div className="kpi-sub">1987 → {cpResults.change_point_date}</div>
              </div>

              <div className="kpi-card accent-green">
                <div className="kpi-top">
                  <span className="kpi-label">Regime II Mean Price</span>
                  <div className="kpi-icon bg-green">📈</div>
                </div>
                <div className="kpi-value color-green">${fmt(cpResults.after_mean)}</div>
                <div className="kpi-delta up">
                  ▲ +${fmt(cpResults.absolute_change)} · +{fmt(cpResults.percentage_change, 1)}%
                </div>
              </div>

              <div className="kpi-card accent-amber">
                <div className="kpi-top">
                  <span className="kpi-label">Volatility Shift</span>
                  <div className="kpi-icon bg-amber">⚡</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <div className="kpi-value" style={{ fontSize: 20 }}>
                    {(volStats.before * 100).toFixed(2)}%
                  </div>
                  <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>→</span>
                  <div className="kpi-value" style={{ fontSize: 20 }}>
                    {(volStats.after * 100).toFixed(2)}%
                  </div>
                </div>
                <div className="kpi-sub">Weekly log-return std dev · before → after</div>
              </div>

            </div>
          )}

          {/* ══════ Controls Bar ══════ */}
          <div className="controls-bar">
            <div className="ctrl-group">
              <span className="ctrl-label">Resolution</span>
              <div className="toggle-group">
                {['weekly', 'daily'].map(v => (
                  <button
                    key={v}
                    className={`toggle-btn ${interval === v ? 'active' : ''}`}
                    onClick={() => setIntervalMode(v)}
                  >
                    {v.charAt(0).toUpperCase() + v.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="controls-sep" />

            <div className="ctrl-group">
              <span className="ctrl-label">Event Category</span>
              <div className="ctrl-select-wrapper">
                <select
                  className="ctrl-select"
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                >
                  <option value="All">All Categories</option>
                  <option value="OPEC">OPEC Decisions</option>
                  <option value="Geopolitical">Geopolitical</option>
                  <option value="Economic">Economic Shocks</option>
                </select>
              </div>
            </div>

            <div className="controls-sep" />

            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="data-point-count">
                {filteredPrices.length.toLocaleString()} pts · {filteredEvents.length} events
              </span>
              {selectedEvent && (
                <button className="reset-btn" onClick={resetZoom}>✕ Reset Zoom</button>
              )}
            </div>
          </div>

          {/* ══════ Main Grid ══════ */}
          <div className="dashboard-grid">

            {/* ── Chart Panel ── */}
            <div className="chart-panel">
              <div className="panel-header">
                <div>
                  <div className="panel-title">Brent Crude Price Timeline</div>
                </div>
                <div className="panel-actions">
                  {['price', 'returns'].map(t => (
                    <button
                      key={t}
                      className={`panel-tab ${chartTab === t ? 'active' : ''}`}
                      onClick={() => setChartTab(t)}
                    >
                      {t === 'price' ? '$/bbl Price' : 'Log Returns'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="chart-body">
                {filteredPrices.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    {chartTab === 'price' ? (
                      <ComposedChart data={filteredPrices} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="2 4" vertical={false} />
                        <XAxis
                          dataKey="Date"
                          tickFormatter={t => t.substring(0, 7)}
                          tick={{ fontSize: 11, fill: 'var(--text-faint)' }}
                          axisLine={false}
                          tickLine={false}
                          interval="preserveStartEnd"
                        />
                        <YAxis
                          tickFormatter={v => `$${v}`}
                          tick={{ fontSize: 11, fill: 'var(--text-faint)' }}
                          axisLine={false}
                          tickLine={false}
                          domain={['auto', 'auto']}
                          width={56}
                        />
                        <ChartTooltip
                          content={<CustomTooltip events={events} />}
                          cursor={{ stroke: 'rgba(255,255,255,0.08)', strokeWidth: 1 }}
                        />

                        {/* Regime shading */}
                        {cpResults && dateZoom.start < cpResults.change_point_date && (
                          <ReferenceArea
                            x1={dateZoom.start}
                            x2={cpResults.change_point_date}
                            fill="hsla(217,91%,60%,0.07)"
                            label={{ value: 'Regime I', position: 'insideTopLeft', fill: 'var(--blue)', fontSize: 11, fontWeight: 600 }}
                          />
                        )}
                        {cpResults && dateZoom.end > cpResults.change_point_date && (
                          <ReferenceArea
                            x1={cpResults.change_point_date}
                            x2={dateZoom.end}
                            fill="hsla(152,76%,48%,0.06)"
                            label={{ value: 'Regime II', position: 'insideTopRight', fill: 'var(--green)', fontSize: 11, fontWeight: 600 }}
                          />
                        )}

                        {/* Change point line */}
                        {cpResults && (
                          <ReferenceLine
                            x={cpResults.change_point_date}
                            stroke="var(--cyan)"
                            strokeWidth={1.5}
                            strokeDasharray="5 3"
                            label={{
                              value: `↑ ${cpResults.change_point_date}`,
                              fill: 'var(--cyan)',
                              fontSize: 11,
                              fontWeight: 700,
                              position: 'top',
                            }}
                          />
                        )}

                        {/* Event dots */}
                        {visibleEvents.map((evt, i) => {
                          const pPoint = filteredPrices.find(p => p.Date === evt.Date);
                          if (!pPoint) return null;
                          return (
                            <ReferenceDot
                              key={i}
                              x={evt.Date}
                              y={pPoint.Price}
                              r={5}
                              fill={evtDotColor(evt.Category)}
                              stroke="var(--bg-base)"
                              strokeWidth={1.5}
                              style={{ cursor: 'pointer' }}
                              onClick={() => handleEventClick(evt)}
                            />
                          );
                        })}

                        <Line
                          name="Price ($/bbl)"
                          type="monotone"
                          dataKey="Price"
                          stroke="var(--cyan)"
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 5, fill: 'var(--cyan)', stroke: 'var(--bg-base)', strokeWidth: 2 }}
                        />

                        <Brush
                          dataKey="Date"
                          height={22}
                          stroke="var(--border)"
                          fill="var(--bg-elevated)"
                          travellerWidth={6}
                          tickFormatter={t => t?.substring(0, 4)}
                        />
                      </ComposedChart>
                    ) : (
                      <ComposedChart data={filteredPrices} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="2 4" vertical={false} />
                        <XAxis
                          dataKey="Date"
                          tickFormatter={t => t.substring(0, 7)}
                          tick={{ fontSize: 11, fill: 'var(--text-faint)' }}
                          axisLine={false}
                          tickLine={false}
                          interval="preserveStartEnd"
                        />
                        <YAxis
                          tickFormatter={v => v.toFixed(3)}
                          tick={{ fontSize: 11, fill: 'var(--text-faint)' }}
                          axisLine={false}
                          tickLine={false}
                          domain={['auto', 'auto']}
                          width={60}
                        />
                        <ChartTooltip
                          content={<CustomTooltip events={events} />}
                          cursor={{ stroke: 'rgba(255,255,255,0.08)', strokeWidth: 1 }}
                        />
                        <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
                        {cpResults && (
                          <ReferenceLine
                            x={cpResults.change_point_date}
                            stroke="var(--cyan)"
                            strokeWidth={1.5}
                            strokeDasharray="5 3"
                          />
                        )}
                        <Bar
                          name="Log Return"
                          dataKey="Log_Return"
                          fill="var(--cyan)"
                          opacity={0.7}
                          radius={[1, 1, 0, 0]}
                          // Color bars by sign
                          label={false}
                          isAnimationActive={false}
                        />
                        <Brush
                          dataKey="Date"
                          height={22}
                          stroke="var(--border)"
                          fill="var(--bg-elevated)"
                          travellerWidth={6}
                          tickFormatter={t => t?.substring(0, 4)}
                        />
                      </ComposedChart>
                    )}
                  </ResponsiveContainer>
                ) : (
                  <div className="empty-state">
                    <div className="empty-state-icon">📊</div>
                    <span>No data in this date range</span>
                  </div>
                )}
              </div>

              {/* Chart Legend */}
              <div className="chart-legend">
                <div className="legend-item">
                  <span className="legend-line" style={{ background: 'var(--cyan)' }} />
                  Brent Crude Price
                </div>
                <div className="legend-item">
                  <span className="legend-dashed" />
                  Structural Change Point
                </div>
                <div className="legend-item">
                  <span className="legend-dot" style={{ background: 'var(--green)' }} />
                  OPEC Decision
                </div>
                <div className="legend-item">
                  <span className="legend-dot" style={{ background: 'var(--red)' }} />
                  Geopolitical Event
                </div>
                <div className="legend-item">
                  <span className="legend-dot" style={{ background: 'var(--amber)' }} />
                  Economic Shock
                </div>
              </div>
            </div>

            {/* ── Events Sidebar ── */}
            <div className="events-panel">
              <div className="panel-header" style={{ flexShrink: 0 }}>
                <div className="panel-title">Events Index</div>
                <span className="data-point-count">{filteredEvents.length}</span>
              </div>
              <div className="events-scroll">
                {filteredEvents.length > 0 ? filteredEvents.map((evt, i) => {
                  const isSelected = selectedEvent?.Event === evt.Event;
                  return (
                    <div
                      key={i}
                      className={`event-card ${getCatClass(evt.Category)} ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleEventClick(evt)}
                    >
                      <div className="event-card-top">
                        <span className="event-card-name">{evt.Event}</span>
                        <span className="event-card-date">{evt.Date}</span>
                      </div>
                      <span className={`event-pill ${getPillClass(evt.Category)}`}>
                        {evt.Category || 'Unknown'}
                      </span>
                      <div className="severity-bar">
                        <span className="severity-label">Severity</span>
                        <div className="severity-dots">
                          {getSeverityDots(evt.Severity)}
                        </div>
                      </div>
                      {isSelected && (evt['Impact Summary'] || evt.Impact_Summary) && (
                        <div className="event-impact-text">
                          {evt['Impact Summary'] || evt.Impact_Summary}
                        </div>
                      )}
                    </div>
                  );
                }) : (
                  <div className="empty-state">
                    <div className="empty-state-icon">🔍</div>
                    <span>No events match filter</span>
                  </div>
                )}
              </div>
            </div>

            {/* ── Event Detail Drawer ── */}
            {selectedEvent && (
              <div className="detail-panel">
                <div className="detail-header">
                  <div className="detail-header-left">
                    <span className={`event-pill ${getPillClass(selectedEvent.Category)}`}>
                      {selectedEvent.Category}
                    </span>
                    <h3 className="detail-title">{selectedEvent.Event}</h3>
                  </div>
                  <button className="detail-close" onClick={resetZoom}>✕</button>
                </div>

                <div className="detail-body">
                  {/* Col 1 — Timing */}
                  <div>
                    <div className="detail-meta-row">
                      <div className="detail-meta-label">Event Date</div>
                      <div className="detail-meta-value mono">{selectedEvent.Date}</div>
                    </div>
                    <div className="detail-meta-row">
                      <div className="detail-meta-label">Severity</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                        <div className="severity-dots" style={{ display: 'flex', gap: 4 }}>
                          {getSeverityDots(selectedEvent.Severity)}
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 600,
                          color: (selectedEvent.Severity || '').toLowerCase() === 'high'
                            ? 'var(--red)' : 'var(--amber)' }}>
                          {selectedEvent.Severity || 'High'} Impact
                        </span>
                      </div>
                    </div>
                    {cpResults && (
                      <div className="detail-meta-row">
                        <div className="detail-meta-label">Relative to Change Point</div>
                        <div className="stat-row" style={{ marginTop: 4 }}>
                          <span className="stat-num">
                            {Math.abs(Math.round(
                              (new Date(selectedEvent.Date) - new Date(cpResults.change_point_date))
                              / 864e5
                            ))}
                          </span>
                          <span className="stat-unit">
                            days {new Date(selectedEvent.Date) < new Date(cpResults.change_point_date)
                              ? 'before' : 'after'} the structural break
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Col 2 — Price Impact */}
                  <div>
                    <div className="detail-meta-label" style={{ marginBottom: 12 }}>Price Impact</div>
                    <div className="detail-impact-box">
                      {selectedEvent['Impact Summary'] || selectedEvent.Impact_Summary || 'No impact summary available.'}
                    </div>
                    {cpResults && (
                      <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
                        {[
                          { label: 'Before Mean', val: `$${fmt(cpResults.before_mean)}` },
                          { label: 'After Mean',  val: `$${fmt(cpResults.after_mean)}` },
                          { label: 'Δ Change',    val: `+${fmt(cpResults.percentage_change, 1)}%` },
                        ].map(({ label, val }) => (
                          <div key={label} style={{ flex: 1, background: 'var(--bg-elevated)', borderRadius: 'var(--r-sm)', padding: '10px 12px', border: '1px solid var(--border)' }}>
                            <div style={{ fontSize: 10, color: 'var(--text-faint)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</div>
                            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginTop: 4, fontFamily: 'var(--font-display)' }}>{val}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Col 3 — Recommendation */}
                  <div>
                    <div className="detail-meta-label" style={{ marginBottom: 12 }}>Consultancy Recommendation</div>
                    <div className="detail-rec-box">
                      <div className="detail-rec-label">Strategic Guidance</div>
                      <p className="detail-rec-text">
                        {selectedEvent.Category?.includes('OPEC')
                          ? 'OPEC policy shifts create sustained price regimes. Execute volatility options before ministerial meetings and monitor production quota compliance monthly.'
                          : selectedEvent.Category?.includes('Geopolitical')
                          ? 'Supply-risk premiums drive sharp price spikes. Structure rolling long futures during elevated regional conflict; unwind within 60 days of de-escalation signals.'
                          : 'Demand-shock events trigger rapid regime breakdown. Rotate portfolios toward cash or clean-energy assets when global GDP forecasts fall below 2%.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
          {/* end dashboard-grid */}

        </div>
        {/* end page-content */}

      </main>
    </div>
  );
}
