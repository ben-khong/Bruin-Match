import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./Browse.css";

const ACADEMIC_YEARS = ["Freshman", "Sophomore", "Junior", "Senior", "Grad"];
const HOUSING_TYPES = [
	"On-Campus Residence Halls",
	"University Apartments",
	"Off-Campus Apartments",
];
const ROOM_TYPES = [
	"Classic Residence Hall - Double & Triple",
	"Deluxe Residence Hall - Double & Triple",
	"Plaza Residences - Double & Triple",
	"Suites - Double & Triple",
];
const MOVE_IN_TERMS = [
	"Fall 2025",
	"Winter 2026",
	"Spring 2026",
	"Fall 2026",
	"Winter 2027",
	"Spring 2027",
];
const SLEEP_TIMES = [
	"Before 10 PM",
	"10 PM to 12 AM",
	"12 AM to 2 AM",
	"After 2 AM",
];
const THERMOSTAT_PREFERENCES = [
	"I like it cold",
	"I like it cool",
	"I like it warm",
	"No preference",
];
const CLEANLINESS_LEVELS = [
	"Very neat - I clean daily",
	"Tidy - I clean a few times a week",
	"Relaxed - I clean when it is noticeable",
	"Messy does not bother me",
];
const GUEST_POLICIES = [
	"Anytime is fine",
	"Fine with a heads-up",
	"Occasionally, with advance notice",
	"I prefer minimal visitors",
];
const NOISE_LEVELS = [
	"Very quiet - headphones always",
	"Moderate - occasional speakers at low volume",
	"I like playing music/videos out loud",
	"It varies a lot day to day",
];
const OVERNIGHT_GUEST_OPTIONS = [
	"Never",
	"Rarely (once a month or less)",
	"Sometimes (a few times a month)",
	"Frequently (weekly)",
];
const SOCIAL_ENERGIES = [
	"Best friends - lets hang out all the time",
	"Friendly - eat meals together sometimes",
	"Cordial - we coexist respectfully",
	"Independent - I keep to myself",
];
const CONFLICT_STYLES = [
	"I address it right away, face to face",
	"I bring it up calmly after thinking it over",
	"I prefer to text/message about it",
	"I tend to avoid confrontation",
];

const CARDS_PER_PAGE = 6;

function RoommateCard({ user, onInvite }) {
	const initials = user.full_name
		.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);

	const tagColor = {
		"On-Campus Residence Halls": "#dbeafe",
		"University Apartments": "#ede9fe",
		"Off-Campus Apartments": "#dcfce7",
	};

	return (
		<div className="roommate-card">
			<div className="card-header">
				<div className="card-avatar">{initials}</div>
				<div className="card-identity">
					<h3 className="card-name">{user.full_name}</h3>
					<span className="card-profile">
						{user.gender} &middot; {user.academic_year} &middot; {user.major}
					</span>
				</div>
				<div style={{ marginLeft: "auto", textAlign: "right" }}>
					<div style={{ fontSize: "0.78rem", color: "#64748b" }}>
						Compatibility
					</div>
					<div style={{ fontWeight: 700, color: "#1d4ed8" }}>
						{user.compatibility_score ?? 0}%
					</div>
				</div>
			</div>

			<div className="card-tags">
				<span
					className="card-tag"
					style={{ background: tagColor[user.housing_type] || "#f1f5f9" }}
				>
					{user.housing_type}
				</span>
				<span className="card-tag" style={{ background: "#fef9c3" }}>
					{user.room_type}
				</span>
				<span className="card-tag" style={{ background: "#fce7f3" }}>
					{user.move_in_term}
				</span>
			</div>

			<div className="card-prefs">
				<div className="card-pref-row">
					<span className="pref-icon">🌙</span>
					<span>{user.sleep_time}</span>
				</div>
				<div className="card-pref-row">
					<span className="pref-icon">☀️</span>
					<span>{user.wake_time}</span>
				</div>
				<div className="card-pref-row">
					<span className="pref-icon">🌡️</span>
					<span>{user.thermostat_temp}</span>
				</div>
				<div className="card-pref-row">
					<span className="pref-icon">🔊</span>
					<span>{user.noise_tolerance}</span>
				</div>
				<div className="card-pref-row">
					<span className="pref-icon">🚪</span>
					<span>{user.guest_policy}</span>
				</div>
				<div className="card-pref-row">
					<span className="pref-icon">🧼</span>
					<span>{user.cleanliness_level}</span>
				</div>
				<div className="card-pref-row">
					<span className="pref-icon">🛏️</span>
					<span>{user.overnight_guest_frequency}</span>
				</div>
				<div className="card-pref-row">
					<span className="pref-icon">🤝</span>
					<span>{user.conflict_style}</span>
				</div>
			</div>

			<div className="card-footer">
				<div
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "stretch",
						gap: "12px",
					}}
				>
					<span className="card-contact-label">Contact</span>
					<span className="card-contact">{user.contact_info}</span>
				</div>
				<button
					className="btn btn-primary"
					style={{ width: "50%", padding: "8px", borderRadius: "8px" }}
					onClick={() => onInvite(user.user_id)}
				>
					Invite to Group
				</button>
			</div>
		</div>
	);
}

