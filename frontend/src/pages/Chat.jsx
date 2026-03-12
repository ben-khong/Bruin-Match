import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ChatWindow from '../components/ChatWindow';

function Chat() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [myGroups, setMyGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const userData = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    const fetchGroupsAndRedirect = async () => {
      const token = localStorage.getItem('token');
      if (!userData || !token) {
        navigate('/login');
        return;
      }

      try {
        const res = await fetch('http://localhost:3001/api/groups/my-groups', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const groups = await res.json();
        const groupsArray = Array.isArray(groups) ? groups : [];
        setMyGroups(groupsArray);

        if (!groupId && groupsArray.length > 0) {
          navigate(`/chat/${groupsArray[0].id}`, { replace: true });
        }
      } catch (err) {
        console.error("Failed to load chat groups", err);
      } finally {
        setLoading(false);
      }
    };

    fetchGroupsAndRedirect();
  }, [groupId, navigate, userData]);

  if (loading) {
    return <div style={{ padding: '20px', fontFamily: 'var(--font-body)', color: 'var(--navy)' }}>Loading Conversations...</div>;
  }

  if (myGroups.length === 0) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: '#5a6180' }}>
        <div style={{ fontSize: '3rem', marginBottom: '12px' }}>💬</div>
        <h2 style={{ fontFamily: 'var(--font-display)', color: 'var(--navy)', margin: '0 0 8px' }}>No active chats</h2>
        <p style={{ margin: '0 0 20px', fontSize: '0.95rem' }}>Join a group to start chatting!</p>
        <button className="btn btn-primary" onClick={() => navigate('/browse')}>Find Roommates</button>
      </div>
    );
  }

  const currentGroup = myGroups.find(g => String(g.id) === String(groupId));

  return (
    <div style={{
      display: 'flex',
      height: 'calc(100vh - 40px)',
      padding: '24px 32px',
      gap: '20px',
    }}>

      {/* Conversations sidebar — dandelion dash-note style */}
      <aside className="dash-note dash-note--dandelion" style={{
        width: '240px',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        height: '100%',
      }}>
        <div className="dash-note-bar dash-bar--dandelion" style={{ flexShrink: 0 }}>
          <span className="dn-dot" /><span className="dn-dot" /><span className="dn-dot" />
          <span className="dash-note-label" style={{ color: 'var(--strawberry)' }}>Conversations</span>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px', background: 'var(--ivory)' }}>
          {myGroups.map(g => (
            <div
              key={g.id}
              onClick={() => navigate(`/chat/${g.id}`)}
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                cursor: 'pointer',
                marginBottom: '6px',
                fontFamily: 'var(--font-display)',
                fontSize: '0.92rem',
                backgroundColor: String(groupId) === String(g.id) ? 'var(--dandelion-light)' : 'transparent',
                color: 'var(--strawberry)',
                fontWeight: String(groupId) === String(g.id) ? '700' : '500',
                borderLeft: String(groupId) === String(g.id) ? '3px solid var(--dandelion)' : '3px solid transparent',
                transition: 'background 0.15s',
              }}
            >
              {g.group_name}
            </div>
          ))}
        </div>
      </aside>

      {/* Chat panel — navy dash-note style */}
      <div className="dash-note dash-note--navy" style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        height: '100%',
      }}>
        <div className="dash-note-bar dash-bar--navy" style={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '9px 14px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="dn-dot" /><span className="dn-dot" /><span className="dn-dot" />
          </div>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: '0.88rem',
            fontWeight: '700',
            color: '#ffffff',
          }}>
            {currentGroup?.group_name || 'Chat'}
          </span>
          <button onClick={() => navigate('/dashboard')} style={{
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.3)',
            color: '#ffffff',
            cursor: 'pointer',
            fontWeight: '600',
            fontFamily: 'var(--font-body)',
            fontSize: '0.82rem',
            padding: '4px 12px',
            borderRadius: '6px',
            transition: 'background 0.15s',
          }}>
            ← Dashboard
          </button>
        </div>

        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {groupId && <ChatWindow groupId={groupId} currentUser={userData} />}
        </div>
      </div>
    </div>
  );
}

export default Chat;