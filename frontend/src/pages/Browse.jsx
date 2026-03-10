import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './Browse.css';
import {
  ACADEMIC_YEARS,
  HOUSING_TYPES,
  ROOM_TYPES,
  MOVE_IN_TERMS,
  SLEEP_TIMES,
  THERMOSTAT_PREFERENCES,
  CLEANLINESS_LEVELS,
  GUEST_POLICIES,
  NOISE_TOLERANCES,
  OVERNIGHT_GUEST_OPTIONS,
  SOCIAL_ENERGIES,
  CONFLICT_STYLES,
} from '../constants/profileOptions';

const CARDS_PER_PAGE = 6;

function RoommateCard({ user, matchStatus, onSendRequest }) {
  const initials = user.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const tagColor = {
    'On-Campus Residence Halls': '#dbeafe',
    'University Apartments': '#ede9fe',
    'Off-Campus Apartments': '#dcfce7',
  };

  let matchBtn = null;
  if (matchStatus === 'accepted') {
    matchBtn = <button className="match-btn match-btn--matched" disabled>Matched</button>;
  } else if (matchStatus === 'pending_sent') {
    matchBtn = <button className="match-btn match-btn--pending" disabled>Request Sent</button>;
  } else if (matchStatus === 'pending_incoming') {
    matchBtn = <button className="match-btn match-btn--incoming" disabled>Incoming Request</button>;
  } else {
    matchBtn = (
      <button className="match-btn match-btn--send" onClick={() => onSendRequest(user.user_id)}>
        Send Match Request
      </button>
    );
  }

  return (
    <div className="roommate-card">
      <div className="card-header">
        <div className="card-avatar">{initials}</div>
        <div className="card-identity">
          <h3 className="card-name">{user.full_name}</h3>
          <span className="card-profile">{user.gender} &middot; {user.academic_year} &middot; {user.major}</span>
        </div>
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Compatibility</div>
          <div style={{ fontWeight: 700, color: '#1d4ed8' }}>{user.compatibility_score ?? 0}%</div>
        </div>
      </div>

      <div className="card-tags">
        <span className="card-tag" style={{ background: tagColor[user.housing_type] || '#f1f5f9' }}>
          {user.housing_type}
        </span>
        <span className="card-tag" style={{ background: '#fef9c3' }}>{user.room_type}</span>
        <span className="card-tag" style={{ background: '#fce7f3' }}>{user.move_in_term}</span>
      </div>

      <div className="card-prefs">
        <div className="card-pref-row"><span className="pref-icon">🌙</span><span>{user.sleep_time}</span></div>
        <div className="card-pref-row"><span className="pref-icon">☀️</span><span>{user.wake_time}</span></div>
        <div className="card-pref-row"><span className="pref-icon">🌡️</span><span>{user.thermostat_temp}</span></div>
        <div className="card-pref-row"><span className="pref-icon">🔊</span><span>{user.noise_tolerance}</span></div>
        <div className="card-pref-row"><span className="pref-icon">🚪</span><span>{user.guest_policy}</span></div>
        <div className="card-pref-row"><span className="pref-icon">🧼</span><span>{user.cleanliness_level}</span></div>
        <div className="card-pref-row"><span className="pref-icon">🛏️</span><span>{user.overnight_guest_frequency}</span></div>
        <div className="card-pref-row"><span className="pref-icon">🤝</span><span>{user.conflict_style}</span></div>
      </div>

      <div className="card-footer">
        <span className="card-contact-label">Contact</span>
        <span className="card-contact">{user.contact_info}</span>
      </div>

      <div className="card-match-action">
        {matchBtn}
      </div>
    </div>
  );
}

