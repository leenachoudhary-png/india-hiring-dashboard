import React, { useState, useEffect } from 'react';

export default function IndiaHiringDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Get API credentials from environment variables
  const SHEET_FILE_ID = process.env.NEXT_PUBLIC_SHEET_FILE_ID;
  const DRIVE_API_KEY = process.env.NEXT_PUBLIC_DRIVE_API_KEY;

  useEffect(() => {
    if (SHEET_FILE_ID && DRIVE_API_KEY) {
      fetchLiveData();
      // Auto-refresh every 4 hours
      const interval = setInterval(fetchLiveData, 4 * 60 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [SHEET_FILE_ID, DRIVE_API_KEY]);

  const fetchLiveData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${SHEET_FILE_ID}?alt=media&key=${DRIVE_API_KEY}`
      );

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const liveData = await response.json();
      setData(liveData);
      setLastUpdated(new Date(liveData.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
    } catch (err) {
      setError(err.message);
      console.error('Data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!SHEET_FILE_ID || !DRIVE_API_KEY) {
    return (
      <div style={{ padding: '2rem', backgroundColor: 'white', fontFamily: 'var(--font-sans)' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem', backgroundColor: '#FFF5E6', borderRadius: '8px', border: '1px solid #FFD699' }}>
          <h2 style={{ margin: '0 0 1rem', color: '#B87100', fontSize: '16px', fontWeight: 500 }}>⚙️ Configuration Required</h2>
          <p style={{ margin: 0, fontSize: '14px', color: '#333', lineHeight: 1.6 }}>
            Environment variables are missing. Please set:
          </p>
          <ul style={{ margin: '1rem 0', paddingLeft: '1.5rem', fontSize: '13px', color: '#333' }}>
            <li><code>NEXT_PUBLIC_SHEET_FILE_ID</code> - Your Google Sheet file ID</li>
            <li><code>NEXT_PUBLIC_DRIVE_API_KEY</code> - Your Google Drive API key</li>
          </ul>
          <p style={{ margin: '1rem 0 0', fontSize: '12px', color: '#666' }}>
            Add these in Vercel Dashboard → Settings → Environment Variables
          </p>
        </div>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)', fontFamily: 'var(--font-sans)' }}>
        <p>Loading India hiring data...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div style={{ padding: '2rem', backgroundColor: 'white', fontFamily: 'var(--font-sans)' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem', backgroundColor: '#FFE6E6', borderRadius: '8px', border: '1px solid #FF9999' }}>
          <h2 style={{ margin: '0 0 1rem', color: '#C41C1C', fontSize: '16px', fontWeight: 500 }}>⚠️ Error Loading Data</h2>
          <p style={{ margin: 0, fontSize: '13px', color: '#333' }}>{error}</p>
          <button
            onClick={fetchLiveData}
            style={{
              marginTop: '1rem',
              padding: '8px 16px',
              fontSize: '13px',
              backgroundColor: '#C41C1C',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!data) return <div style={{ padding: '2rem' }}>No data available</div>;

  const { summary, openRoles = [], hiredThisMonth = [] } = data;
  const monthlyTarget = 12; // Update based on your target
  const totalOpen = summary.totalOpen || 0;
  const actualHires = hiredThisMonth.length;
  const achievementPercent = Math.round((actualHires / monthlyTarget) * 100);

  const deptData = Object.entries(summary.departments || {}).map(([name, stats]) => ({
    name,
    open: stats.open || 0,
    status: name === 'R&D' ? 'at-risk' : 'on-track',
  }));

  const recruiterData = Object.entries(summary.recruiters || {}).map(([name, stats]) => ({
    name,
    open: stats.open || 0,
    closed: stats.closed || 0,
    avgFill: Math.round(stats.avgDaysToFill || 0),
  }));

  const aging = {
    '0-15 days': openRoles.filter(r => r.daysOpen <= 15).length,
    '16-30 days': openRoles.filter(r => r.daysOpen > 15 && r.daysOpen <= 30).length,
    '31-60 days': openRoles.filter(r => r.daysOpen > 30 && r.daysOpen <= 60).length,
    '60+ days': openRoles.filter(r => r.daysOpen > 60).length,
  };

  const agingRoles = openRoles
    .filter(r => r.daysOpen > 60)
    .sort((a, b) => b.daysOpen - a.daysOpen)
    .slice(0, 3);

  return (
    <div style={{ padding: '1.5rem', fontFamily: 'var(--font-sans)', color: 'var(--color-text-primary)', backgroundColor: 'white', minHeight: '100vh' }}>
      {/* Last Updated */}
      <div style={{ fontSize: '11px', color: 'var(--color-text-secondary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span>Last updated: {lastUpdated} • Auto-refreshes every 4 hours</span>
        <button
          onClick={fetchLiveData}
          style={{
            padding: '4px 12px',
            fontSize: '11px',
            border: '0.5px solid var(--color-border-tertiary)',
            background: 'var(--color-background-secondary)',
            borderRadius: '4px',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          ↻ Refresh now
        </button>
      </div>

      {/* Executive Summary */}
      <div style={{ marginBottom: '2rem', padding: '1.25rem', backgroundColor: 'var(--color-background-secondary)', borderRadius: '12px', border: '0.5px solid var(--color-border-tertiary)' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 500, marginTop: 0, marginBottom: '0.75rem' }}>India hiring status</h2>
        <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.6 }}>
          <strong>{totalOpen} open positions</strong> across R&D, G&A, Marketing, and Sales. <strong>{achievementPercent}% of monthly target achieved</strong> ({actualHires} of {monthlyTarget} hires). 
          Average time-to-fill: <strong>{summary.avgDaysToFill || '—'} days</strong>. {agingRoles.length} roles require escalation (60+ days open).
        </p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '2rem' }}>
        <div style={{ backgroundColor: 'var(--color-background-secondary)', padding: '1rem', borderRadius: '8px', border: '0.5px solid var(--color-border-tertiary)' }}>
          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '0 0 8px' }}>Total open</p>
          <p style={{ fontSize: '24px', fontWeight: 500, margin: 0 }}>{totalOpen}</p>
        </div>
        <div style={{ backgroundColor: 'var(--color-background-secondary)', padding: '1rem', borderRadius: '8px', border: '0.5px solid var(--color-border-tertiary)' }}>
          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '0 0 8px' }}>Target achievement</p>
          <p style={{ fontSize: '24px', fontWeight: 500, margin: 0 }}>{achievementPercent}%</p>
          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '6px 0 0' }}>{actualHires} of {monthlyTarget}</p>
        </div>
        <div style={{ backgroundColor: 'var(--color-background-secondary)', padding: '1rem', borderRadius: '8px', border: '0.5px solid var(--color-border-tertiary)' }}>
          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '0 0 8px' }}>Avg days to fill</p>
          <p style={{ fontSize: '24px', fontWeight: 500, margin: 0 }}>{summary.avgDaysToFill || '—'}</p>
        </div>
        <div style={{ backgroundColor: 'var(--color-background-secondary)', padding: '1rem', borderRadius: '8px', border: '0.5px solid var(--color-border-tertiary)' }}>
          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '0 0 8px' }}>Aging roles</p>
          <p style={{ fontSize: '24px', fontWeight: 500, margin: 0 }}>{aging['60+ days']}</p>
          <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: '6px 0 0' }}>60+ days</p>
        </div>
      </div>

      {/* Department Performance */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 500, marginBottom: '1rem' }}>Department performance</h3>
        <div style={{ display: 'grid', gap: '8px' }}>
          {deptData.map((dept) => (
            <div
              key={dept.name}
              style={{
                padding: '1rem',
                backgroundColor: 'var(--color-background-primary)',
                border: '0.5px solid var(--color-border-tertiary)',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 500 }}>{dept.name}</span>
                  <span style={{ fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                    {dept.status === 'on-track' ? '✓ On Track' : '⚠ At Risk'}
                  </span>
                </div>
              </div>
              <div style={{ textAlign: 'right', fontSize: '12px' }}>
                <p style={{ margin: 0, fontWeight: 500 }}>{dept.open} open</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recruiter Performance */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 500, marginBottom: '1rem' }}>Recruiter performance</h3>
        <div style={{ display: 'grid', gap: '8px' }}>
          {recruiterData.map((rec, idx) => (
            <div
              key={idx}
              style={{
                padding: '0.875rem',
                backgroundColor: 'var(--color-background-primary)',
                border: '0.5px solid var(--color-border-tertiary)',
                borderRadius: '8px',
                fontSize: '13px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontWeight: 500 }}>{rec.name}</span>
                <span style={{ color: 'var(--color-text-secondary)' }}>{rec.closed} closed</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '12px', color: 'var(--color-text-secondary)' }}>
                <div>
                  <span style={{ display: 'block', fontWeight: 500, color: 'var(--color-text-primary)' }}>{rec.open}</span>
                  <span>Open</span>
                </div>
                <div>
                  <span style={{ display: 'block', fontWeight: 500, color: 'var(--color-text-primary)' }}>—</span>
                  <span>Offers</span>
                </div>
                <div>
                  <span style={{ display: 'block', fontWeight: 500, color: 'var(--color-text-primary)' }}>{rec.avgFill}d</span>
                  <span>Avg fill</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Aging Analysis */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ fontSize: '14px', fontWeight: 500, marginBottom: '1rem' }}>Aging analysis</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px' }}>
          {Object.entries(aging).map(([range, count]) => (
            <div key={range} style={{ padding: '1rem', backgroundColor: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: '8px' }}>
              <p style={{ fontSize: '12px', color: 'var(--color-text-secondary)', margin: 0, marginBottom: '8px' }}>{range}</p>
              <p style={{ fontSize: '20px', fontWeight: 500, margin: 0 }}>{count}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Roles Requiring Action */}
      {agingRoles.length > 0 && (
        <div style={{ padding: '1.25rem', backgroundColor: 'var(--color-background-secondary)', borderRadius: '12px', border: '0.5px solid var(--color-border-tertiary)' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 500, margin: '0 0 1rem' }}>⚠️ Roles requiring escalation (60+ days)</h3>
          <div style={{ display: 'grid', gap: '8px' }}>
            {agingRoles.map((role, idx) => (
              <div key={idx} style={{ padding: '0.75rem', backgroundColor: 'var(--color-background-primary)', borderLeft: '3px solid #D85A30', borderRadius: '4px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 500, fontSize: '13px' }}>{role.name}</p>
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--color-text-secondary)' }}>{role.stage}</p>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '12px', fontWeight: 500, color: '#D85A30' }}>
                    {role.daysOpen} days
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
