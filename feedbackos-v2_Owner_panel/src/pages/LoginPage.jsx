import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/Spinner';

export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.username.trim() || !form.password) {
      setError('Please enter your credentials.');
      return;
    }
    const result = await login(form.username.trim(), form.password);
    if (result.success) {
      navigate('/dashboard', { replace: true });
    } else {
      setError(result.error);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
      backgroundImage: `
        radial-gradient(ellipse at 20% 50%, rgba(59,130,246,.06) 0%, transparent 60%),
        radial-gradient(ellipse at 80% 20%, rgba(99,102,241,.06) 0%, transparent 60%)
      `,
    }}>
      <div style={{
        width: '100%', maxWidth: 420,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r2)',
        padding: 40,
        boxShadow: 'var(--shadow2)',
        animation: 'fadeUp .4s ease',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: 'var(--accent-g)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 800, color: '#fff',
            fontFamily: 'Syne, sans-serif',
          }}>F</div>
          <div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, color: '#fff' }}>
              Feedback<span style={{ color: 'var(--accent2)' }}>OS</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>Owner Control Panel</div>
          </div>
        </div>

        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 6 }}>
          Welcome back
        </div>
        <div style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 28 }}>
          Sign in to manage your hospital systems.
        </div>

        {/* Error */}
        {error && (
          <div style={{
            background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)',
            borderRadius: 'var(--r)', padding: '10px 14px',
            fontSize: 13, color: 'var(--red)', marginBottom: 16,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <label htmlFor="username" style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.6px' }}>
  Username
</label>
<input
  id="username"
  name="username"
  className="field-input"
  type="text"
  autoComplete="username"
  autoFocus
  value={form.username}
  onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
  disabled={isLoading}
/>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <label htmlFor="password" style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.6px' }}>
  Password
</label>
<div style={{ position: 'relative' }}>
  <input
    id="password"
    name="password"
    className="field-input"
    type={showPwd ? 'text' : 'password'}
    autoComplete="current-password"
    value={form.password}
    onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
    disabled={isLoading}
    style={{ paddingRight: 40 }}
  />
              <button
                type="button"
                onClick={() => setShowPwd(v => !v)}
                style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text3)', fontSize: 14,
                }}
              >
                {showPwd ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%', padding: 14, fontSize: 15, fontWeight: 700,
              borderRadius: 'var(--r)', background: 'var(--accent-g)',
              color: '#fff', border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', marginTop: 4,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: isLoading ? 0.7 : 1,
              transition: 'opacity .2s',
            }}
          >
            {isLoading ? <><Spinner size={16} /> Signing in...</> : 'Sign In'}
          </button>
        </form>

        <div style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center', marginTop: 20 }}>
          Secured by FeedbackOS · v2.0
        </div>
      </div>
    </div>
  );
}
