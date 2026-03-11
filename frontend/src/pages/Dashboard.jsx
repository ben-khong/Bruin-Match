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
        <section className="dashboard-card incomplete-profile">
          <div className="incomplete-profile-text">
            <h3>Complete your profile</h3>
            <p>Fill out your housing preferences so we can start matching you with roommates.</p>
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/onboarding')}>
            Complete Profile
          </button>
        </section>
      )}

      <section className="dashboard-card">
        <h3>How to use Bruin Match</h3>
        <ul>
          <>
            <li>Create your profile with housing preferences.</li>
            <li>Browse potential roommates based on your vibe.</li>
            <li>Send invites to start a group.</li>
            <li>Start chatting!</li>
          </>
        </ul>
      </section>

      <section className="dashboard-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h3 style={{ margin: '0 0 4px' }}>Find a Roommate</h3>
          <p style={{ margin: 0, color: '#5a6180', fontSize: '0.95rem' }}>
            Browse Bruins looking for a roommate and filter by your preferences.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/browse')}>
          Browse Roommates
        </button>
      </section>

      <section className="dashboard-card">
        <h3 style={{ margin: '0 0 8px' }}>Top Matches</h3>
        {matchesLoading ? (
          <p style={{ margin: 0, color: '#5a6180' }}>Loading ranked matches...</p>
        ) : !hasProfile ? (
          <p style={{ margin: 0, color: '#5a6180' }}>Complete onboarding to see personalized compatibility scores.</p>
        ) : topMatches.length === 0 ? (
          <p style={{ margin: 0, color: '#5a6180' }}>No matches found yet. Try broadening filters in Browse.</p>
        ) : (
          <div style={{ display: 'grid', gap: '10px' }}>
            {topMatches.map((match) => (
              <div
                key={match.user_id}
                style={{
                  border: 'none',
                  borderRadius: '3px',
                  borderLeft: '4px solid #EDBD60',
                  padding: '10px 12px',
                  background: '#FFF8EF',
                  boxShadow: '1px 2px 8px rgba(63, 73, 165, 0.06)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{match.full_name}</div>
                  <div style={{ color: '#5a6180', fontSize: '0.9rem' }}>
                    {match.major} · {match.room_type}
                  </div>
                </div>
                <div style={{ color: '#3F49A5', fontWeight: 700 }}>{match.compatibility_score ?? 0}%</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Dashboard;