import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getInitials } from '../utils/helpers';

const NAV_ITEMS = [
  { label: 'Overview', to: '/dashboard', icon: '⬡', section: 'main' },
  { label: 'Hospitals', to: '/hospitals', icon: '🏥', section: 'main' },
  { label: 'Add Hospital', to: '/hospitals/add', icon: '✚', section: 'main' },
  { label: 'Activity Logs', to: '/logs', icon: '◎', section: 'monitoring' },
  { label: 'Settings', to: '/settings', icon: '⚙', section: 'system' },
];

const sections = {
  main: 'Platform',
  monitoring: 'Monitoring',
  system: 'System',
};

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const grouped = Object.entries(
    NAV_ITEMS.reduce((acc, item) => {
      (acc[item.section] = acc[item.section] || []).push(item);
      return acc;
    }, {})
  );

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        style={{
          width: 240,
          background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0, left: 0,
          height: '100vh',
          zIndex: 50,
          transform: isOpen ? 'none' : undefined,
          transition: 'transform .3s',
        }}
        className={!isOpen ? 'max-lg:-translate-x-full' : ''}
      >
        {/* Logo */}
        <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 9,
              background: 'var(--accent-g)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15, fontWeight: 800, color: '#fff',
              fontFamily: 'Syne, sans-serif',
              flexShrink: 0,
            }}>F</div>
            <div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, color: '#fff' }}>
                Feedback<span style={{ color: 'var(--accent2)' }}>OS</span>
              </div>
              <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 600, letterSpacing: '.5px' }}>
                OWNER PANEL v2
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
          {grouped.map(([section, items]) => (
            <div key={section}>
              <div style={{
                fontSize: 10, fontWeight: 700, color: 'var(--text3)',
                textTransform: 'uppercase', letterSpacing: 1,
                padding: '12px 12px 6px',
              }}>
                {sections[section]}
              </div>
              {items.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/hospitals'}
                  onClick={onClose}
                  style={({ isActive }) => ({
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 12px', borderRadius: 10, marginBottom: 2,
                    fontSize: 13.5, fontWeight: 500, textDecoration: 'none',
                    transition: 'all .2s',
                    background: isActive ? 'rgba(59,130,246,.15)' : 'transparent',
                    color: isActive ? 'var(--accent2)' : 'var(--text2)',
                  })}
                  className={({ isActive }) => isActive ? '' : 'hover:bg-surface2 hover:!text-white'}
                >
                  <span style={{ fontSize: 15, width: 20, textAlign: 'center' }}>{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer — user chip */}
        <div style={{ padding: '12px 10px', borderTop: '1px solid var(--border)' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px',
            background: 'var(--surface2)',
            borderRadius: 10,
            border: '1px solid var(--border)',
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: 'var(--accent-g)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 800, color: '#fff', flexShrink: 0,
            }}>
              {getInitials(user?.username || 'O')}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.username || 'Owner'}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text3)' }}>Super Admin</div>
            </div>
            <button
              onClick={handleLogout}
              title="Logout"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text3)', fontSize: 14, padding: 4,
                borderRadius: 6, transition: 'color .2s',
              }}
              onMouseEnter={e => e.target.style.color = 'var(--red)'}
              onMouseLeave={e => e.target.style.color = 'var(--text3)'}
            >
              ⏻
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