function Browse() {
  const navigate = useNavigate();
  const [roommates, setRoommates] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [matchStatuses, setMatchStatuses] = useState({});
  const [filters, setFilters] = useState({
    query: '',
    major: '',
    academic_year: '',
    housing_type: '',
    room_type: '',
    move_in_term: '',
    sleep_time: '',
    guest_policy: '',
    noise_tolerance: '',
    thermostat_temp: '',
    cleanliness_level: '',
    overnight_guest_frequency: '',
    social_energy: '',
    conflict_style: '',
  });

  const fetchMatchStatuses = useCallback(async (token, currentUserId) => {
    try {
      const res = await fetch('http://localhost:3001/api/matches/status', {
        headers: { Authorization: 'Bearer ' + token },
      });
      const data = await res.json();
      const statusMap = {};
      (data.requests || []).forEach((r) => {
        const otherId = r.requester_id === currentUserId ? r.recipient_id : r.requester_id;
        if (r.status === 'accepted') {
          statusMap[otherId] = 'accepted';
        } else if (r.status === 'pending') {
          statusMap[otherId] = r.requester_id === currentUserId ? 'pending_sent' : 'pending_incoming';
        }
      });
      setMatchStatuses(statusMap);
    } catch (err) {
      console.error('Failed to fetch match statuses:', err);
    }
  }, []);

  const fetchRoommates = useCallback(async (currentPage, currentFilters) => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }

    setLoading(true);
    const params = new URLSearchParams({ page: currentPage, limit: CARDS_PER_PAGE });
    Object.entries(currentFilters).forEach(([k, v]) => { if (v) params.append(k, v); });

    try {
      const res = await fetch('http://localhost:3001/api/users?' + params.toString(), {
        headers: { Authorization: 'Bearer ' + token },
      });
      const data = await res.json();
      setRoommates(data.users || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Failed to fetch roommates:', err);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    fetchRoommates(page, filters);
    fetchMatchStatuses(token, user.id);
  }, [page, filters, fetchRoommates, fetchMatchStatuses, navigate]);

  const handleSendRequest = async (recipientId) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:3001/api/matches/request/${recipientId}`, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token },
      });
      if (res.ok) {
        setMatchStatuses((prev) => ({ ...prev, [recipientId]: 'pending_sent' }));
      }
    } catch (err) {
      console.error('Failed to send match request:', err);
    }
  };

  const handleFilterChange = (key, value) => {
    setPage(1);
    setFilters((f) => ({ ...f, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      query: '',
      major: '',
      academic_year: '',
      housing_type: '',
      room_type: '',
      move_in_term: '',
      sleep_time: '',
      guest_policy: '',
      noise_tolerance: '',
      thermostat_temp: '',
      cleanliness_level: '',
      overnight_guest_frequency: '',
      social_energy: '',
      conflict_style: '',
    });
    setPage(1);
  };

  const hasActiveFilters = Object.values(filters).some(Boolean);

  return (
    <div className="browse-page">
      <header className="browse-page-header">
        <div className="browse-page-header-left">
          <div>
            <h1 className="browse-page-title">Find Your Roommate</h1>
            <p className="browse-page-subtitle">
              {loading ? 'Searching...' : total + ' Bruin' + (total !== 1 ? 's' : '') + ' looking for a roommate'}
            </p>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="filter-bar">
        <input
          className="filter-select"
          type="text"
          value={filters.query}
          onChange={(e) => handleFilterChange('query', e.target.value)}
          placeholder="Search name, major, room type..."
        />
        <input
          className="filter-select"
          type="text"
          value={filters.major}
          onChange={(e) => handleFilterChange('major', e.target.value)}
          placeholder="Filter by major"
        />
        <select className="filter-select" value={filters.academic_year}
          onChange={(e) => handleFilterChange('academic_year', e.target.value)}>
          <option value="">All Years</option>
          {ACADEMIC_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <select className="filter-select" value={filters.housing_type}
          onChange={(e) => handleFilterChange('housing_type', e.target.value)}>
          <option value="">All Housing</option>
          {HOUSING_TYPES.map((h) => <option key={h} value={h}>{h}</option>)}
        </select>
        <select className="filter-select" value={filters.room_type}
          onChange={(e) => handleFilterChange('room_type', e.target.value)}>
          <option value="">All Room Types</option>
          {ROOM_TYPES.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select className="filter-select" value={filters.move_in_term}
          onChange={(e) => handleFilterChange('move_in_term', e.target.value)}>
          <option value="">All Terms</option>
          {MOVE_IN_TERMS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select className="filter-select" value={filters.sleep_time}
          onChange={(e) => handleFilterChange('sleep_time', e.target.value)}>
          <option value="">All Bedtime Styles</option>
          {SLEEP_TIMES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select className="filter-select" value={filters.guest_policy}
          onChange={(e) => handleFilterChange('guest_policy', e.target.value)}>
          <option value="">All Guest Preferences</option>
          {GUEST_POLICIES.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <select className="filter-select" value={filters.noise_tolerance}
          onChange={(e) => handleFilterChange('noise_tolerance', e.target.value)}>
          <option value="">All Noise Levels</option>
          {NOISE_TOLERANCES.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <select className="filter-select" value={filters.thermostat_temp}
          onChange={(e) => handleFilterChange('thermostat_temp', e.target.value)}>
          <option value="">All Temperature Preferences</option>
          {THERMOSTAT_PREFERENCES.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <select className="filter-select" value={filters.cleanliness_level}
          onChange={(e) => handleFilterChange('cleanliness_level', e.target.value)}>
          <option value="">All Cleanliness Levels</option>
          {CLEANLINESS_LEVELS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="filter-select" value={filters.overnight_guest_frequency}
          onChange={(e) => handleFilterChange('overnight_guest_frequency', e.target.value)}>
          <option value="">All Overnight Guest Styles</option>
          {OVERNIGHT_GUEST_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <select className="filter-select" value={filters.social_energy}
          onChange={(e) => handleFilterChange('social_energy', e.target.value)}>
          <option value="">All Social Styles</option>
          {SOCIAL_ENERGIES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="filter-select" value={filters.conflict_style}
          onChange={(e) => handleFilterChange('conflict_style', e.target.value)}>
          <option value="">All Conflict Styles</option>
          {CONFLICT_STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        {hasActiveFilters && (
          <button className="btn btn-ghost filter-clear" onClick={clearFilters}>
            Clear filters
          </button>
        )}
      </div>

      {/* Cards */}
      {loading ? (
        <div className="browse-loading">
          <div className="loading-spinner" />
          <p>Finding Bruins...</p>
        </div>
      ) : roommates.length === 0 ? (
        <div className="browse-empty">
          <span className="empty-icon">🐻</span>
          <h3>No roommates found</h3>
          <p>Try adjusting your filters or check back later.</p>
        </div>
      ) : (
        <>
          <div className="roommate-grid">
            {roommates.map((u) => (
              <RoommateCard
                key={u.user_id}
                user={u}
                matchStatus={matchStatuses[u.user_id] || null}
                onSendRequest={handleSendRequest}
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button className="pagination-btn"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}>
                &#8592;
              </button>
              <div className="pagination-pages">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button key={p}
                    className={'pagination-page' + (p === page ? ' active' : '')}
                    onClick={() => setPage(p)}>
                    {p}
                  </button>
                ))}
              </div>
              <button className="pagination-btn"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}>
                &#8594;
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Browse;
