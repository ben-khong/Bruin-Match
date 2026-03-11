// seed.js — inserts 10 fake UCLA students with complete profiles
// Run once after the server has started (so tables exist):
//   node backend/seed.js
// Safe to re-run: skips users that already exist.

require('dotenv').config({ path: __dirname + '/.env' });
const bcrypt = require('bcrypt');
const pool = require('./config/db');

const SALT_ROUNDS = 10;

// Password for every seed account: "Password123"
const PASSWORD = 'Password123';

const users = [
  {
    username: 'alex_chen',
    email: 'alex.chen@ucla.edu',
    profile: {
      full_name: 'Alex Chen',
      academic_year: 'Junior',
      major: 'Computer Science',
      gender: 'Male',
      contact_info: 'alex.chen@ucla.edu',
      housing_type: 'On-Campus Residence Halls',
      room_type: 'Classic Residence Hall - Double & Triple',
      move_in_term: 'Fall 2026',
    },
    prefs: {
      sleep_time: '12 AM to 2 AM',
      wake_time: '9 AM to 11 AM',
      cleanliness_level: 'Tidy - I clean a few times a week',
      overnight_guest_frequency: 'Rarely (once a month or less)',
      sharing_style: 'Fine sharing some things if asked',
      noise_tolerance: 'Moderate - occasional speakers at low volume',
      thermostat_temp: 'I like it cool (70°F - 75°F)',
      guest_policy: 'Fine with a heads-up',
      social_energy: 'Cordial - we coexist respectfully',
      conflict_style: 'I bring it up calmly after thinking it over',
    },
  },
  {
    username: 'maya_patel',
    email: 'maya.patel@ucla.edu',
    profile: {
      full_name: 'Maya Patel',
      academic_year: 'Sophomore',
      major: 'Biology',
      gender: 'Female',
      contact_info: 'maya.patel@ucla.edu',
      housing_type: 'University Apartments',
      room_type: 'Suites - Double & Triple',
      move_in_term: 'Fall 2026',
    },
    prefs: {
      sleep_time: '10 PM to 12 AM',
      wake_time: '7 AM to 9 AM',
      cleanliness_level: 'Very neat - I clean daily',
      overnight_guest_frequency: 'Never',
      sharing_style: 'Fine sharing some things if asked',
      noise_tolerance: 'Very quiet - headphones always',
      thermostat_temp: 'I like it warm (Above 75°F)',
      guest_policy: 'Occasionally, with advance notice',
      social_energy: 'Friendly - eat meals together sometimes',
      conflict_style: 'I address it right away, face to face',
    },
  },
  {
    username: 'jordan_lee',
    email: 'jordan.lee@ucla.edu',
    profile: {
      full_name: 'Jordan Lee',
      academic_year: 'Freshman',
      major: 'Economics',
      gender: 'Non-binary',
      contact_info: 'jordan.lee@ucla.edu',
      housing_type: 'On-Campus Residence Halls',
      room_type: 'Deluxe Residence Hall - Double & Triple',
      move_in_term: 'Fall 2026',
    },
    prefs: {
      sleep_time: 'Before 10 PM',
      wake_time: 'Before 7 AM',
      cleanliness_level: 'Very neat - I clean daily',
      overnight_guest_frequency: 'Never',
      sharing_style: 'I prefer to keep my stuff separate',
      noise_tolerance: 'Very quiet - headphones always',
      thermostat_temp: 'I like it cold (Below 70°F)',
      guest_policy: 'I prefer minimal visitors',
      social_energy: 'Independent - I keep to myself',
      conflict_style: 'I prefer to text/message about it',
    },
  },
  {
    username: 'sofia_garcia',
    email: 'sofia.garcia@ucla.edu',
    profile: {
      full_name: 'Sofia Garcia',
      academic_year: 'Senior',
      major: 'Psychology',
      gender: 'Female',
      contact_info: 'sofia.garcia@ucla.edu',
      housing_type: 'Off-Campus Apartments',
      room_type: 'Plaza Residences - Double & Triple',
      move_in_term: 'Winter 2026',
    },
    prefs: {
      sleep_time: '12 AM to 2 AM',
      wake_time: '9 AM to 11 AM',
      cleanliness_level: 'Relaxed - I clean when it is noticeable',
      overnight_guest_frequency: 'Sometimes (a few times a month)',
      sharing_style: 'Happy to share everything',
      noise_tolerance: 'I like playing music/videos out loud',
      thermostat_temp: 'I like it warm (Above 75°F)',
      guest_policy: 'Anytime is fine',
      social_energy: 'Best friends - lets hang out all the time',
      conflict_style: 'I address it right away, face to face',
    },
  },
  {
    username: 'marcus_johnson',
    email: 'marcus.johnson@ucla.edu',
    profile: {
      full_name: 'Marcus Johnson',
      academic_year: 'Junior',
      major: 'Political Science',
      gender: 'Male',
      contact_info: 'marcus.johnson@ucla.edu',
      housing_type: 'University Apartments',
      room_type: 'Suites - Double & Triple',
      move_in_term: 'Fall 2026',
    },
    prefs: {
      sleep_time: '10 PM to 12 AM',
      wake_time: '7 AM to 9 AM',
      cleanliness_level: 'Tidy - I clean a few times a week',
      overnight_guest_frequency: 'Rarely (once a month or less)',
      sharing_style: 'Fine sharing some things if asked',
      noise_tolerance: 'Moderate - occasional speakers at low volume',
      thermostat_temp: 'I like it cool (70°F - 75°F)',
      guest_policy: 'Fine with a heads-up',
      social_energy: 'Friendly - eat meals together sometimes',
      conflict_style: 'I bring it up calmly after thinking it over',
    },
  },
  {
    username: 'priya_sharma',
    email: 'priya.sharma@ucla.edu',
    profile: {
      full_name: 'Priya Sharma',
      academic_year: 'Grad',
      major: 'Mathematics',
      gender: 'Female',
      contact_info: 'priya.sharma@ucla.edu',
      housing_type: 'Off-Campus Apartments',
      room_type: 'Suites - Double & Triple',
      move_in_term: 'Spring 2026',
    },
    prefs: {
      sleep_time: '12 AM to 2 AM',
      wake_time: '9 AM to 11 AM',
      cleanliness_level: 'Very neat - I clean daily',
      overnight_guest_frequency: 'Never',
      sharing_style: 'I prefer to keep my stuff separate',
      noise_tolerance: 'Very quiet - headphones always',
      thermostat_temp: 'I like it cold (Below 70°F)',
      guest_policy: 'I prefer minimal visitors',
      social_energy: 'Cordial - we coexist respectfully',
      conflict_style: 'I bring it up calmly after thinking it over',
    },
  },
  {
    username: 'tyler_nguyen',
    email: 'tyler.nguyen@ucla.edu',
    profile: {
      full_name: 'Tyler Nguyen',
      academic_year: 'Sophomore',
      major: 'Mechanical Engineering',
      gender: 'Male',
      contact_info: 'tyler.nguyen@ucla.edu',
      housing_type: 'On-Campus Residence Halls',
      room_type: 'Classic Residence Hall - Double & Triple',
      move_in_term: 'Fall 2026',
    },
    prefs: {
      sleep_time: 'After 2 AM',
      wake_time: 'After 11 AM',
      cleanliness_level: 'Messy does not bother me',
      overnight_guest_frequency: 'Frequently (weekly)',
      sharing_style: 'Happy to share everything',
      noise_tolerance: 'I like playing music/videos out loud',
      thermostat_temp: 'I like it warm (Above 75°F)',
      guest_policy: 'Anytime is fine',
      social_energy: 'Best friends - lets hang out all the time',
      conflict_style: 'I tend to avoid confrontation',
    },
  },
  {
    username: 'emma_wilson',
    email: 'emma.wilson@ucla.edu',
    profile: {
      full_name: 'Emma Wilson',
      academic_year: 'Junior',
      major: 'English Literature',
      gender: 'Female',
      contact_info: 'emma.wilson@ucla.edu',
      housing_type: 'University Apartments',
      room_type: 'Plaza Residences - Double & Triple',
      move_in_term: 'Winter 2026',
    },
    prefs: {
      sleep_time: '10 PM to 12 AM',
      wake_time: '7 AM to 9 AM',
      cleanliness_level: 'Tidy - I clean a few times a week',
      overnight_guest_frequency: 'Rarely (once a month or less)',
      sharing_style: 'Fine sharing some things if asked',
      noise_tolerance: 'Moderate - occasional speakers at low volume',
      thermostat_temp: 'I like it cool (70°F - 75°F)',
      guest_policy: 'Occasionally, with advance notice',
      social_energy: 'Friendly - eat meals together sometimes',
      conflict_style: 'I prefer to text/message about it',
    },
  },
  {
    username: 'kai_tanaka',
    email: 'kai.tanaka@ucla.edu',
    profile: {
      full_name: 'Kai Tanaka',
      academic_year: 'Senior',
      major: 'Film & Television',
      gender: 'Non-binary',
      contact_info: 'kai.tanaka@ucla.edu',
      housing_type: 'Off-Campus Apartments',
      room_type: 'Suites - Double & Triple',
      move_in_term: 'Fall 2026',
    },
    prefs: {
      sleep_time: 'After 2 AM',
      wake_time: 'After 11 AM',
      cleanliness_level: 'Relaxed - I clean when it is noticeable',
      overnight_guest_frequency: 'Sometimes (a few times a month)',
      sharing_style: 'Happy to share everything',
      noise_tolerance: 'It varies a lot day to day',
      thermostat_temp: 'No preference',
      guest_policy: 'Fine with a heads-up',
      social_energy: 'Friendly - eat meals together sometimes',
      conflict_style: 'I bring it up calmly after thinking it over',
    },
  },
  {
    username: 'rachel_kim',
    email: 'rachel.kim@ucla.edu',
    profile: {
      full_name: 'Rachel Kim',
      academic_year: 'Freshman',
      major: 'Neuroscience',
      gender: 'Female',
      contact_info: 'rachel.kim@ucla.edu',
      housing_type: 'On-Campus Residence Halls',
      room_type: 'Deluxe Residence Hall - Double & Triple',
      move_in_term: 'Fall 2026',
    },
    prefs: {
      sleep_time: '10 PM to 12 AM',
      wake_time: '7 AM to 9 AM',
      cleanliness_level: 'Very neat - I clean daily',
      overnight_guest_frequency: 'Never',
      sharing_style: 'Fine sharing some things if asked',
      noise_tolerance: 'Very quiet - headphones always',
      thermostat_temp: 'I like it cool (70°F - 75°F)',
      guest_policy: 'I prefer minimal visitors',
      social_energy: 'Cordial - we coexist respectfully',
      conflict_style: 'I address it right away, face to face',
    },
  },
];

