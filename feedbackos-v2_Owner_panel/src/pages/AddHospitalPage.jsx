import { useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import Topbar from '../components/Topbar';
import FormField, { Input, Textarea } from '../components/FormField';
import Modal from '../components/Modal';
import Spinner from '../components/Spinner';
import { hospitalsAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import { copyToClipboard } from '../utils/helpers';

const INIT = {
  name: '',
  logoUrl: '',
  hospitalImageUrl: '',
  themeColor: '#3b82f6',
  googleReviewLink: '',
  notes: '',
  adminUsername: '',
  adminPassword: '',
};

export default function AddHospitalPage() {
  const { openSidebar } = useOutletContext();
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState(INIT);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [success, setSuccess] = useState(null); // { hospitalId, adminUrl }

  const set = (k, v) => {
    setForm(p => ({ ...p, [k]: v }));
    if (errors[k]) setErrors(p => ({ ...p, [k]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Hospital name is required';
    if (!form.googleReviewLink.trim()) e.googleReviewLink = 'Google Review link is required';
    if (!form.adminUsername.trim()) e.adminUsername = 'Admin username is required';
    if (!form.adminPassword) e.adminPassword = 'Admin password is required';
    else if (form.adminPassword.length < 8) e.adminPassword = 'Password must be at least 8 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const data = await hospitalsAPI.create(form);
      setSuccess({
        hospitalId: data.hospitalId || data.id,
        adminUrl: data.adminUrl || `${window.location.origin}/admin/${data.hospitalId || data.id}`,
      });
      setForm(INIT);
    } catch (err) {
      toast.error('Failed to create hospital: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Topbar
        title="Add Hospital"
        subtitle="Register a new hospital to the platform"
        onMenuClick={openSidebar}
        actions={
          <button className="btn btn-ghost" onClick={() => navigate('/hospitals')}>
            ← Back
          </button>
        }
      />

      <div style={{ padding: 28, maxWidth: 760 }}>
        <form onSubmit={handleSubmit}>
          {/* Hospital Info */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--r2)', padding: 28, marginBottom: 16,
          }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700, marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
              Hospital Information
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }} className="max-sm:grid-cols-1">
              <div style={{ gridColumn: '1 / -1' }}>
                <FormField label="Hospital Name" required error={errors.name}>
                  <Input placeholder="e.g. Apollo Hospitals" value={form.name} onChange={e => set('name', e.target.value)} />
                </FormField>
              </div>

              <FormField label="Logo URL" hint="URL to hospital logo image">
                <Input type="url" placeholder="https://..." value={form.logoUrl} onChange={e => set('logoUrl', e.target.value)} />
              </FormField>

              <FormField label="Hospital Image URL" hint="Used as admin login background">
                <Input type="url" placeholder="https://..." value={form.hospitalImageUrl} onChange={e => set('hospitalImageUrl', e.target.value)} />
              </FormField>

              <FormField label="Theme Color" hint="Applied to patient interface">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    type="color"
                    value={form.themeColor}
                    onChange={e => set('themeColor', e.target.value)}
                    style={{
                      width: 44, height: 42, borderRadius: 8, border: '1px solid var(--border)',
                      background: 'var(--surface2)', cursor: 'pointer', padding: 2,
                    }}
                  />
                  <Input
                    value={form.themeColor}
                    onChange={e => set('themeColor', e.target.value)}
                    placeholder="#3b82f6"
                    style={{ fontFamily: 'DM Mono, monospace' }}
                  />
                </div>
              </FormField>

              <FormField label="Google Review Link" required error={errors.googleReviewLink}>
                <Input type="url" placeholder="https://g.page/..." value={form.googleReviewLink} onChange={e => set('googleReviewLink', e.target.value)} />
              </FormField>

              <div style={{ gridColumn: '1 / -1' }}>
                <FormField label="Notes" hint="Optional internal notes">
                  <Textarea placeholder="Any relevant notes..." value={form.notes} onChange={e => set('notes', e.target.value)} />
                </FormField>
              </div>
            </div>
          </div>

          {/* Admin Credentials */}
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--r2)', padding: 28, marginBottom: 20,
          }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 15, fontWeight: 700, marginBottom: 4, paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
              Admin Account
            </div>
            <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20 }}>
              These credentials will be used by the hospital admin to access the admin panel.
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }} className="max-sm:grid-cols-1">
              <FormField label="Admin Username" required error={errors.adminUsername}>
                <Input
                  autoComplete="off"
                  placeholder="admin_username"
                  value={form.adminUsername}
                  onChange={e => set('adminUsername', e.target.value)}
                />
              </FormField>

              <FormField label="Admin Password" required error={errors.adminPassword}>
                <div style={{ position: 'relative' }}>
                  <Input
                    type={showPwd ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Min. 8 characters"
                    value={form.adminPassword}
                    onChange={e => set('adminPassword', e.target.value)}
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
              </FormField>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={() => navigate('/hospitals')}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><Spinner size={14} /> Creating...</> : '✚ Create Hospital'}
            </button>
          </div>
        </form>
      </div>

      {/* Success Modal */}
      <Modal
        isOpen={!!success}
        onClose={() => { setSuccess(null); navigate('/hospitals'); }}
        title="🎉 Hospital Created"
        subtitle="Share these details with the hospital admin"
      >
        {success && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <InfoBlock label="Hospital ID" value={success.hospitalId} mono />
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 8 }}>
                Admin Panel Link
              </div>
              <div style={{
                background: 'var(--surface2)', border: '1.5px solid var(--accent)',
                borderRadius: 'var(--r)', padding: '12px 16px',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: 'var(--accent2)', flex: 1, wordBreak: 'break-all' }}>
                  {success.adminUrl}
                </span>
                <button
                  className="btn btn-ghost"
                  style={{ padding: '6px 12px', fontSize: 12, flexShrink: 0 }}
                  onClick={async () => {
                    const ok = await copyToClipboard(success.adminUrl);
                    if (ok) toast.success('Link copied!');
                  }}
                >
                  ⎘ Copy
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => window.open(success.adminUrl, '_blank')}>
                ↗ Open Admin Panel
              </button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => { setSuccess(null); navigate('/hospitals'); }}>
                Done
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function InfoBlock({ label, value, mono }) {
  return (
    <div style={{ background: 'var(--surface2)', borderRadius: 'var(--r)', padding: '12px 16px' }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{
        fontSize: 14, fontWeight: 600, color: '#fff',
        fontFamily: mono ? 'DM Mono, monospace' : 'inherit',
        wordBreak: 'break-all',
      }}>
        {value}
      </div>
    </div>
  );
}