function Browse() {
	const navigate = useNavigate();
  const [isInviting, setIsInviting] = useState(false);
	const [myLedGroups, setMyLedGroups] = useState([]);
	const [selectedGroupId, setSelectedGroupId] = useState("");
	const [roommates, setRoommates] = useState([]);
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [total, setTotal] = useState(0);
	const [loading, setLoading] = useState(true);
	const [currentUser, setCurrentUser] = useState(null);
	const [filters, setFilters] = useState({
		query: "",
		major: "",
		academic_year: "",
		housing_type: "",
		room_type: "",
		move_in_term: "",
		sleep_time: "",
		guest_policy: "",
		noise_tolerance: "",
		thermostat_temp: "",
		cleanliness_level: "",
		overnight_guest_frequency: "",
		social_energy: "",
		conflict_style: "",
	});
const fetchMyGroups = useCallback(async () => {
  const token = localStorage.getItem("token");
  const userData = localStorage.getItem("user");
  if (!token || !userData) return;

  const userObj = JSON.parse(userData);
  const myId = userObj.id

  try {
    const res = await fetch('http://localhost:3001/api/groups/my-groups', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    
    if (Array.isArray(data)) {
      // Filter for groups where you are the leader
      const led = data.filter(g => Number(g.leader_id) === Number(myId));
      
      setMyLedGroups(led);
      if (led.length > 0) {
        setSelectedGroupId(led[0].id);
      }
    }
  } catch (err) {
    console.error("Failed to fetch groups:", err);
  }
}, []);

useEffect(() => {
  fetchMyGroups();
}, [fetchMyGroups]);

	const fetchRoommates = useCallback(
		async (currentPage, currentFilters) => {
			const token = localStorage.getItem("token");
			if (!token) {
				navigate("/login");
				return;
			}

			setLoading(true);
			const params = new URLSearchParams({
				page: currentPage,
				limit: CARDS_PER_PAGE,
			});
			Object.entries(currentFilters).forEach(([k, v]) => {
				if (v) params.append(k, v);
			});

			try {
				const res = await fetch(
					"http://localhost:3001/api/users?" + params.toString(),
					{
						headers: { Authorization: "Bearer " + token },
					},
				);
				const data = await res.json();
				setRoommates(data.users || []);
				setTotalPages(data.totalPages || 1);
				setTotal(data.total || 0);
			} catch (err) {
				console.error("Failed to fetch roommates:", err);
			} finally {
				setLoading(false);
			}
		},
		[navigate],
	);

	useEffect(() => {
		const userData = localStorage.getItem("user");
		if (userData) setCurrentUser(JSON.parse(userData));
	}, []);

	const handleInvite = async (receiverId) => {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Session expired. Please log in.");
    navigate("/login");
    return;
  }

  if (!selectedGroupId) {
    alert("Please select or create a group first!");
    return;
  }

  if (isInviting) return;
  setIsInviting(true);

  try {
    const inviteRes = await fetch("http://localhost:3001/api/groups/invite", {
      method: "POST",
      headers: {
        "Content-type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ 
        groupId: selectedGroupId, 
        receiverId: receiverId 
      }),
    });

    const data = await inviteRes.json();

    if (inviteRes.ok) {
      alert("Invite sent successfully!");
    } else {
      alert(data.error || "Could not send invite.");
    }
  } catch (err) {
    console.error("Invite failed:", err);
    alert("An error occurred. Please check your connection.");
  } finally {
    setIsInviting(false);
  }
};

	useEffect(() => {
		const token = localStorage.getItem("token");
		if (!token) {
			navigate("/login");
			return;
		}
		fetchRoommates(page, filters);
	}, [page, filters, fetchRoommates, navigate]);

	const handleFilterChange = (key, value) => {
		setPage(1);
		setFilters((f) => ({ ...f, [key]: value }));
	};

	const clearFilters = () => {
		setFilters({
			academic_year: "",
			major: "",
			query: "",
			housing_type: "",
			room_type: "",
			move_in_term: "",
			sleep_time: "",
			guest_policy: "",
			noise_tolerance: "",
			thermostat_temp: "",
			cleanliness_level: "",
			overnight_guest_frequency: "",
			social_energy: "",
			conflict_style: "",
		});
		setPage(1);
	};

	const hasActiveFilters = Object.values(filters).some(Boolean);

	return (
		<div className="browse-page">
			<header className="browse-page-header">
				<div className="browse-page-header-left">
					<div>
						<h1 className="browse-page-title">Find Your Roommate</h1>
						<p className="browse-page-subtitle">
							{loading
								? "Searching..."
								: total +
									" Bruin" +
									(total !== 1 ? "s" : "") +
									" looking for a roommate"}
						</p>
					</div>
				</div>
			</header>
			<div
				style={{
					padding: "10px 15px",
					backgroundColor: "#eff6ff",
					borderRadius: "8px",
					marginBottom: "15px",
					display: "flex",
					alignItems: "center",
					gap: "10px",
					border: "1px solid #bfdbfe",
				}}
			>
				<span
					style={{ fontWeight: "bold", color: "#1e40af", fontSize: "0.9rem" }}
				>
					Inviting to:
				</span>
				<select
					className="filter-select"
					style={{ margin: 0, flex: 1 }}
					value={selectedGroupId}
					onChange={(e) => setSelectedGroupId(e.target.value)}
				>
					{myLedGroups.length === 0 ? (
						<option value="">No groups created yet</option>
					) : (
						myLedGroups.map((g) => (
							<option key={g.id} value={g.id}>
								{g.group_name || `Group #${g.id}`}
							</option>
						))
					)}
				</select>
			</div>
			{/* Filters */}
			<div className="filter-bar">
				<input
					className="filter-select"
					type="text"
					value={filters.query}
					onChange={(e) => handleFilterChange("query", e.target.value)}
					placeholder="Search name, major, room type..."
				/>
				<input
					className="filter-select"
					type="text"
					value={filters.major}
					onChange={(e) => handleFilterChange("major", e.target.value)}
					placeholder="Filter by major"
				/>
				<select
					className="filter-select"
					value={filters.academic_year}
					onChange={(e) => handleFilterChange("academic_year", e.target.value)}
				>
					<option value="">All Years</option>
					{ACADEMIC_YEARS.map((y) => (
						<option key={y} value={y}>
							{y}
						</option>
					))}
				</select>
				<select
					className="filter-select"
					value={filters.housing_type}
					onChange={(e) => handleFilterChange("housing_type", e.target.value)}
				>
					<option value="">All Housing</option>
					{HOUSING_TYPES.map((h) => (
						<option key={h} value={h}>
							{h}
						</option>
					))}
				</select>
				<select
					className="filter-select"
					value={filters.room_type}
					onChange={(e) => handleFilterChange("room_type", e.target.value)}
				>
					<option value="">All Room Types</option>
					{ROOM_TYPES.map((r) => (
						<option key={r} value={r}>
							{r}
						</option>
					))}
				</select>
				<select
					className="filter-select"
					value={filters.move_in_term}
					onChange={(e) => handleFilterChange("move_in_term", e.target.value)}
				>
					<option value="">All Terms</option>
					{MOVE_IN_TERMS.map((t) => (
						<option key={t} value={t}>
							{t}
						</option>
					))}
				</select>
				<select
					className="filter-select"
					value={filters.sleep_time}
					onChange={(e) => handleFilterChange("sleep_time", e.target.value)}
				>
					<option value="">All Bedtime Styles</option>
					{SLEEP_TIMES.map((t) => (
						<option key={t} value={t}>
							{t}
						</option>
					))}
				</select>
				<select
					className="filter-select"
					value={filters.guest_policy}
					onChange={(e) => handleFilterChange("guest_policy", e.target.value)}
				>
					<option value="">All Guest Preferences</option>
					{GUEST_POLICIES.map((option) => (
						<option key={option} value={option}>
							{option}
						</option>
					))}
				</select>
				<select
					className="filter-select"
					value={filters.noise_tolerance}
					onChange={(e) =>
						handleFilterChange("noise_tolerance", e.target.value)
					}
				>
					<option value="">All Noise Levels</option>
					{NOISE_LEVELS.map((option) => (
						<option key={option} value={option}>
							{option}
						</option>
					))}
				</select>
				<select
					className="filter-select"
					value={filters.thermostat_temp}
					onChange={(e) =>
						handleFilterChange("thermostat_temp", e.target.value)
					}
				>
					<option value="">All Temperature Preferences</option>
					{THERMOSTAT_PREFERENCES.map((option) => (
						<option key={option} value={option}>
							{option}
						</option>
					))}
				</select>
				<select
					className="filter-select"
					value={filters.cleanliness_level}
					onChange={(e) =>
						handleFilterChange("cleanliness_level", e.target.value)
					}
				>
					<option value="">All Cleanliness Levels</option>
					{CLEANLINESS_LEVELS.map((level) => (
						<option key={level} value={level}>
							{level}
						</option>
					))}
				</select>
				<select
					className="filter-select"
					value={filters.overnight_guest_frequency}
					onChange={(e) =>
						handleFilterChange("overnight_guest_frequency", e.target.value)
					}
				>
					<option value="">All Overnight Guest Styles</option>
					{OVERNIGHT_GUEST_OPTIONS.map((option) => (
						<option key={option} value={option}>
							{option}
						</option>
					))}
				</select>
				<select
					className="filter-select"
					value={filters.social_energy}
					onChange={(e) => handleFilterChange("social_energy", e.target.value)}
				>
					<option value="">All Social Styles</option>
					{SOCIAL_ENERGIES.map((energy) => (
						<option key={energy} value={energy}>
							{energy}
						</option>
					))}
				</select>
				<select
					className="filter-select"
					value={filters.conflict_style}
					onChange={(e) => handleFilterChange("conflict_style", e.target.value)}
				>
					<option value="">All Conflict Styles</option>
					{CONFLICT_STYLES.map((style) => (
						<option key={style} value={style}>
							{style}
						</option>
					))}
				</select>
				{hasActiveFilters && (
					<button className="btn btn-ghost filter-clear" onClick={clearFilters}>
						Clear filters
					</button>
				)}
			</div>

			{/* Cards */}
			{loading ? (
				<div className="browse-loading">
					<div className="loading-spinner" />
					<p>Finding Bruins...</p>
				</div>
			) : roommates.length === 0 ? (
				<div className="browse-empty">
					<span className="empty-icon">🐻</span>
					<h3>No roommates found</h3>
					<p>Try adjusting your filters or check back later.</p>
				</div>
			) : (
				<>
					<div className="roommate-grid">
						{roommates.map((u) => (
							<RoommateCard key={u.user_id} user={u} onInvite={handleInvite} />
						))}
					</div>

					{totalPages > 1 && (
						<div className="pagination">
							<button
								className="pagination-btn"
								onClick={() => setPage((p) => Math.max(1, p - 1))}
								disabled={page === 1}
							>
								&#8592;
							</button>
							<div className="pagination-pages">
								{Array.from({ length: totalPages }, (_, i) => i + 1).map(
									(p) => (
										<button
											key={p}
											className={
												"pagination-page" + (p === page ? " active" : "")
											}
											onClick={() => setPage(p)}
										>
											{p}
										</button>
									),
								)}
							</div>
							<button
								className="pagination-btn"
								onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
								disabled={page === totalPages}
							>
								&#8594;
							</button>
						</div>
					)}
				</>
			)}
		</div>
	);
}

export default Browse;
