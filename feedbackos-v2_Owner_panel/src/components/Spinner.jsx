export default function Spinner({ size = 16, color = '#fff' }) {
  return (
    <span style={{
      display: 'inline-block',
      width: size, height: size,
      border: `2px solid rgba(255,255,255,.2)`,
      borderTopColor: color,
      borderRadius: '50%',
      animation: 'spin .7s linear infinite',
    }} />
  );
}

export function PageLoader() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: 300,
    }}>
      <div style={{ textAlign: 'center' }}>
        <Spinner size={32} color="var(--accent)" />
        <div style={{ marginTop: 12, fontSize: 13, color: 'var(--text3)' }}>Loading...</div>
      </div>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--r2)', padding: 20,
    }}>
      <div className="skeleton" style={{ height: 48, width: 48, borderRadius: 12, marginBottom: 14 }} />
      <div className="skeleton" style={{ height: 18, width: '70%', borderRadius: 6, marginBottom: 8 }} />
      <div className="skeleton" style={{ height: 14, width: '40%', borderRadius: 4, marginBottom: 16 }} />
      <div style={{ height: 1, background: 'var(--border)', marginBottom: 12 }} />
      <div style={{ display: 'flex', gap: 8 }}>
        <div className="skeleton" style={{ height: 32, flex: 1, borderRadius: 8 }} />
        <div className="skeleton" style={{ height: 32, width: 36, borderRadius: 8 }} />
        <div className="skeleton" style={{ height: 32, width: 36, borderRadius: 8 }} />
      </div>
    </div>
  );
}
