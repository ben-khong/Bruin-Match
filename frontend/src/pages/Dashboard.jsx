import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function Dashboard() {
	const [user, setUser] = useState(null);
	const [hasProfile, setHasProfile] = useState(true);
	const [topMatches, setTopMatches] = useState([]);
	const [matchesLoading, setMatchesLoading] = useState(true);
	const [invites, setInvites] = useState([]);
	const [myGroups, setMyGroups] = useState([]);
	const navigate = useNavigate();

	useEffect(() => {
		const token = localStorage.getItem("token");
		const userData = localStorage.getItem("user");

		if (!token) {
			navigate("/login");
			return;
		}

		setUser(JSON.parse(userData));

		fetch("http://localhost:3001/api/profile", {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		})
			.then((res) => res.json())
			.then((data) => {
				const profileReady = Boolean(data.hasProfile && data.hasPreferences);
				setHasProfile(profileReady);

				if (!profileReady) {
					setMatchesLoading(false);
					return;
				}

				return fetch("http://localhost:3001/api/users?page=1&limit=3", {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				})
					.then((res) => res.json())
					.then((matches) => {
						setTopMatches(matches.users || []);
					});
			})
			.catch((err) => console.error("Profile check failed:", err))
			.finally(() => setMatchesLoading(false));

		fetch("http://localhost:3001/api/groups/invites/pending", {
			headers: { Authorization: `Bearer ${token}` },
		})
			.then((res) => res.json())
			.then((data) => setInvites(data))
			.catch((err) => console.error("Invites fetch failed", err));
		fetch("http://localhost:3001/api/groups/my-groups", {
			headers: { Authorization: `Bearer ${token}` },
		})
			.then((res) => res.json())
			.then((data) => setMyGroups(data))
			.catch((err) => console.error("Groups fetch failed", err));
	}, [navigate]);

	const handleCreateGroup = async () => {
		const token = localStorage.getItem("token");
		const userData = JSON.parse(localStorage.getItem("user"));

		try {
			const res = await fetch("http://localhost:3001/api/groups", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ group_name: `${userData.username}'s Group` }),
			});

			if (!res.ok) throw new Error("Failed to save group");

			const newGroup = await res.json();

			const groupWithLeader = {
				...newGroup,
				leader_id: userData.id || userData.userId,
			};

			setMyGroups((prev) => [...prev, groupWithLeader]);
			alert("Group Created!");
		} catch (err) {
			console.error(err);
			alert("Error creating group.");
		}
	};

	const handleInviteResponse = async (inviteId, action) => {
		const token = localStorage.getItem("token");
		await fetch("http://localhost:3001/api/groups/invite/respond", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({ inviteId, action }),
		});
		setInvites(invites.filter((i) => i.invite_id !== inviteId));
		if (action === "accepted") window.location.reload();
	};

	if (!user) return <div className="page-loading">Loading...</div>;

	return (
		<div className="dashboard">
			<header className="dashboard-header">
				<div>
					<h1>Dashboard</h1>
					<p className="dashboard-subtitle">
						Welcome, {user.username || user.email}!
					</p>
				</div>
				<button className="btn btn-secondary" onClick={handleCreateGroup}>
					+ Start a Group
				</button>
			</header>

			{invites.length > 0 && (
				<section
					className="dashboard-card"
					style={{
						backgroundColor: "#fffbeb",
						borderLeft: "4px solid #f59e0b",
					}}
				>
					<h3 style={{ marginTop: 0 }}>Pending Invitations</h3>
					{invites.map((inv) => (
						<div
							key={inv.invite_id}
							style={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								padding: "8px 0",
								borderBottom: "1px solid #fef3c7",
							}}
						>
							<p style={{ margin: 0 }}>
								<strong>{inv.sender_name}</strong> invited you to{" "}
								<strong>{inv.group_name || `Group #${inv.group_id}`}</strong>
							</p>
							<div style={{ display: "flex", gap: "8px" }}>
								<button
									className="btn btn-primary"
									style={{ padding: "4px 12px", fontSize: "0.8rem" }}
									onClick={() =>
										handleInviteResponse(inv.invite_id, "accepted")
									}
								>
									Accept
								</button>
								<button
									className="btn"
									style={{
										padding: "4px 12px",
										fontSize: "0.8rem",
										backgroundColor: "#ef4444",
										color: "white",
									}}
									onClick={() =>
										handleInviteResponse(inv.invite_id, "declined")
									}
								>
									Decline
								</button>
							</div>
						</div>
					))}
				</section>
			)}

			{!hasProfile && (
				<section className="dashboard-card incomplete-profile">
					<div className="incomplete-profile-text">
						<h3>Complete your profile</h3>
						<p>
							Fill out your housing preferences so we can start matching you
							with roommates.
						</p>
					</div>
					<button
						className="btn btn-primary"
						onClick={() => navigate("/onboarding")}
					>
						Complete Profile
					</button>
				</section>
			)}

			<section className="dashboard-card">
				<h3>How to use Bruin Match</h3>
				<ul>
					<li>Create your profile with housing preferences.</li>
					<li>Browse potential roommates based on your vibe.</li>
					<li>Send invites to start a group.</li>
					<li>Start chatting!</li>
				</ul>
			</section>

			{/* --- UPDATED GROUP SECTION --- */}
			<section className="dashboard-card">
				<h3>Your Roommate Groups</h3>
				{myGroups.length === 0 ? (
					<p style={{ color: "#64748b" }}>
						You aren't in any groups yet. Start one or wait for an invite!
					</p>
				) : (
					<div
						style={{
							display: "grid",
							gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
							gap: "16px",
						}}
					>
						{myGroups.map((group) => (
							<div
								key={group.id}
								className="group-card"
								style={{
									padding: "16px",
									border: "1px solid #e2e8f0",
									borderRadius: "12px",
									background: "#fff",
								}}
							>
								<div style={{ marginBottom: "16px" }}>
									<div
										style={{
											fontWeight: 700,
											fontSize: "1.1rem",
											color: "#1e293b",
										}}
									>
										{group.group_name || `Unnamed Group #${group.id}`}
									</div>
									<div
										style={{
											fontSize: "0.85rem",
											color: "#64748b",
											marginTop: "4px",
										}}
									>
										Role:{" "}
										{group.leader_id === user.id ? "👑 Group Leader" : "Member"}
									</div>
								</div>
								<button
									className="btn btn-primary"
									style={{ width: "100%" }}
									onClick={() => navigate(`/chat/${group.id}`)}
								>
									Open Chat
								</button>
							</div>
						))}
					</div>
				)}
			</section>

			{/* --- REST OF YOUR ORIGINAL SECTIONS --- */}
			<section
				className="dashboard-card"
				style={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					flexWrap: "wrap",
					gap: "16px",
				}}
			>
				<div>
					<h3 style={{ margin: "0 0 4px" }}>Find a Roommate</h3>
					<p style={{ margin: 0, color: "#64748b", fontSize: "0.95rem" }}>
						Browse Bruins looking for a roommate and filter by your preferences.
					</p>
				</div>
				<button className="btn btn-primary" onClick={() => navigate("/browse")}>
					Browse Roommates
				</button>
			</section>

			<section className="dashboard-card">
				<h3 style={{ margin: "0 0 8px" }}>Top Matches</h3>
				{matchesLoading ? (
					<p style={{ margin: 0, color: "#64748b" }}>
						Loading ranked matches...
					</p>
				) : !hasProfile ? (
					<p style={{ margin: 0, color: "#64748b" }}>
						Complete onboarding to see personalized compatibility scores.
					</p>
				) : topMatches.length === 0 ? (
					<p style={{ margin: 0, color: "#64748b" }}>
						No matches found yet. Try broadening filters in Browse.
					</p>
				) : (
					<div style={{ display: "grid", gap: "10px" }}>
						{topMatches.map((match) => (
							<div
								key={match.user_id}
								style={{
									border: "1px solid #e2e8f0",
									borderRadius: "12px",
									padding: "10px 12px",
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
								}}
							>
								<div>
									<div style={{ fontWeight: 600 }}>{match.full_name}</div>
									<div style={{ color: "#64748b", fontSize: "0.9rem" }}>
										{match.major} · {match.room_type}
									</div>
								</div>
								<div style={{ color: "#1d4ed8", fontWeight: 700 }}>
									{match.compatibility_score ?? 0}%
								</div>
							</div>
						))}
					</div>
				)}
			</section>
		</div>
	);
}

export default Dashboard;
