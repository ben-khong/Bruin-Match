import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './Matches.css';

function PersonChip({ name, sub }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  return (
    <div className="person-chip">
      <div className="person-chip-avatar">{initials}</div>
      <div className="person-chip-info">
        <span className="person-chip-name">{name}</span>
        {sub && <span className="person-chip-sub">{sub}</span>}
      </div>
    </div>
  );
}

function Matches() {
  const navigate = useNavigate();
  const [sent, setSent] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [group, setGroup] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMatches = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/matches', {
        headers: { Authorization: 'Bearer ' + token },
      });
      const data = await res.json();
      setSent(data.sent || []);
      setIncoming(data.incoming || []);
      setGroup(data.group || []);
    } catch (err) {
      console.error('Failed to fetch matches:', err);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  const handleAccept = async (requestId) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:3001/api/matches/accept/${requestId}`, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token },
      });
      if (res.ok) fetchMatches();
    } catch (err) {
      console.error('Failed to accept request:', err);
    }
  };

  const handleDecline = async (requestId) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:3001/api/matches/decline/${requestId}`, {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token },
      });
      if (res.ok) fetchMatches();
    } catch (err) {
      console.error('Failed to decline request:', err);
    }
  };

  const handleCancel = async (requestId) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:3001/api/matches/cancel/${requestId}`, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer ' + token },
      });
      if (res.ok) fetchMatches();
    } catch (err) {
      console.error('Failed to cancel request:', err);
    }
  };

  if (loading) {
    return (
      <div className="matches-page">
        <div className="matches-loading">
          <div className="loading-spinner" />
          <p>Loading matches...</p>
        </div>
      </div>
    );
  }

  const hasAnything = sent.length > 0 || incoming.length > 0 || group.length > 0;

  return (
    <div className="matches-page">
      <header className="matches-header">
        <h1 className="matches-title">Matches</h1>
        <p className="matches-subtitle">Manage your match requests and roommate group</p>
      </header>

      {/* Current Group */}
      <section className="matches-section">
        <h2 className="matches-section-title">
          <span className="section-dot section-dot--green" />
          Your Group
          {group.length > 0 && <span className="section-count">{group.length}</span>}
        </h2>
        {group.length === 0 ? (
          <p className="matches-empty-text">
            No group members yet. Accept a match request or browse for roommates.
          </p>
        ) : (
          <div className="matches-group-grid">
            {group.map((m) => (
              <div key={m.id} className="group-card">
                <PersonChip
                  name={m.full_name}
                  sub={`${m.academic_year} · ${m.major}`}
                />
                <div className="group-card-tags">
                  <span className="group-tag group-tag--blue">{m.housing_type}</span>
                  <span className="group-tag group-tag--yellow">{m.room_type}</span>
                  <span className="group-tag group-tag--pink">{m.move_in_term}</span>
                </div>
                <div className="group-card-contact">
                  <span className="group-contact-label">Contact</span>
                  <span className="group-contact-value">{m.contact_info}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Incoming Requests */}
      <section className="matches-section">
        <h2 className="matches-section-title">
          <span className="section-dot section-dot--purple" />
          Incoming Requests
          {incoming.length > 0 && <span className="section-count">{incoming.length}</span>}
        </h2>
        {incoming.length === 0 ? (
          <p className="matches-empty-text">No incoming requests right now.</p>
        ) : (
          <div className="matches-list">
            {incoming.map((r) => (
              <div key={r.id} className="match-row">
                <PersonChip
                  name={r.full_name}
                  sub={`${r.academic_year} · ${r.major}`}
                />
                <div className="match-row-actions">
                  <button
                    className="match-action-btn match-action-btn--accept"
                    onClick={() => handleAccept(r.id)}
                  >
                    Accept
                  </button>
                  <button
                    className="match-action-btn match-action-btn--decline"
                    onClick={() => handleDecline(r.id)}
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Sent Requests */}
      <section className="matches-section">
        <h2 className="matches-section-title">
          <span className="section-dot section-dot--yellow" />
          Sent Requests
          {sent.length > 0 && <span className="section-count">{sent.length}</span>}
        </h2>
        {sent.length === 0 ? (
          <p className="matches-empty-text">You haven't sent any pending requests.</p>
        ) : (
          <div className="matches-list">
            {sent.map((r) => (
              <div key={r.id} className="match-row">
                <PersonChip
                  name={r.full_name}
                  sub={`${r.academic_year} · ${r.major}`}
                />
                <button
                  className="match-action-btn match-action-btn--cancel"
                  onClick={() => handleCancel(r.id)}
                >
                  Cancel
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {!hasAnything && (
        <div className="matches-zero-state">
          <span className="matches-zero-icon">🤝</span>
          <h3>No activity yet</h3>
          <p>Browse Bruins and send a match request to get started.</p>
          <button className="matches-browse-btn" onClick={() => navigate('/browse')}>
            Browse Roommates
          </button>
        </div>
      )}
    </div>
  );
}

export default Matches;
