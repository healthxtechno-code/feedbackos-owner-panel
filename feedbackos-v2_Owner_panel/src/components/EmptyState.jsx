export default function EmptyState({ icon = '📭', title, description, action }) {
  return (
    <div style={{
      textAlign: 'center', padding: '60px 20px',
      border: '2px dashed var(--border)',
      borderRadius: 'var(--r2)',
      background: 'var(--surface)',
    }}>
      <div style={{ fontSize: 48, marginBottom: 14 }}>{icon}</div>
      <div style={{
        fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700,
        color: '#fff', marginBottom: 8,
      }}>{title}</div>
      {description && (
        <div style={{ fontSize: 14, color: 'var(--text2)', maxWidth: 320, margin: '0 auto 20px' }}>
          {description}
        </div>
      )}
      {action}
    </div>
  );
}
