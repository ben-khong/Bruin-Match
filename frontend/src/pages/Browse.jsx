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

const EMPTY_FILTERS = {
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
};

function RoommateCard({ user, onInvite, matchStatus, onSendRequest }) {
  const initials = user.full_name
    ? user.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';

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

  const factors = user.matched_factors || [];

  return (
    <div className="roommate-card">
      <div className="card-titlebar">
        <div className="card-dots">
          <span className="dot dot-red" />
          <span className="dot dot-yellow" />
          <span className="dot dot-green" />
        </div>
        <span className="card-titlebar-name">{user.full_name}</span>
        <span className="card-titlebar-score">{user.compatibility_score ?? 0}%</span>
      </div>
      <div className="card-urlbar">
        <span className="urlbar-icon">🌐</span>
        <span className="card-urlbar-text">bruinmatch.ucla.edu/{user.full_name.toLowerCase().replace(/\s+/g, '-')}</span>
      </div>
      <div className="card-body">
        <div className="card-header">
          <div className="card-avatar">{initials}</div>
          <div className="card-identity">
            <h3 className="card-name">{user.full_name}</h3>
            <span className="card-profile">{user.gender} &middot; {user.academic_year} &middot; {user.major}</span>
          </div>
        </div>

        {factors.length > 0 && (
          <div className="card-why-match">
            <span className="why-match-label">Why this match: </span>
            <span className="why-match-text">
              {factors.slice(0, 3).join(' · ')}
              {factors.length > 3 && ` +${factors.length - 3} more`}
            </span>
          </div>
        )}

        <div className="card-tags">
          <span className="card-tag card-tag--housing">{user.housing_type}</span>
          <span className="card-tag card-tag--room">{user.room_type}</span>
          <span className="card-tag card-tag--term">{user.move_in_term}</span>
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

        <div className="card-footer-integrated">
          <div className="card-contact-line">
            <span className="card-contact-label">Contact:</span>
            <span className="card-contact">{user.contact_info}</span>
          </div>
          <div className="card-button-stack">
            <button className="btn btn-primary btn-full" onClick={() => onInvite(user.user_id)}>
              Invite to Group
            </button>
            {matchBtn}
          </div>
        </div>
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
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [myLedGroups, setMyLedGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [presets, setPresets] = useState([]);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [presetName, setPresetName] = useState('');

  const fetchMyGroups = useCallback(async () => {
    const token = localStorage.getItem("token");
    const userData = JSON.parse(localStorage.getItem("user") || '{}');
    const myId = userData.id || userData.userId;
    if (!token || !myId) return;
    try {
      const res = await fetch('http://localhost:3001/api/groups/my-groups', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        const led = data.filter(g => Number(g.leader_id) === Number(myId));
        setMyLedGroups(led);
        if (led.length > 0) setSelectedGroupId(led[0].id);
      }
    } catch (err) { console.error(err); }
  }, []);

  const fetchMatchStatuses = useCallback(async (token, currentUserId) => {
    try {
      const res = await fetch('http://localhost:3001/api/matches/status', {
        headers: { Authorization: 'Bearer ' + token },
      });
      const data = await res.json();
      const statusMap = {};
      (data.requests || []).forEach((r) => {
        const otherId = r.requester_id === currentUserId ? r.recipient_id : r.requester_id;
        if (r.status === 'accepted') statusMap[otherId] = 'accepted';
        else if (r.status === 'pending') {
          statusMap[otherId] = r.requester_id === currentUserId ? 'pending_sent' : 'pending_incoming';
        }
      });
      setMatchStatuses(statusMap);
    } catch (err) { console.error(err); }
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
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [navigate]);

  const fetchPresets = useCallback(async (token) => {
    try {
      const res = await fetch('http://localhost:3001/api/filters/saved', {
        headers: { Authorization: 'Bearer ' + token },
      });
      const data = await res.json();
      setPresets(data.presets || []);
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const myId = user.id || user.userId;
    fetchRoommates(page, filters);
    fetchMyGroups();
    if (token && myId) {
      fetchMatchStatuses(token, myId);
      fetchPresets(token);
    }
  }, [page, filters, fetchRoommates, fetchMyGroups, fetchMatchStatuses, fetchPresets]);

  const handleFilterChange = (key, value) => { setPage(1); setFilters(f => ({ ...f, [key]: value })); };
  const clearFilters = () => { setFilters(EMPTY_FILTERS); setPage(1); };

  const handleInvite = async (receiverId) => {
    const token = localStorage.getItem("token");
    if (!selectedGroupId) return alert("Select a group first!");
    setIsInviting(true);
    try {
      const res = await fetch("http://localhost:3001/api/groups/invite", {
        method: "POST",
        headers: { "Content-type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ groupId: selectedGroupId, receiverId }),
      });
      const data = await res.json();
      alert(res.ok ? "Invite sent!" : data.error);
    } catch (err) { console.error(err); }
    finally { setIsInviting(false); }
  };

  const handleSendRequest = async (recipientId) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:3001/api/matches/request/${recipientId}`, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token },
      });
      if (res.ok) setMatchStatuses(prev => ({ ...prev, [recipientId]: 'pending_sent' }));
    } catch (err) { console.error(err); }
  };

  const handleSavePreset = async () => {
    if (!presetName.trim()) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:3001/api/filters/saved', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: presetName.trim(), filters }),
      });
      if (res.ok) { setPresetName(''); setShowSaveForm(false); fetchPresets(token); }
    } catch (err) { console.error(err); }
  };

  const hasActiveFilters = Object.values(filters).some(Boolean);

  return (
    <div className="browse-page">
      <header className="browse-page-header">
        <h1 className="browse-page-title">Find Your Roommate</h1>
        <p className="browse-page-subtitle">
          {loading ? 'Searching...' : `${total} Bruins looking for a roommate`}
        </p>
      </header>

      {/* Inviting To Bar */}
      <div className="invite-selection-container">
        <span className="invite-label-text">Inviting to:</span>
        <select className="filter-chip" value={selectedGroupId} onChange={(e) => setSelectedGroupId(e.target.value)}>
          {myLedGroups.length === 0 ? <option value="">No groups created yet</option> : 
           myLedGroups.map(g => <option key={g.id} value={g.id}>{g.group_name || `Group #${g.id}`}</option>)}
        </select>
      </div>

      {/* Presets */}
      {(presets.length > 0 || hasActiveFilters) && (
        <div className="presets-bar">
          <span className="presets-label">Presets:</span>
          {presets.map(p => (
            <div key={p.id} className="preset-chip">
              <button className="preset-chip-apply" onClick={() => { setFilters(p.filters); setPage(1); }}>{p.name}</button>
              <button className="preset-chip-delete" onClick={async () => {
                const token = localStorage.getItem('token');
                await fetch(`http://localhost:3001/api/filters/saved/${p.id}`, { method: 'DELETE', headers: { Authorization: 'Bearer ' + token } });
                fetchPresets(token);
              }}>×</button>
            </div>
          ))}
          {hasActiveFilters && !showSaveForm && <button className="btn btn-ghost" onClick={() => setShowSaveForm(true)}>+ Save filters</button>}
          {showSaveForm && (
            <div className="preset-save-form">
              <input type="text" value={presetName} onChange={(e) => setPresetName(e.target.value)} placeholder="Name..." />
              <button onClick={handleSavePreset}>Save</button>
            </div>
          )}
        </div>
      )}

      {/* Browser Filter Window */}
      <div className="filter-window">
        <div className="filter-window-titlebar">
          <div className="filter-window-dots"><span className="dot dot-red" /><span className="dot dot-yellow" /><span className="dot dot-green" /></div>
          <span className="filter-window-title">🔍 Filter Roommates</span>
          {hasActiveFilters && <button className="filter-clear-btn" onClick={clearFilters}>✕ Clear</button>}
        </div>
        <div className="filter-window-urlbar">
          <span className="urlbar-icon">🌐</span>
          <input className="urlbar-input" type="text" value={filters.query} onChange={(e) => handleFilterChange('query', e.target.value)} placeholder="Search..." />
        </div>
        <div className="filter-window-body">
          <input className="filter-chip" type="text" value={filters.major} onChange={(e) => handleFilterChange('major', e.target.value)} placeholder="🎓 Major" />
          <select className="filter-chip" value={filters.academic_year} onChange={(e) => handleFilterChange('academic_year', e.target.value)}>
            <option value="">📚 All Years</option>
            {ACADEMIC_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select className="filter-chip" value={filters.housing_type} onChange={(e) => handleFilterChange('housing_type', e.target.value)}>
            <option value="">🏠 Housing</option>
            {HOUSING_TYPES.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
          <select className="filter-chip" value={filters.room_type} onChange={(e) => handleFilterChange('room_type', e.target.value)}>
            <option value="">🛏️ Room Type</option>
            {ROOM_TYPES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select className="filter-chip" value={filters.move_in_term} onChange={(e) => handleFilterChange('move_in_term', e.target.value)}>
            <option value="">📅 Term</option>
            {MOVE_IN_TERMS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select className="filter-chip" value={filters.sleep_time} onChange={(e) => handleFilterChange('sleep_time', e.target.value)}>
            <option value="">🌙 Bedtime</option>
            {SLEEP_TIMES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select className="filter-chip" value={filters.cleanliness_level} onChange={(e) => handleFilterChange('cleanliness_level', e.target.value)}>
            <option value="">🧼 Cleanliness</option>
            {CLEANLINESS_LEVELS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="filter-chip" value={filters.noise_tolerance} onChange={(e) => handleFilterChange('noise_tolerance', e.target.value)}>
            <option value="">🔊 Noise</option>
            {NOISE_TOLERANCES.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
          <select className="filter-chip" value={filters.conflict_style} onChange={(e) => handleFilterChange('conflict_style', e.target.value)}>
            <option value="">💬 Conflict</option>
            {CONFLICT_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Result Grid */}
      {loading ? <div className="browse-loading"><div className="loading-spinner" /></div> : 
       roommates.length === 0 ? <div className="browse-empty"><h3>No roommates found</h3></div> : 
       <>
          <div className="roommate-grid">
            {roommates.map(u => (
              <RoommateCard key={u.user_id} user={u} onInvite={handleInvite} matchStatus={matchStatuses[u.user_id]} onSendRequest={handleSendRequest} />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="pagination">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>←</button>
              <div className="pagination-pages">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} className={p === page ? 'active' : ''} onClick={() => setPage(p)}>{p}</button>
                ))}
              </div>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>→</button>
            </div>
          )}
       </>}
    </div>
  );
}

export default Browse;