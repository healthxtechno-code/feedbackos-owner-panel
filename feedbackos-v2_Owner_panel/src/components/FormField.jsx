export default function FormField({ label, hint, error, required, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      {label && (
        <label style={{
          fontSize: 11, fontWeight: 700, color: 'var(--text2)',
          textTransform: 'uppercase', letterSpacing: '.6px',
        }}>
          {label}{required && <span style={{ color: 'var(--red)', marginLeft: 3 }}>*</span>}
        </label>
      )}
      {children}
      {hint && !error && (
        <span style={{ fontSize: 11, color: 'var(--text3)' }}>{hint}</span>
      )}
      {error && (
        <span style={{ fontSize: 11, color: 'var(--red)' }}>{error}</span>
      )}
    </div>
  );
}

export function Input({ style, ...props }) {
  return (
    <input
      className="field-input"
      style={style}
      {...props}
    />
  );
}

export function Textarea({ style, ...props }) {
  return (
    <textarea
      className="field-input"
      style={{ resize: 'vertical', minHeight: 80, ...style }}
      {...props}
    />
  );
}

export function Select({ style, children, ...props }) {
  return (
    <select
      className="field-input"
      style={{ cursor: 'pointer', ...style }}
      {...props}
    >
      {children}
    </select>
  );
}