async function seed() {
  const hash = await bcrypt.hash(PASSWORD, SALT_ROUNDS);
  let inserted = 0;
  let skipped = 0;

  for (const u of users) {
    // Check if user already exists
    const exists = await pool.query('SELECT id FROM users WHERE email = $1', [u.email]);
    if (exists.rows.length > 0) {
      console.log(`  skip  ${u.username} (already exists)`);
      skipped++;
      continue;
    }

    // Insert user
    const userRow = await pool.query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
      [u.username, u.email, hash]
    );
    const userId = userRow.rows[0].id;

    // Insert profile
    const p = u.profile;
    await pool.query(
      `INSERT INTO user_profiles
        (user_id, full_name, academic_year, major, gender, contact_info, housing_type, room_type, move_in_term)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [userId, p.full_name, p.academic_year, p.major, p.gender, p.contact_info,
       p.housing_type, p.room_type, p.move_in_term]
    );

    // Insert preferences
    const r = u.prefs;
    await pool.query(
      `INSERT INTO user_preferences
        (user_id, sleep_time, wake_time, cleanliness_level, overnight_guest_frequency,
         sharing_style, noise_tolerance, thermostat_temp, guest_policy, social_energy, conflict_style)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [userId, r.sleep_time, r.wake_time, r.cleanliness_level, r.overnight_guest_frequency,
       r.sharing_style, r.noise_tolerance, r.thermostat_temp, r.guest_policy, r.social_energy, r.conflict_style]
    );

    console.log(`  added ${u.username}`);
    inserted++;
  }

  console.log(`\nDone. ${inserted} inserted, ${skipped} skipped.`);
  console.log(`\nAll accounts use password: ${PASSWORD}`);
  console.log('Usernames: alex_chen, maya_patel, jordan_lee, sofia_garcia, marcus_johnson,');
  console.log('           priya_sharma, tyler_nguyen, emma_wilson, kai_tanaka, rachel_kim');
  await pool.end();
}

seed().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
