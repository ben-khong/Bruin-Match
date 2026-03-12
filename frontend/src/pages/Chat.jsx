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

      <aside style={{
        width: '240px',
        background: 'var(--ivory)',
        borderRadius: '12px',
        boxShadow: '2px 3px 12px rgba(63,73,165,0.08), 0 1px 2px rgba(0,0,0,0.04)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        borderTop: '4px solid var(--dandelion)',
      }}>
        <header style={{
          padding: '14px 18px',
          borderBottom: '1px solid rgba(63,73,165,0.1)',
          background: 'var(--dandelion)',
        }}>
          <h3 style={{
            margin: 0,
            fontFamily: 'var(--font-display)',
            fontSize: '0.88rem',
            fontWeight: '700',
            color: 'var(--navy)',
          }}>Conversations</h3>
        </header>
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
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
                color: 'var(--navy)',
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

      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--ivory)',
        borderRadius: '12px',
        boxShadow: '2px 3px 12px rgba(63,73,165,0.08), 0 1px 2px rgba(0,0,0,0.04)',
        overflow: 'hidden',
        borderTop: '4px solid var(--navy)',
      }}>
        <header style={{
          padding: '14px 20px',
          borderBottom: '1px solid rgba(63,73,165,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--navy)',
        }}>
          <div>
            <h2 style={{
              margin: 0,
              fontFamily: 'var(--font-display)',
              fontSize: '1.1rem',
              fontWeight: '700',
              color: '#ffffff',
            }}>{currentGroup?.group_name}</h2>
          </div>
          <button onClick={() => navigate('/dashboard')} style={{
            background: 'rgba(255,255,255,0.15)',
            border: '1px solid rgba(255,255,255,0.3)',
            color: '#ffffff',
            cursor: 'pointer',
            fontWeight: '600',
            fontFamily: 'var(--font-body)',
            fontSize: '0.85rem',
            padding: '6px 14px',
            borderRadius: '8px',
            transition: 'background 0.15s',
          }}>
            ← Dashboard
          </button>
        </header>

        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {groupId && <ChatWindow groupId={groupId} currentUser={userData} />}
        </div>
      </div>
    </div>
  );
}

export default Chat;