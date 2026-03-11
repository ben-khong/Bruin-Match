import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Home from './pages/Home';
import Signup from './pages/Signup';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Onboarding from './pages/Onboarding';
import Browse from './pages/Browse';
import Matches from './pages/Matches';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';
import SidebarLayout from './components/SidebarLayout';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/dashboard" element={<SidebarLayout><Dashboard /></SidebarLayout>} />
        <Route path="/browse" element={<SidebarLayout><Browse /></SidebarLayout>} />
        <Route path="/matches" element={<SidebarLayout><Matches /></SidebarLayout>} />
        <Route path="/notifications" element={<SidebarLayout><Notifications /></SidebarLayout>} />
        <Route path="/profile" element={<SidebarLayout><Profile /></SidebarLayout>} />
      </Routes>
    </Router>
  );
}

export default App;