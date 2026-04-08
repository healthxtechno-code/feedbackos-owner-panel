import { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import Topbar from '../components/Topbar';
import HospitalCard from '../components/HospitalCard';
import EmptyState from '../components/EmptyState';
import { SkeletonCard } from '../components/Spinner';
import { hospitalsAPI } from '../services/api';
import { useToast } from '../context/ToastContext';

export default function HospitalsPage() {
  const { openSidebar } = useOutletContext();
  const navigate = useNavigate();
  const toast = useToast();

  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchHospitals = async () => {
    setLoading(true);
    try {
      const data = await hospitalsAPI.getAll();
      setHospitals(Array.isArray(data) ? data : data.hospitals || []);
    } catch (err) {
      toast.error('Failed to load hospitals: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHospitals(); }, []);

  const filtered = hospitals.filter(h => {
    const matchSearch = !search || h.name?.toLowerCase().includes(search.toLowerCase()) || h.id?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || h.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div>
      <Topbar
        title="Hospitals"
        subtitle={`${hospitals.length} total`}
        onMenuClick={openSidebar}
        actions={
          <button className="btn btn-primary" onClick={() => navigate('/hospitals/add')}>
            ✚ Add Hospital
          </button>
        }
      />

      <div style={{ padding: 28, maxWidth: 1200 }}>
        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', fontSize: 14 }}>🔍</span>
            <input
              className="field-input"
              style={{ paddingLeft: 36 }}
              placeholder="Search hospitals..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="field-input"
            style={{ width: 140 }}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button className="btn btn-ghost" onClick={fetchHospitals} style={{ fontSize: 13 }}>
            ↻ Refresh
          </button>
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="🏥"
            title={search ? 'No hospitals found' : 'No hospitals yet'}
            description={search ? `No results for "${search}". Try a different search term.` : 'Add your first hospital to get started.'}
            action={
              !search && (
                <button className="btn btn-primary" onClick={() => navigate('/hospitals/add')}>
                  ✚ Add Hospital
                </button>
              )
            }
          />
        ) : (
          <>
            <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 12 }}>
              Showing {filtered.length} of {hospitals.length} hospitals
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {filtered.map(h => <HospitalCard key={h.id} hospital={h} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
