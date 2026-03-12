import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [hasProfile, setHasProfile] = useState(true);
  const [topMatches, setTopMatches] = useState([]);
  const [matchesLoading, setMatchesLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token) {
      navigate('/login');
      return;
    }

    setUser(JSON.parse(userData));

    fetch('http://localhost:3001/api/profile', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        const profileReady = Boolean(data.hasProfile && data.hasPreferences);
        setHasProfile(profileReady);

        if (!profileReady) {
          setMatchesLoading(false);
          return;
        }

        return fetch('http://localhost:3001/api/users?page=1&limit=3', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })
          .then((res) => res.json())
          .then((matches) => {
            setTopMatches(matches.users || []);
          });
      })
      .catch((err) => console.error('Profile check failed:', err))
      .finally(() => setMatchesLoading(false));
  }, [navigate]);

  if (!user) return <div className="page-loading">Loading...</div>;

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p className="dashboard-subtitle">Welcome, {user.username || user.email}!</p>
        </div>
      </header>

      {!hasProfile && (
        <section className="dashboard-alert">
          <div className="dashboard-alert-text">
            <h3>Complete your profile</h3>
            <p>Fill out your housing preferences so we can start matching you with roommates.</p>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/onboarding')}>
            Complete Profile
          </button>
        </section>
      )}

      <div className="dashboard-grid">
        {/* How to use */}
        <div className="dash-note dash-note--dandelion">
          <div className="dash-note-bar dash-bar--dandelion">
            <span className="dn-dot" /><span className="dn-dot" /><span className="dn-dot" />
            <span className="dash-note-label">📋 How to use</span>
          </div>
          <div className="dash-note-body">
            <h3>Bruin Match</h3>
            <div className="dash-steps">
              <div className="dash-step"><span className="dash-step-icon">✏️</span><span>Build your profile and share what matters most in a roommate.</span></div>
              <div className="dash-step"><span className="dash-step-icon">🔍</span><span>Discover Bruins who match your lifestyle, habits, and housing needs.</span></div>
              <div className="dash-step"><span className="dash-step-icon">💌</span><span>Invite your favorites to form your roommate group.</span></div>
              <div className="dash-step"><span className="dash-step-icon">💬</span><span>Chat, connect, and find your perfect living match.</span></div>
            </div>
          </div>
        </div>

        {/* Find a Roommate */}
        <div className="dash-note dash-note--navy">
          <div className="dash-note-bar dash-bar--navy">
            <span className="dn-dot" /><span className="dn-dot" /><span className="dn-dot" />
            <span className="dash-note-label">🔍 Browse</span>
          </div>
          <div className="dash-note-body">
            <h3>Find a Roommate</h3>
            <p>Browse Bruins looking for a roommate and filter by your preferences.</p>
            <button className="btn btn-primary" onClick={() => navigate('/browse')} style={{ marginTop: '12px' }}>
              Browse Roommates
            </button>
          </div>
        </div>

        {/* Top Matches */}
        <div className="dash-note dash-note--strawberry">
          <div className="dash-note-bar dash-bar--strawberry">
            <span className="dn-dot" /><span className="dn-dot" /><span className="dn-dot" />
            <span className="dash-note-label">⭐ Top Matches</span>
          </div>
          <div className="dash-note-body">
            <h3>Top Matches</h3>
            {matchesLoading ? (
              <p className="dash-note-muted">Loading ranked matches...</p>
            ) : !hasProfile ? (
              <p className="dash-note-muted">Complete onboarding to see personalized compatibility scores.</p>
            ) : topMatches.length === 0 ? (
              <p className="dash-note-muted">No matches found yet. Try broadening filters in Browse.</p>
            ) : (
              <div className="dash-matches-list">
                {topMatches.map((match) => (
                  <div key={match.user_id} className="dash-match-row">
                    <div>
                      <div className="dash-match-name">{match.full_name}</div>
                      <div className="dash-match-sub">{match.major} · {match.room_type}</div>
                    </div>
                    <div className="dash-match-score">{match.compatibility_score ?? 0}%</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
