import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import './ChatWindow.css';

// Connect to backend (replace with your port if different)
const socket = io('http://localhost:3001', {
  reconnection: false, // Prevents infinite reconnection loops during dev
});

function ChatWindow({ groupId, currentUser }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const [members, setMembers] = useState([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    socket.emit('join_group', groupId);

    const fetchHistory = async () => {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3001/api/groups/${groupId}/messages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) setMessages(data);
    };

    const fetchMembers = async () => {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3001/api/groups/${groupId}/members`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) setMembers(data);
};
    fetchMembers();
    fetchHistory();

    // Listen for new live messages
    socket.on('receive_message', (newMessage) => {
      setMessages((prev) => [...prev, newMessage]);
    });

    return () => {
      socket.emit('leave_group', groupId);
      socket.off('receive_message');
    };
  }, [groupId]);

  const handleSend = () => {
    if (!input.trim()) return;

    const messageData = {
      groupId,
      senderId: currentUser.id,
      username: currentUser.username, // for immediate display
      content: input,
      created_at: new Date().toISOString()
    };

    socket.emit('send_message', messageData);
    setInput('');
  };

return (
    <div className="chat-layout">
      <div className="chat-main-column">
        <div className="messages-container">
          {messages.map((msg, i) => {
            const isMe = msg.sender_id === currentUser.id || msg.senderId === currentUser.id;
            return (
              <div 
                key={i} 
                className={`message-wrapper ${isMe ? 'me' : 'them'}`}
              >
                {!isMe && <span className="message-username">{msg.username}</span>}
                <div className="message-bubble">
                  {msg.content}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-area">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
          />
          <button 
            onClick={handleSend} 
            className="send-btn" 
            disabled={!input.trim()}
          >
            Send
          </button>
        </div>
      </div>

      <div className="chat-member-sidebar">
        <h3>Members — {members.length}</h3>
        <div className="member-list">
          {members.map((member) => (
            <div key={member.id} className="member-item">
              <div className="member-avatar">
                {member.username.charAt(0).toUpperCase()}
              </div>
              <span>{member.username}</span>
              {member.id === currentUser.id && (
                <small style={{color: '#94a3b8', marginLeft: '4px'}}> (You)</small>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ChatWindow;