import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './Notifications.css';

const TYPE_ICONS = {
  request_received: '📩',
  request_accepted: '✅',
  request_declined: '❌',
};

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  return Math.floor(diff / 86400) + 'd ago';
}

function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/notifications', {
        headers: { Authorization: 'Bearer ' + token },
      });
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAllRead = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:3001/api/notifications/read-all', {
        method: 'PATCH',
        headers: { Authorization: 'Bearer ' + token },
      });
      if (res.ok) fetchNotifications();
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const handleMarkRead = async (id) => {
    const token = localStorage.getItem('token');
    try {
      await fetch(`http://localhost:3001/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: 'Bearer ' + token },
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  if (loading) {
    return (
      <div className="notifs-page">
        <div className="notifs-loading">
          <div className="loading-spinner" />
          <p>Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="notifs-page">
      <header className="notifs-header">
        <div>
          <h1 className="notifs-title">
            Notifications
            {unreadCount > 0 && <span className="notifs-badge">{unreadCount}</span>}
          </h1>
          <p className="notifs-subtitle">Stay updated on your match requests</p>
        </div>
        {unreadCount > 0 && (
          <button className="notifs-mark-all-btn" onClick={handleMarkAllRead}>
            Mark all as read
          </button>
        )}
      </header>

      {notifications.length === 0 ? (
        <div className="notifs-empty">
          <span className="notifs-empty-icon">🔔</span>
          <h3>No notifications yet</h3>
          <p>You'll be notified when someone sends or responds to a match request.</p>
        </div>
      ) : (
        <div className="notifs-list">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={'notif-row' + (n.is_read ? '' : ' notif-row--unread')}
              onClick={() => !n.is_read && handleMarkRead(n.id)}
            >
              <span className="notif-icon">{TYPE_ICONS[n.type] || '🔔'}</span>
              <div className="notif-body">
                <p className="notif-message">{n.message}</p>
                <span className="notif-time">{timeAgo(n.created_at)}</span>
              </div>
              {!n.is_read && <span className="notif-dot" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Notifications;
