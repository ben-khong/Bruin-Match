import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./Matches.css";

function PersonChip({ name, sub, showRemove, onRemove }) {
	const initials = name
		? name
				.split(" ")
				.map((n) => n[0])
				.join("")
				.toUpperCase()
				.slice(0, 2)
		: "??";
	return (
		<div className="person-chip">
			<div className="person-chip-avatar">{initials}</div>
			<div className="person-chip-info">
				<span className="person-chip-name">{name}</span>
				{sub && <span className="person-chip-sub">{sub}</span>}
			</div>
			{showRemove && (
				<button
					className="remove-member-btn"
					onClick={onRemove}
					title="Remove from group"
				>
					×
				</button>
			)}
		</div>
	);
}

function Matches() {
	const navigate = useNavigate();
	const [incoming, setIncoming] = useState([]);
	const [myGroups, setMyGroups] = useState([]);
	const [loading, setLoading] = useState(true);

	const userData = JSON.parse(localStorage.getItem("user") || "{}");
	const currentUserId = userData.id || userData.userId;

	const fetchMatches = useCallback(async () => {
		const token = localStorage.getItem("token");
		if (!token) {
			navigate("/login");
			return;
		}

		setLoading(true);
		try {
			const res = await fetch(
				"http://localhost:3001/api/groups/invites/pending",
				{
					headers: { Authorization: "Bearer " + token },
				},
			);
			const inviteData = await res.json();
			setIncoming(Array.isArray(inviteData) ? inviteData : []);

			const groupListRes = await fetch(
				"http://localhost:3001/api/groups/my-groups",
				{
					headers: { Authorization: "Bearer " + token },
				},
			);
			const groups = await groupListRes.json();

			if (Array.isArray(groups) && groups.length > 0) {
				const groupsWithMembers = await Promise.all(
					groups.map(async (g) => {
						const memRes = await fetch(
							`http://localhost:3001/api/groups/${g.id}/members`,
							{
								headers: { Authorization: "Bearer " + token },
							},
						);
						const members = await memRes.json();

						const sortedMembers = Array.isArray(members)
							? [...members].sort((a, b) => {
									if (Number(a.id) === Number(currentUserId)) return -1;
									if (Number(b.id) === Number(currentUserId)) return 1;
									return 0; 
								})
							: [];

						return { ...g, members: sortedMembers };
					}),
				);
				setMyGroups(groupsWithMembers);
				setMyGroups(groupsWithMembers);
			} else {
				setMyGroups([]);
			}
		} catch (err) {
			console.error("Fetch error:", err);
		} finally {
			setLoading(false);
		}
	}, [navigate]);

	useEffect(() => {
		fetchMatches();
	}, [fetchMatches]);

	const handleInviteResponse = async (inviteId, action) => {
		const token = localStorage.getItem("token");
		try {
			const res = await fetch(
				`http://localhost:3001/api/groups/invite/respond`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: "Bearer " + token,
					},
					body: JSON.stringify({ inviteId, action }),
				},
			);
			if (res.ok) fetchMatches();
		} catch (err) {
			console.error("Response error:", err);
		}
	};

	const handleRemoveMember = async (groupId, userId, username) => {
		if (
			!window.confirm(
				`Are you sure you want to remove ${username} from the group?`,
			)
		)
			return;

		const token = localStorage.getItem("token");
		try {
			const res = await fetch(
				`http://localhost:3001/api/groups/${groupId}/members/${userId}`,
				{
					method: "DELETE",
					headers: { Authorization: "Bearer " + token },
				},
			);
			if (res.ok) fetchMatches();
			else alert("Failed to remove member.");
		} catch (err) {
			console.error("Remove error:", err);
		}
	};

	const handleLeaveGroup = async (groupId) => {
		if (!window.confirm("Are you sure you want to leave this group?")) return;
		const token = localStorage.getItem("token");
		try {
			const res = await fetch(
				`http://localhost:3001/api/groups/${groupId}/leave`,
				{
					method: "DELETE",
					headers: { Authorization: "Bearer " + token },
				},
			);
			if (res.ok) fetchMatches();
			else {
				const data = await res.json();
				alert(data.error || "Error leaving group");
			}
		} catch (err) {
			console.error("Leave error:", err);
		}
	};

	const handleDeleteGroup = async (groupId) => {
		if (
			!window.confirm(
				"WARNING: This will delete the group for everyone. Proceed?",
			)
		)
			return;
		const token = localStorage.getItem("token");
		try {
			const res = await fetch(`http://localhost:3001/api/groups/${groupId}`, {
				method: "DELETE",
				headers: { Authorization: "Bearer " + token },
			});
			if (res.ok) fetchMatches();
			else alert("Failed to delete group.");
		} catch (err) {
			console.error("Delete error:", err);
		}
	};

	if (loading) {
		return (
			<div className="matches-page">
				<div className="matches-loading">
					<div className="loading-spinner" />
					<p>Loading your requests...</p>
				</div>
			</div>
		);
	}

	const hasActivity = incoming.length > 0 || myGroups.length > 0;

	return (
		<div className="matches-page">
			<header className="matches-header">
				<h1 className="matches-title">Matches</h1>
				<p className="matches-subtitle">
					Manage your roommate groups and invites
				</p>
			</header>

			<section className="matches-section">
				<h2 className="matches-section-title">
					<span className="section-dot section-dot--green" />
					Your Groups
					{myGroups.length > 0 && (
						<span className="section-count">{myGroups.length}</span>
					)}
				</h2>

				{myGroups.length === 0 ? (
					<p className="matches-empty-text">You are not in any groups yet.</p>
				) : (
					myGroups.map((g) => {
						const isLeader = Number(currentUserId) === Number(g.leader_id);
						const leaderMember = g.members.find(
							(m) => Number(m.id) === Number(g.leader_id),
						);
						const leaderName = leaderMember ? leaderMember.username : "Bruin";

						return (
							<div
								key={g.id}
								className="group-list-container"
								style={{ marginBottom: "40px" }}
							>
								<div
									style={{
										display: "flex",
										justifyContent: "space-between",
										alignItems: "center",
										borderBottom: "2px solid #f0f0f0",
										paddingBottom: "8px",
										marginBottom: "15px",
									}}
								>
									<h3
										className="group-display-name"
										style={{ color: "#2d5997", margin: 0 }}
									>
										👥 {g.group_name || `${leaderName}'s Group`}
										<span
											style={{
												fontSize: "0.8rem",
												color: "#94a3b8",
												fontWeight: "normal",
												marginLeft: "10px",
											}}
										>
											(ID: {g.id})
										</span>
									</h3>

									{isLeader ? (
										<button
											onClick={() => handleDeleteGroup(g.id)}
											style={{
												background: "#fee2e2",
												color: "#ef4444",
												border: "none",
												padding: "6px 14px",
												borderRadius: "6px",
												cursor: "pointer",
												fontSize: "0.85rem",
												fontWeight: "600",
											}}
										>
											Delete Group
										</button>
									) : (
										<button
											onClick={() => handleLeaveGroup(g.id)}
											style={{
												background: "#f1f5f9",
												color: "#64748b",
												border: "none",
												padding: "6px 14px",
												borderRadius: "6px",
												cursor: "pointer",
												fontSize: "0.85rem",
												fontWeight: "600",
											}}
										>
											Leave Group
										</button>
									)}
								</div>

								<div className="matches-group-grid">
									{g.members.map((m) => (
										<div key={m.id} className="group-card">
											<PersonChip
												name={m.username}
												sub={
													Number(m.id) === Number(g.leader_id)
														? "Leader"
														: "Member"
												}
												showRemove={
													isLeader && Number(m.id) !== Number(currentUserId)
												}
												onRemove={() =>
													handleRemoveMember(g.id, m.id, m.username)
												}
											/>
										</div>
									))}
								</div>
							</div>
						);
					})
				)}
			</section>

			<section className="matches-section">
				<h2 className="matches-section-title">
					<span className="section-dot section-dot--purple" />
					Incoming Requests
					{incoming.length > 0 && (
						<span className="section-count">{incoming.length}</span>
					)}
				</h2>
				{incoming.length === 0 ? (
					<p className="matches-empty-text">No incoming requests.</p>
				) : (
					<div className="matches-list">
						{incoming.map((r) => (
							<div key={r.invite_id} className="match-row">
								<PersonChip
									name={r.sender_name}
									sub={`Invited you to join: ${r.group_name || `Group #${r.group_id}`}`}
								/>
								<div className="match-row-actions">
									<button
										className="match-action-btn match-action-btn--accept"
										onClick={() =>
											handleInviteResponse(r.invite_id, "accepted")
										}
									>
										Accept
									</button>
									<button
										className="match-action-btn match-action-btn--decline"
										onClick={() =>
											handleInviteResponse(r.invite_id, "declined")
										}
									>
										Decline
									</button>
								</div>
							</div>
						))}
					</div>
				)}
			</section>

			{!hasActivity && (
				<div className="matches-zero-state">
					<span className="matches-zero-icon">🤝</span>
					<h3>No activity yet</h3>
					<button
						className="matches-browse-btn"
						onClick={() => navigate("/browse")}
					>
						Browse Roommates
					</button>
				</div>
			)}
		</div>
	);
}

export default Matches;
