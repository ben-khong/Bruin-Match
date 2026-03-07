import { useNavigate, useLocation } from 'react-router-dom';
import './Sidebar.css';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Browse', path: '/browse' },
  { label: 'Matches', path: '/matches' },
  { label: 'Profile', path: '/profile' },
];

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <span className="sidebar-brand">Bruin Match</span>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map(({ label, path }) => (
            <button
              key={path}
              className={'sidebar-link' + (location.pathname === path ? ' active' : '')}
              onClick={() => navigate(path)}
            >
              {label}
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
