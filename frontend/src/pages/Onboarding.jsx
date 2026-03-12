import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ACADEMIC_YEARS,
  GENDERS,
  HOUSING_TYPES,
  ROOM_TYPES,
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

const STEPS = ['Personal Info', 'Housing Preferences', 'Lifestyle', 'Review'];

const ROOM_TYPE_DETAILS = {
  'Classic Residence Hall - Double & Triple': 'High-rise halls with communal bathrooms, study lounges, social lounges, and centralized laundry. No air conditioning.',
  'Deluxe Residence Hall - Double & Triple': 'Classic-style high-rises upgraded with air conditioning, communal bathrooms, floor study lounges, and centralized laundry.',
  'Plaza Residences - Double & Triple': 'Mix of courtyard and high-rise layouts with private/shared bathrooms, air conditioning, social spaces, and community laundry.',
  'Suites - Double & Triple': 'Suite layout with a shared living room and bathroom between bedrooms. Renovated social/study spaces. No air conditioning.',
};

const LIFESTYLE_QUESTIONS = [
  {
    key: 'sleep_time',
    label: '1) When do you usually go to sleep?',
    options: SLEEP_TIMES,
  },
  {
    key: 'wake_time',
    label: '2) When do you usually wake up?',
    options: WAKE_TIMES,
  },
  {
    key: 'cleanliness_level',
    label: '3) How would you describe your cleanliness level?',
    options: CLEANLINESS_LEVELS,
  },
  {
    key: 'guest_policy',
    label: '4) How do you feel about guests/friends visiting the room?',
    options: GUEST_POLICIES,
  },
  {
    key: 'overnight_guest_frequency',
    label: '5) How often do you plan to have overnight guests?',
    options: OVERNIGHT_GUEST_OPTIONS,
  },
  {
    key: 'sharing_style',
    label: '6) How do you feel about sharing personal items (food, supplies, etc.)?',
    options: SHARING_STYLES,
  },
  {
    key: 'noise_tolerance',
    label: '7) What is your noise level when you are in the room?',
    options: NOISE_TOLERANCES,
  },
  {
    key: 'thermostat_temp',
    label: '8) How do you feel about room temperature preferences?',
    options: THERMOSTAT_PREFERENCES,
  },
  {
    key: 'social_energy',
    label: '9) How social do you want to be with your roommate?',
    options: SOCIAL_ENERGIES,
  },
  {
    key: 'conflict_style',
    label: '10) How do you handle conflict or disagreements?',
    options: CONFLICT_STYLES,
  },
];

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    // Profile
    full_name: '',
    academic_year: '',
    major: '',
    gender: '',
    contact_info: '',
    housing_type: '',
    room_type: '',
    move_in_term: '',
    // Preferences
    sleep_time: '',
    wake_time: '',
    thermostat_temp: '',
    guest_policy: '',
    noise_tolerance: '',
    cleanliness_level: '',
    overnight_guest_frequency: '',
    sharing_style: '',
    social_energy: '',
    conflict_style: '',
  });

  const update = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  const validateStep = () => {
    if (step === 0) {
      if (!form.full_name.trim()) return 'Please enter your full name.';
      if (!form.academic_year) return 'Please select your academic year.';
      if (!form.major.trim()) return 'Please enter your major.';
      if (!form.gender) return 'Please select your gender.';
      if (!form.contact_info.trim()) return 'Please enter your contact info.';
    }
    if (step === 1) {
      if (!form.housing_type) return 'Please select a housing type.';
      if (!form.room_type) return 'Please select a room type.';
      if (!form.move_in_term) return 'Please select a move-in term.';
    }
    if (step === 2) {
      const unanswered = LIFESTYLE_QUESTIONS.find((question) => !form[question.key]);
      if (unanswered) return `Please answer: ${unanswered.label}`;
    }
    return null;
  };

  const nextStep = () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError('');
    setStep((s) => s + 1);
  };

  const prevStep = () => {
    setError('');
    setStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    const token = localStorage.getItem('token');

    try {
      const res = await fetch('http://localhost:3001/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong.');
        setSubmitting(false);
        return;
      }

      navigate('/dashboard');
    } catch (err) {
      setError('Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  const reviewItems = [
    ['Full Name', form.full_name],
    ['Academic Year', form.academic_year],
    ['Major', form.major],
    ['Gender', form.gender],
    ['Contact Info', form.contact_info],
    ['Housing Type', form.housing_type],
    ['Room Type', form.room_type],
    ['Move-in Term', form.move_in_term],
    ['Bedtime', form.sleep_time],
    ['Wake-up Time', form.wake_time],
    ['Temperature Preference', form.thermostat_temp],
    ['Guest Policy', form.guest_policy],
    ['Overnight Guest Frequency', form.overnight_guest_frequency],
    ['Noise Tolerance', form.noise_tolerance],
    ['Cleanliness Level', form.cleanliness_level],
    ['Sharing Style', form.sharing_style],
    ['Social Energy', form.social_energy],
    ['Conflict Style', form.conflict_style],
  ];

  return (
    <div className="auth-page">
      <div className="onboarding-card">

        {/* Header */}
        <div className="onboarding-header">
          <div className="brand">BruinMatch</div>
          <p className="auth-subtitle">Let's set up your profile</p>
        </div>

        {/* Step indicators */}
        <div className="step-indicators">
          {STEPS.map((label, i) => (
            <div key={label} className={`step-indicator ${i <= step ? 'active' : ''}`}>
              <div className="step-circle">{i + 1}</div>
              <span className="step-label">{label}</span>
            </div>
          ))}
        </div>

        {/* Step 1 — Personal Info */}
        {step === 0 && (
          <div className="onboarding-section">
            <h2 className="onboarding-title">Personal Information</h2>

            <div className="auth-field">
              <label>Full Name</label>
              <input
                className="auth-input"
                type="text"
                placeholder="Jane Doe"
                value={form.full_name}
                onChange={(e) => update('full_name', e.target.value)}
              />
            </div>

            <div className="form-row">
              <div className="auth-field">
                <label>Academic Year</label>
                <select
                  className="auth-input"
                  value={form.academic_year}
                  onChange={(e) => update('academic_year', e.target.value)}
                >
                  <option value="">Select year</option>
                  {ACADEMIC_YEARS.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <div className="auth-field">
                <label>Gender</label>
                <select
                  className="auth-input"
                  value={form.gender}
                  onChange={(e) => update('gender', e.target.value)}
                >
                  <option value="">Select gender</option>
                  {GENDERS.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="auth-field">
              <label>Major</label>
              <input
                className="auth-input"
                type="text"
                placeholder="e.g. Computer Science"
                value={form.major}
                onChange={(e) => update('major', e.target.value)}
              />
            </div>

            <div className="auth-field">
              <label>Contact Info</label>
              <input
                className="auth-input"
                type="text"
                placeholder="Phone number or social handle"
                value={form.contact_info}
                onChange={(e) => update('contact_info', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Step 2 — Housing Preferences */}
        {step === 1 && (
          <div className="onboarding-section">
            <h2 className="onboarding-title">Housing Preferences</h2>

            <div className="auth-field">
              <label>Housing Type</label>
              <select className="auth-input" value={form.housing_type}
                onChange={(e) => {
                  update('housing_type', e.target.value);
                  update('room_type', '');
                }}>
                <option value="">Select housing type</option>
                {HOUSING_TYPES.map((h) => (<option key={h} value={h}>{h}</option>))}
              </select>
            </div>

            <div className="auth-field">
              <label>Room Type</label>
              <select className="auth-input" value={form.room_type}
                onChange={(e) => update('room_type', e.target.value)}>
                <option value="">Select room type</option>
                {ROOM_TYPES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              {form.room_type && ROOM_TYPE_DETAILS[form.room_type] && (
                <p style={{ marginTop: '8px', color: '#475569', fontSize: '0.92rem' }}>
                  {ROOM_TYPE_DETAILS[form.room_type]}
                </p>
              )}
            </div>

            <div className="auth-field">
              <label>Move-in Term</label>
              <select className="auth-input" value={form.move_in_term}
                onChange={(e) => update('move_in_term', e.target.value)}>
                <option value="">Select term</option>
                {MOVE_IN_TERMS.map((t) => (<option key={t} value={t}>{t}</option>))}
              </select>
            </div>

            <p style={{ marginTop: '10px', color: '#64748b', fontSize: '0.92rem' }}>
              Typical progression of amenities: Classic → Deluxe → Plaza → Suites.
            </p>
          </div>
        )}

        {/* Step 3 — Lifestyle */}
        {step === 2 && (
          <div className="onboarding-section">
            <h2 className="onboarding-title">Your Living Style (10 Questions)</h2>

            {LIFESTYLE_QUESTIONS.map((question) => (
              <div className="auth-field" key={question.key}>
                <label>{question.label}</label>
                <select
                  className="auth-input"
                  value={form[question.key]}
                  onChange={(e) => update(question.key, e.target.value)}
                >
                  <option value="">Select an option</option>
                  {question.options.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}

        {/* Step 4 — Review */}
        {step === 3 && (
          <div className="onboarding-section">
            <h2 className="onboarding-title">Review Your Info</h2>
            <div className="review-grid">
              {reviewItems.map(([label, value]) => (
                <div key={label} className="review-item">
                  <span className="review-label">{label}</span>
                  <span className="review-value">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && <p className="auth-error">{error}</p>}

        {/* Navigation */}
        <div className="onboarding-nav">
          <button className="btn btn-ghost" style={{ marginRight: 'auto' }} onClick={() => navigate('/dashboard')}>
            Remind me later
          </button>

          {step > 0 && (
            <button className="btn btn-secondary" onClick={prevStep}>
              Back
            </button>
          )}

          {step < STEPS.length - 1 && (
            <button className="btn btn-primary" onClick={nextStep}>
              Next
            </button>
          )}

          {step === STEPS.length - 1 && (
            <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Saving...' : 'Complete Profile'}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

export default Onboarding;