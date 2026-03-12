import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './Profile.css';
import {
  ACADEMIC_YEARS,
  GENDERS,
  HOUSING_TYPES,
  ROOM_TYPES,
  getRoomTypesForHousing,
  MOVE_IN_TERMS,
  SLEEP_TIMES,
  WAKE_TIMES,
  THERMOSTAT_PREFERENCES,
  GUEST_POLICIES,
  NOISE_TOLERANCES,
  CLEANLINESS_LEVELS,
  OVERNIGHT_GUEST_OPTIONS,
  SHARING_STYLES,
  SOCIAL_ENERGIES,
  CONFLICT_STYLES,
} from '../constants/profileOptions';

const EMPTY_FORM = {
  full_name: '', academic_year: '', major: '', gender: '', contact_info: '',
  housing_type: '', room_type: '', move_in_term: '',
  sleep_time: '', wake_time: '', thermostat_temp: '', guest_policy: '', noise_tolerance: '',
  cleanliness_level: '', overnight_guest_frequency: '', sharing_style: '',
  social_energy: '', conflict_style: '',
};

function Field({ label, value }) {
  return (
    <div className="profile-field">
      <span className="profile-field-label">{label}</span>
      <span className="profile-field-value">{value || <span className="profile-field-empty">Not set</span>}</span>
    </div>
  );
}

function EditField({ label, children }) {
  return (
    <div className="profile-edit-field">
      <label className="profile-edit-label">{label}</label>
      {children}
    </div>
  );
}

