const express = require('express');
const pool = require('../config/db');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

// Check if user data exists
router.get('/', authenticateToken, async (req, res) => {
  try {
    const accountResult = await pool.query(
      'SELECT username, email FROM users WHERE id = $1',
      [req.user.userId]
    );
    const profileResult = await pool.query(
      'SELECT * FROM user_profiles WHERE user_id = $1',
      [req.user.userId]
    );
    const prefsResult = await pool.query(
      'SELECT * FROM user_preferences WHERE user_id = $1',
      [req.user.userId]
    );

    const hasProfile = profileResult.rows.length > 0;
    const hasPreferences = prefsResult.rows.length > 0;

    res.json({
      hasProfile,
      hasPreferences,
      account: accountResult.rows[0] || null,
      profile: hasProfile ? profileResult.rows[0] : null,
      preferences: hasPreferences ? prefsResult.rows[0] : null,
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create profile + preferences
router.post('/', authenticateToken, async (req, res) => {
  const {
    // Profile fields
    full_name,
    academic_year,
    major,
    gender,
    contact_info,
    housing_type,
    room_type,
    move_in_term,
    // Preferences fields
    sleep_time,
    wake_time,
    thermostat_temp,
    guest_policy,
    noise_tolerance,
    cleanliness_level,
    overnight_guest_frequency,
    sharing_style,
    social_energy,
    conflict_style,
  } = req.body;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Update profile even if data alredy exists
    const profileResult = await client.query(
      'INSERT INTO user_profiles' +
      ' (user_id, full_name, academic_year, major, gender, contact_info, housing_type, room_type, move_in_term)' +
      ' VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)' +
      ' ON CONFLICT (user_id) DO UPDATE SET' +
      ' full_name = EXCLUDED.full_name,' +
      ' academic_year = EXCLUDED.academic_year,' +
      ' major = EXCLUDED.major,' +
      ' gender = EXCLUDED.gender,' +
      ' contact_info = EXCLUDED.contact_info,' +
      ' housing_type = EXCLUDED.housing_type,' +
      ' room_type = EXCLUDED.room_type,' +
      ' move_in_term = EXCLUDED.move_in_term' +
      ' RETURNING *',
      [req.user.userId, full_name, academic_year, major, gender, contact_info, housing_type, room_type, move_in_term]
    );

    const prefsResult = await client.query(
      'INSERT INTO user_preferences' +
      ' (user_id, sleep_time, wake_time, thermostat_temp, guest_policy, noise_tolerance, cleanliness_level, overnight_guest_frequency, sharing_style, social_energy, conflict_style)' +
      ' VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)' +
      ' ON CONFLICT (user_id) DO UPDATE SET' +
      ' sleep_time = EXCLUDED.sleep_time,' +
      ' wake_time = EXCLUDED.wake_time,' +
      ' thermostat_temp = EXCLUDED.thermostat_temp,' +
      ' guest_policy = EXCLUDED.guest_policy,' +
      ' noise_tolerance = EXCLUDED.noise_tolerance,' +
      ' cleanliness_level = EXCLUDED.cleanliness_level,' +
      ' overnight_guest_frequency = EXCLUDED.overnight_guest_frequency,' +
      ' sharing_style = EXCLUDED.sharing_style,' +
      ' social_energy = EXCLUDED.social_energy,' +
      ' conflict_style = EXCLUDED.conflict_style' +
      ' RETURNING *',
      [
        req.user.userId,
        sleep_time,
        wake_time,
        thermostat_temp,
        guest_policy,
        noise_tolerance,
        cleanliness_level,
        overnight_guest_frequency,
        sharing_style,
        social_energy,
        conflict_style,
      ]
    );

    await client.query('COMMIT');

    res.status(200).json({
      profile: profileResult.rows[0],
      preferences: prefsResult.rows[0],
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Profile upsert error:', error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

module.exports = router;
