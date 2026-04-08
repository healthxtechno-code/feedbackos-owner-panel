import { useEffect } from 'react';

export default function Modal({ isOpen, onClose, title, subtitle, children, footer, maxWidth = 560 }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,.7)',
        backdropFilter: 'blur(4px)',
        zIndex: 500,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r2)',
          padding: 28,
          width: '100%',
          maxWidth,
          boxShadow: 'var(--shadow2)',
          animation: 'fadeUp .25s ease',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: title ? 20 : 0 }}>
          {title && (
            <div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 18, fontWeight: 700, color: '#fff' }}>
                {title}
              </div>
              {subtitle && (
                <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 4 }}>{subtitle}</div>
              )}
            </div>
          )}
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text3)', fontSize: 18, padding: '2px 6px',
              borderRadius: 6, transition: 'color .2s', marginLeft: 'auto',
            }}
            onMouseEnter={e => e.target.style.color = 'var(--text)'}
            onMouseLeave={e => e.target.style.color = 'var(--text3)'}
          >
            ✕
          </button>
        </div>

        {children}

        {footer && (
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
