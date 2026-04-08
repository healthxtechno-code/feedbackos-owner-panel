import { useNavigate } from 'react-router-dom';
import { getInitials, stringToColor, copyToClipboard } from '../utils/helpers';
import { useToast } from '../context/ToastContext';

export default function HospitalCard({ hospital }) {
  const navigate = useNavigate();
  const toast = useToast();
  const { id, name, logoUrl, status, adminUsername, themeColor } = hospital;

  const isActive = status === 'active';
  const initials = getInitials(name);
  const avatarColor = themeColor || stringToColor(name);
  const adminUrl = `${window.location.origin}/admin/${id}`;

  const handleCopyLink = async (e) => {
    e.stopPropagation();
    const ok = await copyToClipboard(adminUrl);
    toast[ok ? 'success' : 'error'](ok ? 'Link copied to clipboard' : 'Failed to copy');
  };

  const handleOpenAdmin = (e) => {
    e.stopPropagation();
    window.open(adminUrl, '_blank');
  };

  return (
    <div
      style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--r2)', overflow: 'hidden',
        transition: 'all .25s', cursor: 'pointer',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
      onClick={() => navigate(`/hospitals/${id}`)}
    >
      {/* Top stripe */}
      <div style={{ height: 3, background: avatarColor }} />

      <div style={{ padding: '16px 18px 14px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        {/* Logo */}
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: logoUrl ? 'transparent' : avatarColor + '22',
          border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, flexShrink: 0, overflow: 'hidden',
        }}>
          {logoUrl
            ? <img src={logoUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; e.target.parentNode.innerHTML = `<span style="font-family:Syne,sans-serif;font-weight:800;font-size:16px;color:${avatarColor}">${initials}</span>`; }} />
            : <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 16, color: avatarColor }}>{initials}</span>
          }
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700,
            color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{name}</div>

          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2, fontFamily: 'DM Mono, monospace' }}>
            ID: {id}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span className={`status-dot ${isActive ? 'active' : 'inactive'}`} />
              <span style={{ fontSize: 12, fontWeight: 600, color: isActive ? 'var(--green)' : 'var(--text3)' }}>
                {isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            {adminUsername && (
              <span className="badge badge-blue" style={{ fontSize: 10 }}>
                @{adminUsername}
              </span>
            )}
          </div>
        </div>
      </div>

      <div style={{ height: 1, background: 'var(--border)' }} />

      <div style={{ padding: '10px 14px', display: 'flex', gap: 8 }}>
        <button
          className="btn btn-ghost"
          style={{ fontSize: 12, padding: '6px 12px', flex: 1 }}
          onClick={e => { e.stopPropagation(); navigate(`/hospitals/${id}`); }}
        >
          View Details
        </button>
        <button
          className="btn btn-ghost"
          style={{ fontSize: 12, padding: '6px 12px' }}
          onClick={handleOpenAdmin}
          title="Open Admin Panel"
        >
          ↗
        </button>
        <button
          className="btn btn-ghost"
          style={{ fontSize: 12, padding: '6px 12px' }}
          onClick={handleCopyLink}
          title="Copy Link"
        >
          ⎘
        </button>
      </div>
    </div>
  );
}
