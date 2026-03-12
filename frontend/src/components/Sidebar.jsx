import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import './Sidebar.css';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Browse', path: '/browse' },
  { label: 'Matches', path: '/matches' },
  { label: 'Chat', path: '/chat' },
  { label: 'Profile', path: '/profile' },
];

function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const [inviteCount, setInviteCount] = useState(0);
    const [unreadChatCount, setUnreadChatCount] = useState(0);
    const socketRef = useRef(null);

    useEffect(() => {
        const checkInvites = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                setInviteCount(0);
                return;
            }

            try {
                const res = await fetch(
                    "http://localhost:3001/api/groups/invites/pending",
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    },
                );
                if (res.ok) {
                    const data = await res.json();
                    setInviteCount(data.length);
                }
            } catch (err) {
                console.error("Sidebar notification check failed", err);
            }
        };

        checkInvites();

        const interval = setInterval(checkInvites, 30000);
        return () => clearInterval(interval);
    }, [location.pathname]);

    // Reset unread chat count when navigating to chat
    useEffect(() => {
        if (location.pathname.startsWith('/chat')) {
            setUnreadChatCount(0);
        }
    }, [location.pathname]);

    // Socket.IO: listen for new messages across all groups
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) return;

        const socket = io('http://localhost:3001', { reconnection: false });
        socketRef.current = socket;

        const joinGroups = async () => {
            try {
                const res = await fetch("http://localhost:3001/api/groups/my-groups", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const groups = await res.json();
                    groups.forEach((g) => socket.emit('join_group', g.id));
                }
            } catch (err) {
                console.error("Sidebar socket group join failed", err);
            }
        };

        joinGroups();

        socket.on('receive_message', (msg) => {
            const userStr = localStorage.getItem('user');
            const currentUser = userStr ? JSON.parse(userStr) : null;
            const isOwnMessage = currentUser && (msg.senderId === currentUser.id || msg.sender_id === currentUser.id);
            const onChatPage = window.location.pathname.startsWith('/chat');
            if (!isOwnMessage && !onChatPage) {
                setUnreadChatCount((prev) => prev + 1);
            }
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/");
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-top">
                <span className="sidebar-brand-text">BruinMatch</span>
                <nav className="sidebar-nav">
                    {NAV_ITEMS.map(({ label, path }) => (
                        <button
                            key={path}
                            className={
                                "sidebar-link" + (location.pathname.startsWith(path) ? " active" : "")
                            }
                            onClick={() => navigate(path)}
                        >
                            <span className="link-text">{label}</span>

                            {label === "Matches" && inviteCount > 0 && (
                                <span className="nav-badge">{inviteCount}</span>
                            )}
                            {label === "Chat" && unreadChatCount > 0 && (
                                <span className="nav-badge">{unreadChatCount}</span>
                            )}
                        </button>
                    ))}
                </nav>
            </div>
            <button className="sidebar-logout" onClick={handleLogout}>
                Logout
            </button>
        </aside>
    );
}

export default Sidebar;