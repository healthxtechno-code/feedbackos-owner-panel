import { formatNumber } from '../utils/helpers';

export default function KPICard({ icon, label, value, delta, color = 'var(--accent)', loading = false }) {
  if (loading) {
    return (
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--r2)', padding: 20, position: 'relative', overflow: 'hidden',
      }}>
        <div className="skeleton" style={{ width: 32, height: 32, borderRadius: 8, marginBottom: 12 }} />
        <div className="skeleton" style={{ width: '60%', height: 36, borderRadius: 6, marginBottom: 8 }} />
        <div className="skeleton" style={{ width: '40%', height: 14, borderRadius: 4 }} />
      </div>
    );
  }

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--r2)', padding: 20, position: 'relative', overflow: 'hidden',
      transition: 'border-color .2s, transform .2s',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}
    >
      {/* Glow */}
      <div style={{
        position: 'absolute', top: 0, right: 0,
        width: 80, height: 80, borderRadius: '50%',
        background: `radial-gradient(circle, ${color}20 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      <div style={{ fontSize: 22, marginBottom: 12 }}>{icon}</div>
      <div style={{
        fontFamily: 'Syne, sans-serif', fontSize: 32, fontWeight: 800,
        color: '#fff', lineHeight: 1,
      }}>
        {formatNumber(value ?? 0)}
      </div>
      <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>{label}</div>
      {delta !== undefined && (
        <div style={{
          fontSize: 12, fontWeight: 600, marginTop: 8,
          color: delta >= 0 ? 'var(--green)' : 'var(--red)',
        }}>
          {delta >= 0 ? '↑' : '↓'} {Math.abs(delta)}% vs last period
        </div>
      )}
    </div>
  );
}
