import { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import Topbar from '../components/Topbar';
import KPICard from '../components/KPICard';
import { dashboardAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { PageLoader } from '../components/Spinner';

const TIME_FILTERS = [
  { label: '24h', value: '24h' },
  { label: '7 Days', value: '7d' },
  { label: '1 Month', value: '1m' },
  { label: '3 Months', value: '3m' },
  { label: '6 Months', value: '6m' },
  { label: '1 Year', value: '1y' },
  { label: 'All Time', value: 'all' },
];

export default function DashboardPage() {
  const { openSidebar } = useOutletContext();
  const toast = useToast();

  const [timeRange, setTimeRange] = useState('7d');
  const [hospitalFilter, setHospitalFilter] = useState('all');
  const [stats, setStats] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const data = await dashboardAPI.getStats({ timeRange, hospitalId: hospitalFilter === 'all' ? undefined : hospitalFilter });
      setStats(data);
      setLastUpdated(new Date());
    } catch (err) {
      toast.error('Failed to load dashboard data: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [timeRange, hospitalFilter]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const kpiCards = [
    { icon: '🏥', label: 'Total Hospitals', value: stats?.totalHospitals, delta: stats?.hospitalsDelta, color: '#3b82f6' },
    { icon: '✅', label: 'Active Hospitals', value: stats?.activeHospitals, color: '#10b981' },
    { icon: '👥', label: 'Total Users', value: stats?.totalUsers, delta: stats?.usersDelta, color: '#8b5cf6' },
    { icon: '🔗', label: 'Links Generated', value: stats?.linksGenerated, delta: stats?.linksDelta, color: '#f59e0b' },
    { icon: '⭐', label: 'Google Reviews', value: stats?.googleReviews, delta: stats?.reviewsDelta, color: '#ec4899' },
  ];

  return (
    <div>
      <Topbar
        title="Dashboard"
        subtitle="Platform overview & analytics"
        onMenuClick={openSidebar}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {lastUpdated && (
              <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                Updated {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <button className="btn btn-ghost" style={{ fontSize: 12, padding: '6px 12px' }} onClick={fetchStats} disabled={loading}>
              ↻ Refresh
            </button>
          </div>
        }
      />

      <div style={{ padding: 28, maxWidth: 1200 }}>

        {/* Filters */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24,
          flexWrap: 'wrap',
        }}>
          {/* Time range */}
          <div style={{
            display: 'flex', gap: 4,
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--r)', padding: 4,
          }}>
            {TIME_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => setTimeRange(f.value)}
                style={{
                  padding: '5px 12px', borderRadius: 8, border: 'none',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'inherit', transition: 'all .15s',
                  background: timeRange === f.value ? 'var(--accent-g)' : 'transparent',
                  color: timeRange === f.value ? '#fff' : 'var(--text2)',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Hospital filter */}
          <select
            className="field-input"
            style={{ width: 'auto', minWidth: 160 }}
            value={hospitalFilter}
            onChange={e => setHospitalFilter(e.target.value)}
          >
            <option value="all">All Hospitals</option>
            {hospitals.map(h => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
        </div>

        {/* KPI Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 14, marginBottom: 28,
        }}>
          {kpiCards.map((card, i) => (
            <KPICard key={i} {...card} loading={loading} />
          ))}
        </div>

        {/* Activity summary */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}
          className="max-md:grid-cols-1"
        >
          {/* Hospital breakdown */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--r2)', padding: 20,
          }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700, marginBottom: 16 }}>
              Hospital Breakdown
            </div>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 40, borderRadius: 8 }} />)}
              </div>
            ) : stats ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <MetricRow label="Active" value={stats.activeHospitals} total={stats.totalHospitals} color="var(--green)" />
                <MetricRow label="Inactive" value={(stats.totalHospitals || 0) - (stats.activeHospitals || 0)} total={stats.totalHospitals} color="var(--text3)" />
              </div>
            ) : (
              <div style={{ color: 'var(--text3)', fontSize: 13 }}>No data available</div>
            )}
          </div>

          {/* Quick stats */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--r2)', padding: 20,
          }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700, marginBottom: 16 }}>
              Performance Snapshot
            </div>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 40, borderRadius: 8 }} />)}
              </div>
            ) : stats ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <StatRow icon="🔗" label="Avg links per hospital" value={stats.totalHospitals ? Math.round((stats.linksGenerated || 0) / stats.totalHospitals) : 0} />
                <StatRow icon="⭐" label="Avg reviews per hospital" value={stats.totalHospitals ? Math.round((stats.googleReviews || 0) / stats.totalHospitals) : 0} />
                <StatRow icon="👥" label="Avg users per hospital" value={stats.totalHospitals ? Math.round((stats.totalUsers || 0) / stats.totalHospitals) : 0} />
              </div>
            ) : (
              <div style={{ color: 'var(--text3)', fontSize: 13 }}>No data available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricRow({ label, value = 0, total = 0, color }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: 'var(--text2)' }}>{label}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color }}>{value} <span style={{ color: 'var(--text3)' }}>({pct}%)</span></span>
      </div>
      <div style={{ height: 6, background: 'var(--surface2)', borderRadius: 99 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 99, transition: 'width .5s' }} />
      </div>
    </div>
  );
}

function StatRow({ icon, label, value }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 14px', background: 'var(--surface2)',
      borderRadius: 10,
    }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <span style={{ fontSize: 13, color: 'var(--text2)', flex: 1 }}>{label}</span>
      <span style={{ fontSize: 15, fontWeight: 700, color: '#fff', fontFamily: 'Syne, sans-serif' }}>{value}</span>
    </div>
  );
}
