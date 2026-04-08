import { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import Topbar from '../components/Topbar';
import EmptyState from '../components/EmptyState';
import Spinner, { PageLoader } from '../components/Spinner';
import { logsAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { formatIST, downloadBlob } from '../utils/helpers';

const EVENT_TYPES = [
  { value: 'all', label: 'All Events' },
  { value: 'hospital_created', label: 'Hospital Created' },
  { value: 'hospital_updated', label: 'Hospital Updated' },
  { value: 'hospital_deleted', label: 'Hospital Deleted' },
  { value: 'status_changed', label: 'Status Changed' },
  { value: 'admin_login', label: 'Admin Login' },
  { value: 'link_generated', label: 'Link Generated' },
  { value: 'review_submitted', label: 'Review Submitted' },
];

const EVENT_COLORS = {
  hospital_created: '#10b981',
  hospital_updated: '#3b82f6',
  hospital_deleted: '#ef4444',
  status_changed: '#f59e0b',
  admin_login: '#8b5cf6',
  link_generated: '#06b6d4',
  review_submitted: '#ec4899',
  default: '#475569',
};

export default function ActivityLogsPage() {
  const { openSidebar } = useOutletContext();
  const toast = useToast();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [filters, setFilters] = useState({
    hospitalId: 'all',
    eventType: 'all',
    dateFrom: '',
    dateTo: '',
  });
  const [hospitals, setHospitals] = useState([]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        ...(filters.hospitalId !== 'all' ? { hospitalId: filters.hospitalId } : {}),
        ...(filters.eventType !== 'all' ? { eventType: filters.eventType } : {}),
        ...(filters.dateFrom ? { dateFrom: filters.dateFrom } : {}),
        ...(filters.dateTo ? { dateTo: filters.dateTo } : {}),
      };
      const data = await logsAPI.getAll(params);
      setLogs(Array.isArray(data) ? data : data.logs || []);
    } catch (err) {
      toast.error('Failed to load logs: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const blob = await logsAPI.exportPDF(filters);
      downloadBlob(blob, `feedbackos-logs-${new Date().toISOString().slice(0,10)}.pdf`);
      toast.success('PDF exported successfully');
    } catch (err) {
      toast.error('Failed to export PDF: ' + err.message);
    } finally {
      setExporting(false);
    }
  };

  const setFilter = (k, v) => setFilters(p => ({ ...p, [k]: v }));

  return (
    <div>
      <Topbar
        title="Activity Logs"
        subtitle={`${logs.length} events`}
        onMenuClick={openSidebar}
        actions={
          <button className="btn btn-ghost" onClick={handleExportPDF} disabled={exporting}>
            {exporting ? <><Spinner size={14} /> Exporting...</> : '⬇ Export PDF'}
          </button>
        }
      />

      <div style={{ padding: 28, maxWidth: 1100 }}>
        {/* Filters */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--r2)', padding: 16, marginBottom: 20,
          display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end',
        }}>
          <div style={{ flex: '1 1 160px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 6 }}>
              Hospital
            </div>
            <select className="field-input" value={filters.hospitalId} onChange={e => setFilter('hospitalId', e.target.value)}>
              <option value="all">All Hospitals</option>
              {hospitals.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          </div>

          <div style={{ flex: '1 1 160px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 6 }}>
              Event Type
            </div>
            <select className="field-input" value={filters.eventType} onChange={e => setFilter('eventType', e.target.value)}>
              {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div style={{ flex: '1 1 140px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 6 }}>
              From Date
            </div>
            <input type="date" className="field-input" value={filters.dateFrom} onChange={e => setFilter('dateFrom', e.target.value)} />
          </div>

          <div style={{ flex: '1 1 140px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 6 }}>
              To Date
            </div>
            <input type="date" className="field-input" value={filters.dateTo} onChange={e => setFilter('dateTo', e.target.value)} />
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost" onClick={fetchLogs} style={{ fontSize: 13 }}>↻ Apply</button>
            <button className="btn btn-ghost" onClick={() => setFilters({ hospitalId: 'all', eventType: 'all', dateFrom: '', dateTo: '' })} style={{ fontSize: 13 }}>✕ Clear</button>
          </div>
        </div>

        {/* Log list */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 56, borderRadius: 10 }} />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <EmptyState
            icon="📋"
            title="No logs found"
            description="No activity logs match your current filters."
          />
        ) : (
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--r2)', overflow: 'hidden',
          }}>
            {/* Header */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 180px',
              padding: '10px 16px',
              fontSize: 10, fontWeight: 700, color: 'var(--text3)',
              textTransform: 'uppercase', letterSpacing: '.6px',
              borderBottom: '1px solid var(--border)',
            }}>
              <span>Event</span>
              <span>Hospital</span>
              <span>Actor</span>
              <span>Timestamp (IST)</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {logs.map((log, i) => (
                <LogRow key={log.id || i} log={log} isLast={i === logs.length - 1} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LogRow({ log, isLast }) {
  const color = EVENT_COLORS[log.eventType] || EVENT_COLORS.default;
  const label = EVENT_TYPES.find(t => t.value === log.eventType)?.label || log.eventType || 'Event';

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 180px',
      padding: '12px 16px',
      borderBottom: isLast ? 'none' : '1px solid var(--border)',
      transition: 'background .15s',
      alignItems: 'center',
    }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{label}</span>
      </div>
      <span style={{ fontSize: 12, color: 'var(--text2)', fontFamily: 'DM Mono, monospace' }}>
        {log.hospitalId || log.hospital || '—'}
      </span>
      <span style={{ fontSize: 12, color: 'var(--text2)' }}>
        {log.actor || '—'}
      </span>
      <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'DM Mono, monospace' }}>
        {formatIST(log.timestamp || log.createdAt)}
      </span>
    </div>
  );
}
