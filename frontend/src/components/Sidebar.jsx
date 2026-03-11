import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import "./Sidebar.css";

const NAV_ITEMS = [
	{ label: "Dashboard", path: "/dashboard" },
	{ label: "Browse", path: "/browse" },

	{ label: "Profile", path: "/profile" },
];

function Sidebar() {
	const navigate = useNavigate();
	const location = useLocation();
	const [inviteCount, setInviteCount] = useState(0);

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

	const handleLogout = () => {
		localStorage.removeItem("token");
		localStorage.removeItem("user");
		navigate("/");
	};

	return (
		<aside className="sidebar">
			<div className="sidebar-top">
				<span className="sidebar-brand">Bruin Match</span>
				<nav className="sidebar-nav">
					{NAV_ITEMS.map(({ label, path }) => (
						<button
							key={path}
							className={
								"sidebar-link" + (location.pathname === path ? " active" : "")
							}
							onClick={() => navigate(path)}
						>
							{/* Wrap the label so we can style it separately from the badge */}
							<span className="link-text">{label}</span>

							{label === "Dashboard" && inviteCount > 0 && (
								<span className="nav-badge">{inviteCount}</span>
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
