import { useNavigate } from 'react-router-dom';

export default function Topbar({ title, subtitle, actions, onMenuClick }) {
  return (
    <header style={{
      height: 58,
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      position: 'sticky', top: 0, zIndex: 30,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={onMenuClick}
          className="lg:hidden"
          style={{
            background: 'var(--surface2)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            width: 34, height: 34,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: 16, color: 'var(--text2)',
          }}
        >
          ☰
        </button>
        <div>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, color: 'var(--white)' }}>
            {title}
          </div>
          {subtitle && (
            <div style={{ fontSize: 12, color: 'var(--text3)' }}>{subtitle}</div>
          )}
        </div>
      </div>
      {actions && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {actions}
        </div>
      )}
    </header>
  );
}
