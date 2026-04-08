import { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import Topbar from '../components/Topbar';
import Modal from '../components/Modal';
import Spinner, { PageLoader } from '../components/Spinner';
import { hospitalsAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { formatDateIST, copyToClipboard, getInitials, stringToColor } from '../utils/helpers';

export default function HospitalDetailPage() {
  const { id } = useParams();
  const { openSidebar } = useOutletContext();
  const navigate = useNavigate();
  const toast = useToast();

  const [hospital, setHospital] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const adminUrl = `${window.location.origin}/admin/${id}`;

  const fetchHospital = async () => {
    setLoading(true);
    try {
      const data = await hospitalsAPI.getOne(id);
      setHospital(data);
    } catch (err) {
      toast.error('Failed to load hospital: ' + err.message);
      navigate('/hospitals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHospital(); }, [id]);

  const handleToggleStatus = async () => {
    if (!hospital) return;
    const newStatus = hospital.status === 'active' ? 'inactive' : 'active';
    setStatusLoading(true);
    try {
      await hospitalsAPI.updateStatus(id, newStatus);
      setHospital(prev => ({ ...prev, status: newStatus }));
      toast.success(`Hospital ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
    } catch (err) {
      toast.error('Failed to update status: ' + err.message);
    } finally {
      setStatusLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      await hospitalsAPI.delete(id);
      toast.success('Hospital deleted successfully');
      navigate('/hospitals');
    } catch (err) {
      toast.error('Failed to delete hospital: ' + err.message);
      setDeleteLoading(false);
    }
  };

  if (loading) return (
    <div>
      <Topbar title="Hospital Detail" onMenuClick={openSidebar} />
      <PageLoader />
    </div>
  );

  if (!hospital) return null;

  const isActive = hospital.status === 'active';
  const avatarColor = hospital.themeColor || stringToColor(hospital.name || '');
  const initials = getInitials(hospital.name || '');

  return (
    <div>
      <Topbar
        title={hospital.name || 'Hospital Detail'}
        subtitle={`ID: ${id}`}
        onMenuClick={openSidebar}
        actions={
          <button className="btn btn-ghost" onClick={() => navigate('/hospitals')}>
            ← Back
          </button>
        }
      />

      <div style={{ padding: 28, maxWidth: 900 }}>
        {/* Header card */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--r2)', overflow: 'hidden', marginBottom: 16,
        }}>
          <div style={{ height: 4, background: avatarColor }} />
          <div style={{ padding: '24px 24px 20px', display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
            {/* Logo */}
            <div style={{
              width: 72, height: 72, borderRadius: 16,
              background: hospital.logoUrl ? 'transparent' : avatarColor + '22',
              border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, flexShrink: 0, overflow: 'hidden',
            }}>
              {hospital.logoUrl
                ? <img src={hospital.logoUrl} alt={hospital.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                : <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 24, color: avatarColor }}>{initials}</span>
              }
            </div>

            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 22, fontWeight: 800, color: '#fff' }}>
                {hospital.name}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'DM Mono, monospace', marginTop: 4 }}>
                {id}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span className={`status-dot ${isActive ? 'active' : 'inactive'}`} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: isActive ? 'var(--green)' : 'var(--text3)' }}>
                    {isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                {hospital.adminUsername && (
                  <span className="badge badge-blue">@{hospital.adminUsername}</span>
                )}
                <span style={{ fontSize: 12, color: 'var(--text3)' }}>
                  Created {formatDateIST(hospital.createdAt)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
              <button
                className={`btn ${isActive ? 'btn-danger' : 'btn-success'}`}
                style={{ fontSize: 13 }}
                onClick={handleToggleStatus}
                disabled={statusLoading}
              >
                {statusLoading ? <Spinner size={14} /> : isActive ? '⏸ Deactivate' : '▶ Activate'}
              </button>
              <button
                className="btn btn-ghost"
                style={{ fontSize: 13 }}
                onClick={() => window.open(adminUrl, '_blank')}
              >
                ↗ Open Admin
              </button>
              <button
                className="btn btn-ghost"
                style={{ fontSize: 13 }}
                onClick={async () => {
                  const ok = await copyToClipboard(adminUrl);
                  toast[ok ? 'success' : 'error'](ok ? 'Link copied!' : 'Copy failed');
                }}
              >
                ⎘ Copy Link
              </button>
            </div>
          </div>
        </div>

        {/* Details grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }} className="max-sm:grid-cols-1">
          <DetailItem label="Google Review Link">
            <a href={hospital.googleReviewLink} target="_blank" rel="noopener noreferrer"
              style={{ color: 'var(--accent2)', textDecoration: 'none', fontSize: 13, wordBreak: 'break-all' }}>
              {hospital.googleReviewLink || '—'}
            </a>
          </DetailItem>
          <DetailItem label="Theme Color">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 20, height: 20, borderRadius: 4, background: hospital.themeColor || avatarColor }} />
              <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 13 }}>{hospital.themeColor || '—'}</span>
            </div>
          </DetailItem>
          <DetailItem label="Admin Panel URL">
            <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: 'var(--text2)', wordBreak: 'break-all' }}>
              {adminUrl}
            </span>
          </DetailItem>
          <DetailItem label="Notes">
            <span style={{ fontSize: 13, color: 'var(--text2)' }}>{hospital.notes || '—'}</span>
          </DetailItem>
        </div>

        {/* Danger zone */}
        <div style={{
          background: 'rgba(239,68,68,.05)', border: '1px solid rgba(239,68,68,.2)',
          borderRadius: 'var(--r2)', padding: 20,
        }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 14, fontWeight: 700, color: 'var(--red)', marginBottom: 8 }}>
            ⚠ Danger Zone
          </div>
          <div style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 14 }}>
            Permanently delete this hospital and all associated data. This action cannot be undone.
          </div>
          <button className="btn btn-danger" onClick={() => setDeleteModal(true)}>
            🗑 Delete Hospital
          </button>
        </div>
      </div>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        title="Delete Hospital"
        subtitle={`Are you sure you want to delete "${hospital.name}"? This cannot be undone.`}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setDeleteModal(false)}>
              Cancel
            </button>
            <button className="btn btn-danger" onClick={handleDelete} disabled={deleteLoading}>
              {deleteLoading ? <><Spinner size={14} /> Deleting...</> : '🗑 Yes, Delete'}
            </button>
          </>
        }
      >
        <div style={{
          background: 'rgba(239,68,68,.08)', borderRadius: 'var(--r)', padding: '12px 16px',
          fontSize: 13, color: 'var(--red)',
        }}>
          Hospital ID: <span style={{ fontFamily: 'DM Mono, monospace' }}>{id}</span> will be permanently removed.
        </div>
      </Modal>
    </div>
  );
}

function DetailItem({ label, children }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--r)', padding: '14px 16px',
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 6 }}>
        {label}
      </div>
      {children}
    </div>
  );
}
