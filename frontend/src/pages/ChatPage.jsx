import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ChatWindow from '../components/ChatWindow'; // Adjust path as needed
import Sidebar from '../components/Sidebar';

function ChatPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  
  // Get user data for the chat
  const userData = JSON.parse(localStorage.getItem('user'));

  if (!userData) {
    navigate('/login');
    return null;
  }

return (
    <div className="app-container" style={{ display: 'flex', height: '100vh' }}>
      <Sidebar />
      <main className="chat-page-main" style={{ flex: 1, backgroundColor: '#f8fafc', padding: '20px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: '15px' }}>
          <button 
            onClick={() => navigate('/dashboard')}
            style={{ background: 'none', border: 'none', color: '#1d4ed8', fontWeight: '600', cursor: 'pointer' }}
          >
            ← Back to Dashboard
          </button>
        </div>
        
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          backgroundColor: 'white', 
          borderRadius: '12px', 
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          overflow: 'hidden' 
        }}>
          <header style={{ padding: '15px 20px', borderBottom: '1px solid #e2e8f0' }}>
            <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a' }}>Group Chat</h2>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>Room ID: {groupId}</p>
          </header>

          <ChatWindow groupId={groupId} currentUser={userData} />
        </div>
      </main>
    </div>
  );
}

export default ChatPage;