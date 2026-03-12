const express = require('express');
const pool = require('../config/db');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

const COMPATIBILITY_FIELDS = [
  'sleep_time',
  'wake_time',
  'cleanliness_level',
  'guest_policy',
  'overnight_guest_frequency',
  'sharing_style',
  'noise_tolerance',
  'thermostat_temp',
  'social_energy',
  'conflict_style',
  'academic_year',
  'housing_type',
  'room_type',
  'move_in_term',
];

const FIELD_LABELS = {
  sleep_time: 'Sleep schedule',
  wake_time: 'Wake schedule',
  cleanliness_level: 'Cleanliness',
  guest_policy: 'Guest policy',
  overnight_guest_frequency: 'Overnight guests',
  sharing_style: 'Sharing style',
  noise_tolerance: 'Noise level',
  thermostat_temp: 'Temperature',
  social_energy: 'Social style',
  conflict_style: 'Conflict style',
  academic_year: 'Academic year',
  housing_type: 'Housing type',
  room_type: 'Room type',
  move_in_term: 'Move-in term',
};

function calculateCompatibility(candidate, currentUser) {
  let matches = 0;
  const matchedFactors = [];
  for (const field of COMPATIBILITY_FIELDS) {
    if (candidate[field] && currentUser[field] && candidate[field] === currentUser[field]) {
      matches += 1;
      matchedFactors.push(FIELD_LABELS[field] || field);
    }
  }
  return {
    score: Math.round((matches / COMPATIBILITY_FIELDS.length) * 100),
    matchedFactors,
  };
}

// GET /api/users - paginated list of other users with optional filters
router.get('/', authenticateToken, async (req, res) => {
  const {
    query,
    academic_year,
    major,
    housing_type,
    room_type,
    move_in_term,
    sleep_time,
    guest_policy,
    noise_tolerance,
    cleanliness_level,
    overnight_guest_frequency,
    thermostat_temp,
    social_energy,
    conflict_style,
    page = 1,
    limit = 6,
  } = req.query;
  const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
  const limitNumber = Math.max(parseInt(limit, 10) || 6, 1);
  const offset = (pageNumber - 1) * limitNumber;

  const conditions = ['up.user_id != $1'];
  const values = [req.user.userId];
  let i = 2;

  if (query) {
    conditions.push('(up.full_name ILIKE $' + i + ' OR up.major ILIKE $' + i + ' OR up.housing_type ILIKE $' + i + ' OR up.room_type ILIKE $' + i + ')');
    values.push('%' + query + '%');
    i += 1;
  }
  if (academic_year) { conditions.push('up.academic_year = $' + i++); values.push(academic_year); }
  if (major)         { conditions.push('up.major ILIKE $' + i++);     values.push('%' + major + '%'); }
  if (housing_type)  { conditions.push('up.housing_type = $' + i++);  values.push(housing_type); }
  if (room_type)     { conditions.push('up.room_type = $' + i++);     values.push(room_type); }
  if (move_in_term)  { conditions.push('up.move_in_term = $' + i++);  values.push(move_in_term); }
  if (sleep_time)    { conditions.push('upref.sleep_time = $' + i++); values.push(sleep_time); }
  if (guest_policy)  { conditions.push('upref.guest_policy = $' + i++); values.push(guest_policy); }
  if (noise_tolerance) { conditions.push('upref.noise_tolerance = $' + i++); values.push(noise_tolerance); }
  if (cleanliness_level) { conditions.push('upref.cleanliness_level = $' + i++); values.push(cleanliness_level); }
  if (overnight_guest_frequency) { conditions.push('upref.overnight_guest_frequency = $' + i++); values.push(overnight_guest_frequency); }
  if (thermostat_temp) { conditions.push('upref.thermostat_temp = $' + i++); values.push(thermostat_temp); }
  if (social_energy) { conditions.push('upref.social_energy = $' + i++); values.push(social_energy); }
  if (conflict_style) { conditions.push('upref.conflict_style = $' + i++); values.push(conflict_style); }

  const where = 'WHERE ' + conditions.join(' AND ');

  try {
    const currentUserResult = await pool.query(
      'SELECT up.academic_year, up.housing_type, up.room_type, up.move_in_term, ' +
      'upref.sleep_time, upref.wake_time, upref.cleanliness_level, upref.guest_policy, upref.overnight_guest_frequency, ' +
      'upref.sharing_style, upref.noise_tolerance, upref.thermostat_temp, upref.social_energy, upref.conflict_style ' +
      'FROM user_profiles up ' +
      'INNER JOIN user_preferences upref ON up.user_id = upref.user_id ' +
      'WHERE up.user_id = $1',
      [req.user.userId]
    );
    const currentUser = currentUserResult.rows[0] || null;

    const usersResult = await pool.query(
      'SELECT up.user_id, up.full_name, up.academic_year, up.major, up.gender, ' +
      'up.contact_info, up.housing_type, up.room_type, up.move_in_term, ' +
      'upref.sleep_time, upref.wake_time, upref.thermostat_temp, upref.guest_policy, upref.noise_tolerance, ' +
      'upref.cleanliness_level, upref.overnight_guest_frequency, upref.sharing_style, upref.social_energy, upref.conflict_style ' +
      'FROM user_profiles up ' +
      'INNER JOIN user_preferences upref ON up.user_id = upref.user_id ' +
      where,
      values
    );

    const rankedUsers = usersResult.rows
      .map((user) => {
        const { score, matchedFactors } = currentUser
          ? calculateCompatibility(user, currentUser)
          : { score: 0, matchedFactors: [] };
        return { ...user, compatibility_score: score, matched_factors: matchedFactors };
      })
      .sort((a, b) => {
        if (b.compatibility_score !== a.compatibility_score) {
          return b.compatibility_score - a.compatibility_score;
        }
        return a.full_name.localeCompare(b.full_name);
      });

    const total = rankedUsers.length;
    const paginatedUsers = rankedUsers.slice(offset, offset + limitNumber);

    res.json({
      users: paginatedUsers,
      total,
      page: pageNumber,
      totalPages: Math.max(1, Math.ceil(total / limitNumber)),
    });
  } catch (error) {
    console.error('Users fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/users/:id - single user full profile
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT up.user_id, up.full_name, up.academic_year, up.major, up.gender, ' +
      'up.contact_info, up.housing_type, up.room_type, up.move_in_term, ' +
      'upref.sleep_time, upref.wake_time, upref.thermostat_temp, upref.guest_policy, upref.noise_tolerance, ' +
      'upref.cleanliness_level, upref.overnight_guest_frequency, upref.sharing_style, upref.social_energy, upref.conflict_style ' +
      'FROM user_profiles up ' +
      'INNER JOIN user_preferences upref ON up.user_id = upref.user_id ' +
      'WHERE up.user_id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('User fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;