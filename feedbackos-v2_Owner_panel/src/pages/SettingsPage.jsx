import { useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import Topbar from '../components/Topbar';
import FormField, { Input } from '../components/FormField';
import Modal from '../components/Modal';
import Spinner from '../components/Spinner';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';
import { settingsAPI } from '../services/api';
import { configureAPI } from '../services/api';
import { validatePassword, downloadBlob } from '../utils/helpers';

export default function SettingsPage() {
  const { openSidebar } = useOutletContext();
  const { user, updateProfile, getToken, logout } = useAuth();
  const { apiUrl, setApiUrl } = useSettings();
  const toast = useToast();
  const navigate = useNavigate();

  // API settings
  const [apiInput, setApiInput] = useState(apiUrl);
  const [apiSaving, setApiSaving] = useState(false);
  const [apiTesting, setApiTesting] = useState(false);
  const [apiStatus, setApiStatus] = useState(null); // 'ok' | 'fail' | null

  // Profile
  const [profile, setProfile] = useState({ username: user?.username || '', password: '', confirmPassword: '' });
  const [profileErrors, setProfileErrors] = useState({});
  const [profileLoading, setProfileLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  // Data management
  const [exportLoading, setExportLoading] = useState(false);
  const [clearModal, setClearModal] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);

  // ─── API Settings ────────────────────────────────────────
  const handleSaveApi = async () => {
    setApiSaving(true);
    try {
      const url = apiInput.trim().replace(/\/$/, '');
      setApiUrl(url);
      configureAPI(url, getToken);
      toast.success('API URL saved successfully');
    } catch (err) {
      toast.error('Failed to save: ' + err.message);
    } finally {
      setApiSaving(false);
    }
  };

  const handleTestApi = async () => {
    setApiTesting(true);
    setApiStatus(null);
    try {
      const res = await fetch(apiInput.trim() + '/health');
      setApiStatus(res.ok ? 'ok' : 'fail');
    } catch {
      setApiStatus('fail');
    } finally {
      setApiTesting(false);
    }
  };

  // ─── Profile ─────────────────────────────────────────────
  const validateProfile = () => {
    const e = {};
    if (!profile.username.trim()) e.username = 'Username is required';
    if (profile.password) {
      const { strong } = validatePassword(profile.password);
      if (!strong) e.password = 'Password too weak (min 8 chars, include upper, lower, digit)';
      if (profile.password !== profile.confirmPassword) e.confirmPassword = 'Passwords do not match';
    }
    setProfileErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!validateProfile()) return;
    setProfileLoading(true);
    try {
      const payload = { username: profile.username.trim() };
      if (profile.password) payload.password = profile.password;
      await updateProfile(payload);
      setProfile(p => ({ ...p, password: '', confirmPassword: '' }));
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error('Failed to update profile: ' + err.message);
    } finally {
      setProfileLoading(false);
    }
  };

  // ─── Data Management ──────────────────────────────────────
  const handleExport = async () => {
    setExportLoading(true);
    try {
      const blob = await settingsAPI.exportData();
      downloadBlob(blob, `feedbackos-export-${new Date().toISOString().slice(0,10)}.json`);
      toast.success('Data exported successfully');
    } catch (err) {
      toast.error('Export failed: ' + err.message);
    } finally {
      setExportLoading(false);
    }
  };

  const handleClearData = async () => {
    setClearLoading(true);
    try {
      await settingsAPI.clearData();
      toast.success('All data cleared');
      setClearModal(false);
    } catch (err) {
      toast.error('Clear failed: ' + err.message);
    } finally {
      setClearLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div>
      <Topbar title="Settings" subtitle="System configuration" onMenuClick={openSidebar} />

      <div style={{ padding: 28, maxWidth: 720 }}>

        {/* (A) Backend API */}
        <Section title="Backend API" icon="🔌" description="Configure the backend API endpoint for data integration">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <FormField label="API Base URL" hint="The base URL of your Google Apps Script or backend deployment">
              <Input
                type="url"
                placeholder="https://script.google.com/macros/s/..."
                value={apiInput}
                onChange={e => { setApiInput(e.target.value); setApiStatus(null); }}
              />
            </FormField>

            {apiStatus && (
              <div style={{
                padding: '10px 14px', borderRadius: 'var(--r)', fontSize: 13,
                background: apiStatus === 'ok' ? 'rgba(16,185,129,.1)' : 'rgba(239,68,68,.1)',
                border: `1px solid ${apiStatus === 'ok' ? 'rgba(16,185,129,.3)' : 'rgba(239,68,68,.3)'}`,
                color: apiStatus === 'ok' ? 'var(--green)' : 'var(--red)',
              }}>
                {apiStatus === 'ok' ? '✓ API is reachable' : '✗ API not reachable — check the URL'}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-ghost" onClick={handleTestApi} disabled={apiTesting || !apiInput.trim()} style={{ fontSize: 13 }}>
                {apiTesting ? <><Spinner size={13} /> Testing...</> : '⚡ Test Connection'}
              </button>
              <button className="btn btn-primary" onClick={handleSaveApi} disabled={apiSaving} style={{ fontSize: 13 }}>
                {apiSaving ? <><Spinner size={13} /> Saving...</> : '💾 Save'}
              </button>
            </div>
          </div>
        </Section>

        {/* (B) Owner Profile */}
        <Section title="Owner Profile" icon="👤" description="Update your account credentials securely">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <FormField label="Username" error={profileErrors.username}>
              <Input
                autoComplete="username"
                value={profile.username}
                onChange={e => setProfile(p => ({ ...p, username: e.target.value }))}
              />
            </FormField>

            <FormField label="New Password" hint="Leave blank to keep current password" error={profileErrors.password}>
              <div style={{ position: 'relative' }}>
                <Input
                  type={showPwd ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Enter new password..."
                  value={profile.password}
                  onChange={e => setProfile(p => ({ ...p, password: e.target.value }))}
                  style={{ paddingRight: 40 }}
                />
                <button type="button" onClick={() => setShowPwd(v => !v)} style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 14,
                }}>
                  {showPwd ? '🙈' : '👁'}
                </button>
              </div>
            </FormField>

            {profile.password && (
              <FormField label="Confirm Password" error={profileErrors.confirmPassword}>
                <Input
                  type="password"
                  autoComplete="new-password"
                  placeholder="Repeat new password"
                  value={profile.confirmPassword}
                  onChange={e => setProfile(p => ({ ...p, confirmPassword: e.target.value }))}
                />
              </FormField>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" onClick={handleSaveProfile} disabled={profileLoading} style={{ fontSize: 13 }}>
                {profileLoading ? <><Spinner size={13} /> Saving...</> : '💾 Save Profile'}
              </button>
              <button className="btn btn-danger" onClick={handleLogout} style={{ fontSize: 13 }}>
                ⏻ Logout
              </button>
            </div>
          </div>
        </Section>

        {/* (C) Data Management */}
        <Section title="Data Management" icon="🗄" description="Export or clear platform data">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{
              background: 'var(--surface2)', borderRadius: 'var(--r)', padding: '14px 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
            }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Export All Data</div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>Download all platform data as JSON</div>
              </div>
              <button className="btn btn-ghost" onClick={handleExport} disabled={exportLoading} style={{ fontSize: 13, flexShrink: 0 }}>
                {exportLoading ? <><Spinner size={13} /> Exporting...</> : '⬇ Export'}
              </button>
            </div>

            <div style={{
              background: 'rgba(239,68,68,.05)', border: '1px solid rgba(239,68,68,.2)',
              borderRadius: 'var(--r)', padding: '14px 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
            }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--red)' }}>Clear All Data</div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>Permanently delete all data. This cannot be undone.</div>
              </div>
              <button className="btn btn-danger" onClick={() => setClearModal(true)} style={{ fontSize: 13, flexShrink: 0 }}>
                🗑 Clear Data
              </button>
            </div>
          </div>
        </Section>
      </div>

      {/* Clear confirmation modal */}
      <Modal
        isOpen={clearModal}
        onClose={() => setClearModal(false)}
        title="Clear All Data"
        subtitle="This will permanently delete all hospitals, logs, and associated data. This action is irreversible."
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setClearModal(false)}>Cancel</button>
            <button className="btn btn-danger" onClick={handleClearData} disabled={clearLoading}>
              {clearLoading ? <><Spinner size={14} /> Clearing...</> : '🗑 Yes, Clear Everything'}
            </button>
          </>
        }
      >
        <div style={{
          background: 'rgba(239,68,68,.08)', borderRadius: 'var(--r)', padding: '12px 16px',
          fontSize: 13, color: 'var(--red)', marginBottom: 4,
        }}>
          ⚠ All data will be permanently deleted from the connected database.
        </div>
      </Modal>
    </div>
  );
}

function Section({ title, icon, description, children }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--r2)', padding: 24, marginBottom: 16,
    }}>
      <div style={{ marginBottom: 16, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: 16, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>{icon}</span> {title}
        </div>
        {description && (
          <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>{description}</div>
        )}
      </div>
      {children}
    </div>
  );
}
