import React from 'react';
import IndiaHiringDashboard from '../components/IndiaHiringDashboard';

export default function Home() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-background-tertiary)' }}>
      <head>
        <title>India Talent Acquisition Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="India hiring dashboard with real-time metrics from Google Sheets" />
      </head>
      <IndiaHiringDashboard />
    </div>
  );
}