function Profile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [account, setAccount] = useState({ username: '', email: '' });
  const [form, setForm] = useState(EMPTY_FORM);
  const [editForm, setEditForm] = useState(EMPTY_FORM);
  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' });
  const [passwordMsg, setPasswordMsg] = useState('');

  const fetchProfile = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/profile', {
        headers: { Authorization: 'Bearer ' + token },
      });
      const data = await res.json();

      setAccount(data.account || { username: '', email: '' });

      const merged = {
        ...EMPTY_FORM,
        ...(data.profile || {}),
        ...(data.preferences || {}),
      };
      setForm(merged);
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const startEditing = () => {
    setEditForm({ ...form });
    setError('');
    setSuccessMsg('');
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setError('');
  };

  const update = (field, value) => setEditForm((f) => ({ ...f, [field]: value }));

  const handleSave = async () => {
    const required = [
      ['full_name', 'Full name'],
      ['academic_year', 'Academic year'],
      ['major', 'Major'],
      ['gender', 'Gender'],
      ['contact_info', 'Contact info'],
      ['housing_type', 'Housing type'],
      ['room_type', 'Room type'],
      ['move_in_term', 'Move-in term'],
      ['sleep_time', 'Bedtime'],
      ['wake_time', 'Wake-up time'],
      ['thermostat_temp', 'Temperature preference'],
      ['guest_policy', 'Guest policy'],
      ['noise_tolerance', 'Noise tolerance'],
      ['cleanliness_level', 'Cleanliness level'],
      ['overnight_guest_frequency', 'Overnight guest frequency'],
      ['sharing_style', 'Sharing style'],
      ['social_energy', 'Social energy'],
      ['conflict_style', 'Conflict style'],
    ];

    for (const [field, label] of required) {
      if (!editForm[field] || !editForm[field].trim()) {
        setError(`${label} is required.`);
        return;
      }
    }

    setSaving(true);
    setError('');
    const token = localStorage.getItem('token');

    try {
      const res = await fetch('http://localhost:3001/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + token,
        },
        body: JSON.stringify(editForm),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Something went wrong.');
        return;
      }

      setForm({ ...editForm });
      setEditing(false);
      setSuccessMsg('Profile updated successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!passwordForm.current) { setPasswordMsg('Current password is required.'); return; }
    if (!passwordForm.newPass) { setPasswordMsg('New password is required.'); return; }
    if (passwordForm.newPass.length < 6) { setPasswordMsg('New password must be at least 6 characters.'); return; }
    if (passwordForm.newPass !== passwordForm.confirm) { setPasswordMsg('New passwords do not match.'); return; }

    const token = localStorage.getItem('token');
    try {
      const res = await fetch('http://localhost:3001/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ currentPassword: passwordForm.current, newPassword: passwordForm.newPass }),
      });
      const data = await res.json();
      if (!res.ok) { setPasswordMsg(data.error || 'Failed to change password.'); return; }
      localStorage.setItem('userPassword', passwordForm.newPass);
      setPasswordMsg('Password changed successfully!');
      setPasswordForm({ current: '', newPass: '', confirm: '' });
      setTimeout(() => setPasswordMsg(''), 3000);
    } catch {
      setPasswordMsg('Something went wrong. Please try again.');
    }
  };

  const initials = form.full_name
    ? form.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-loading">
          <div className="profile-spinner" />
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* Header */}
      <div className="profile-hero">
        <div className="profile-avatar-lg">{initials}</div>
        <div className="profile-hero-info">
          <h1 className="profile-hero-name">{form.full_name || 'Your Profile'}</h1>
          <p className="profile-hero-sub">
            {[form.academic_year, form.major].filter(Boolean).join(' · ') || 'No profile info yet'}
          </p>
        </div>
        {!editing && (
          <button className="profile-edit-btn" onClick={startEditing}>
            Edit Profile
          </button>
        )}
      </div>

      {successMsg && <div className="profile-success">{successMsg}</div>}

      {!editing ? (
        /* ── View mode ── */
        <div className="profile-sections">
          <section className="profile-section">
            <h2 className="profile-section-title">Account</h2>
            <div className="profile-fields">
              <Field label="Username" value={account.username} />
              <Field label="Email" value={account.email} />
              <Field label="Password" value={localStorage.getItem('userPassword') || '••••••••'} />
            </div>
          </section>

          <section className="profile-section">
            <h2 className="profile-section-title">Personal Info</h2>
            <div className="profile-fields">
              <Field label="Full Name" value={form.full_name} />
              <Field label="Academic Year" value={form.academic_year} />
              <Field label="Major" value={form.major} />
              <Field label="Gender" value={form.gender} />
              <Field label="Contact Info" value={form.contact_info} />
            </div>
          </section>

          <section className="profile-section">
            <h2 className="profile-section-title">Housing</h2>
            <div className="profile-fields">
              <Field label="Housing Type" value={form.housing_type} />
              <Field label="Room Type" value={form.room_type} />
              <Field label="Move-in Term" value={form.move_in_term} />
            </div>
          </section>

          <section className="profile-section">
            <h2 className="profile-section-title">Lifestyle</h2>
            <div className="profile-fields">
              <Field label="Bedtime" value={form.sleep_time} />
              <Field label="Wake-up Time" value={form.wake_time} />
              <Field label="Temperature" value={form.thermostat_temp} />
              <Field label="Guest Policy" value={form.guest_policy} />
              <Field label="Noise Tolerance" value={form.noise_tolerance} />
              <Field label="Cleanliness" value={form.cleanliness_level} />
              <Field label="Overnight Guests" value={form.overnight_guest_frequency} />
              <Field label="Sharing Style" value={form.sharing_style} />
              <Field label="Social Energy" value={form.social_energy} />
              <Field label="Conflict Style" value={form.conflict_style} />
            </div>
          </section>
        </div>
      ) : (
        /* ── Edit mode ── */
        <div className="profile-edit-form">
          <section className="profile-section">
            <h2 className="profile-section-title">Account</h2>
            <div className="profile-fields">
              <Field label="Username" value={account.username} />
              <Field label="Email" value={account.email} />
            </div>
            <p className="profile-account-note">Username and email cannot be changed here.</p>

            <h2 className="profile-section-title" style={{ marginTop: '20px' }}>Change Password</h2>
            <div className="profile-edit-grid">
              <EditField label="Current Password">
                <input className="profile-input" type="password" placeholder="Enter current password"
                  value={passwordForm.current} onChange={(e) => setPasswordForm((f) => ({ ...f, current: e.target.value }))} />
              </EditField>
              <EditField label="New Password">
                <input className="profile-input" type="password" placeholder="Enter new password"
                  value={passwordForm.newPass} onChange={(e) => setPasswordForm((f) => ({ ...f, newPass: e.target.value }))} />
              </EditField>
              <EditField label="Confirm New Password">
                <input className="profile-input" type="password" placeholder="Confirm new password"
                  value={passwordForm.confirm} onChange={(e) => setPasswordForm((f) => ({ ...f, confirm: e.target.value }))} />
              </EditField>
            </div>
            {passwordMsg && (
              <p className={passwordMsg.includes('successfully') ? 'profile-success' : 'profile-error'} style={{ marginTop: '10px' }}>
                {passwordMsg}
              </p>
            )}
            <button className="profile-save-btn" onClick={handlePasswordChange} style={{ marginTop: '12px' }}>
              Update Password
            </button>
          </section>

          <section className="profile-section">
            <h2 className="profile-section-title">Personal Info</h2>
            <div className="profile-edit-grid">
              <EditField label="Full Name">
                <input className="profile-input" type="text" placeholder="Jane Doe"
                  value={editForm.full_name} onChange={(e) => update('full_name', e.target.value)} />
              </EditField>

              <EditField label="Academic Year">
                <select className="profile-input" value={editForm.academic_year}
                  onChange={(e) => update('academic_year', e.target.value)}>
                  <option value="">Select year</option>
                  {ACADEMIC_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </EditField>

              <EditField label="Major">
                <input className="profile-input" type="text" placeholder="e.g. Computer Science"
                  value={editForm.major} onChange={(e) => update('major', e.target.value)} />
              </EditField>

              <EditField label="Gender">
                <select className="profile-input" value={editForm.gender}
                  onChange={(e) => update('gender', e.target.value)}>
                  <option value="">Select gender</option>
                  {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </EditField>

              <EditField label="Contact Info">
                <input className="profile-input" type="text" placeholder="Phone number or social handle"
                  value={editForm.contact_info} onChange={(e) => update('contact_info', e.target.value)} />
              </EditField>
            </div>
          </section>

          <section className="profile-section">
            <h2 className="profile-section-title">Housing</h2>
            <div className="profile-edit-grid">
              <EditField label="Housing Type">
                <select className="profile-input" value={editForm.housing_type}
                  onChange={(e) => { update('housing_type', e.target.value); update('room_type', ''); }}>
                  <option value="">Select housing type</option>
                  {HOUSING_TYPES.map((h) => <option key={h} value={h}>{h}</option>)}
                </select>
              </EditField>

              <EditField label="Room Type">
                <select className="profile-input" value={editForm.room_type}
                  onChange={(e) => update('room_type', e.target.value)}>
                  <option value="">Select room type</option>
                  {getRoomTypesForHousing(editForm.housing_type).map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </EditField>

              <EditField label="Move-in Term">
                <select className="profile-input" value={editForm.move_in_term}
                  onChange={(e) => update('move_in_term', e.target.value)}>
                  <option value="">Select term</option>
                  {MOVE_IN_TERMS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </EditField>
            </div>
          </section>

          <section className="profile-section">
            <h2 className="profile-section-title">Lifestyle</h2>
            <div className="profile-edit-grid">
              <EditField label="Bedtime">
                <select className="profile-input" value={editForm.sleep_time}
                  onChange={(e) => update('sleep_time', e.target.value)}>
                  <option value="">Select bedtime</option>
                  {SLEEP_TIMES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </EditField>

              <EditField label="Wake-up Time">
                <select className="profile-input" value={editForm.wake_time}
                  onChange={(e) => update('wake_time', e.target.value)}>
                  <option value="">Select wake-up time</option>
                  {WAKE_TIMES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </EditField>

              <EditField label="Temperature Preference">
                <select className="profile-input" value={editForm.thermostat_temp}
                  onChange={(e) => update('thermostat_temp', e.target.value)}>
                  <option value="">Select temperature</option>
                  {THERMOSTAT_PREFERENCES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </EditField>

              <EditField label="Guest Policy">
                <select className="profile-input" value={editForm.guest_policy}
                  onChange={(e) => update('guest_policy', e.target.value)}>
                  <option value="">Select guest policy</option>
                  {GUEST_POLICIES.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </EditField>

              <EditField label="Noise Tolerance">
                <select className="profile-input" value={editForm.noise_tolerance}
                  onChange={(e) => update('noise_tolerance', e.target.value)}>
                  <option value="">Select noise tolerance</option>
                  {NOISE_TOLERANCES.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </EditField>

              <EditField label="Cleanliness Level">
                <select className="profile-input" value={editForm.cleanliness_level}
                  onChange={(e) => update('cleanliness_level', e.target.value)}>
                  <option value="">Select cleanliness level</option>
                  {CLEANLINESS_LEVELS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </EditField>

              <EditField label="Overnight Guests">
                <select className="profile-input" value={editForm.overnight_guest_frequency}
                  onChange={(e) => update('overnight_guest_frequency', e.target.value)}>
                  <option value="">Select frequency</option>
                  {OVERNIGHT_GUEST_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </EditField>

              <EditField label="Sharing Style">
                <select className="profile-input" value={editForm.sharing_style}
                  onChange={(e) => update('sharing_style', e.target.value)}>
                  <option value="">Select sharing style</option>
                  {SHARING_STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </EditField>

              <EditField label="Social Energy">
                <select className="profile-input" value={editForm.social_energy}
                  onChange={(e) => update('social_energy', e.target.value)}>
                  <option value="">Select social energy</option>
                  {SOCIAL_ENERGIES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </EditField>

              <EditField label="Conflict Style">
                <select className="profile-input" value={editForm.conflict_style}
                  onChange={(e) => update('conflict_style', e.target.value)}>
                  <option value="">Select conflict style</option>
                  {CONFLICT_STYLES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </EditField>
            </div>
          </section>

          {error && <p className="profile-error">{error}</p>}

          <div className="profile-edit-actions">
            <button className="profile-cancel-btn" onClick={cancelEditing} disabled={saving}>
              Cancel
            </button>
            <button className="profile-save-btn" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;