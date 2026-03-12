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

        // Auto-redirect if no ID is present
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
    return <div style={{ padding: '20px' }}>Loading Conversations...</div>;
  }

  if (myGroups.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>No active chats</h2>
        <p>Join a group to start chatting!</p>
        <button onClick={() => navigate('/browse')}>Find Roommates</button>
      </div>
    );
  }

  const currentGroup = myGroups.find(g => String(g.id) === String(groupId));

  return (
    <div className="chat-page-main" style={{ 
      display: 'flex', 
      height: 'calc(100vh - 40px)', // Standard height
      backgroundColor: '#f8fafc', 
      padding: '20px', 
      gap: '20px' 
    }}>
      
      {/* Conversations Sidebar */}
      <aside style={{ 
        width: '250px', 
        backgroundColor: 'white', 
        borderRadius: '12px', 
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', 
        display: 'flex', 
        flexDirection: 'column', 
        overflow: 'hidden' 
      }}>
        <header style={{ padding: '15px 20px', borderBottom: '1px solid #e2e8f0', background: '#f1f5f9' }}>
          <h3 style={{ margin: 0, fontSize: '1rem' }}>Conversations</h3>
        </header>
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
          {myGroups.map(g => (
            <div 
              key={g.id} 
              onClick={() => navigate(`/chat/${g.id}`)}
              style={{
                padding: '12px 15px',
                borderRadius: '8px',
                cursor: 'pointer',
                marginBottom: '8px',
                backgroundColor: String(groupId) === String(g.id) ? '#dbeafe' : 'transparent',
                color: String(groupId) === String(g.id) ? '#1e40af' : '#475569',
                fontWeight: String(groupId) === String(g.id) ? '700' : '500',
              }}
            >
              {g.group_name}
            </div>
          ))}
        </div>
      </aside>

      {/* Main Chat Box */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        backgroundColor: 'white', 
        borderRadius: '12px', 
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', 
        overflow: 'hidden' 
      }}>
        <header style={{ padding: '15px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.1rem' }}>{currentGroup?.group_name}</h2>
            <p style={{ margin: 0, fontSize: '0.75rem', color: '#64748b' }}>Room ID: {groupId}</p>
          </div>
          <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', color: '#1d4ed8', cursor: 'pointer', fontWeight: '600' }}>
            Back to Dashboard
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