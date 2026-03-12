// Single source of truth for all profile/preference dropdown options.
// Import from this file in Onboarding.jsx, Profile.jsx, and Browse.jsx.

export const ACADEMIC_YEARS = ['Freshman', 'Sophomore', 'Junior', 'Senior', 'Grad'];

export const GENDERS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

export const HOUSING_TYPES = [
  'On-Campus Residence Halls',
  'University Apartments',
  'Off-Campus Apartments',
];

export const ROOM_TYPES_BY_HOUSING = {
  'On-Campus Residence Halls': [
    'Classic Residence Hall - Double & Triple',
    'Deluxe Residence Hall - Double & Triple',
    'Plaza Residences - Double & Triple',
    'Suites - Double & Triple',
  ],
  'University Apartments': [
    'Gayley Court',
    'Gayley Towers',
    'Glenrock',
    'Glenrock West',
    'Landfair',
    'Landfair Vista',
    'Levering Terrace',
    'Westwood Chateau',
    'Westwood Palm',
  ],
  'Off-Campus Apartments': [
    'Off-Campus (looking for roommate)',
  ],
};

export const ROOM_TYPES = [
  ...ROOM_TYPES_BY_HOUSING['On-Campus Residence Halls'],
  ...ROOM_TYPES_BY_HOUSING['University Apartments'],
  ...ROOM_TYPES_BY_HOUSING['Off-Campus Apartments'],
];

export function getRoomTypesForHousing(housingType) {
  return ROOM_TYPES_BY_HOUSING[housingType] || ROOM_TYPES;
}

export const MOVE_IN_TERMS = [
  'Fall 2025',
  'Winter 2026',
  'Spring 2026',
  'Fall 2026',
  'Winter 2027',
  'Spring 2027',
];

export const SLEEP_TIMES = [
  'Before 10 PM',
  '10 PM to 12 AM',
  '12 AM to 2 AM',
  'After 2 AM',
];

export const WAKE_TIMES = [
  'Before 7 AM',
  '7 AM to 9 AM',
  '9 AM to 11 AM',
  'After 11 AM',
];

export const THERMOSTAT_PREFERENCES = [
  'I like it cold (Below 70°F)',
  'I like it cool (70°F - 75°F)',
  'I like it warm (Above 75°F)',
  'No preference',
];

export const GUEST_POLICIES = [
  'Anytime is fine',
  'Fine with a heads-up',
  'Occasionally, with advance notice',
  'I prefer minimal visitors',
];

export const NOISE_TOLERANCES = [
  'Very quiet - headphones always',
  'Moderate - occasional speakers at low volume',
  'I like playing music/videos out loud',
  'It varies a lot day to day',
];

export const CLEANLINESS_LEVELS = [
  'Very neat - I clean daily',
  'Tidy - I clean a few times a week',
  'Relaxed - I clean when it is noticeable',
  'Messy does not bother me',
];

export const OVERNIGHT_GUEST_OPTIONS = [
  'Never',
  'Rarely (once a month or less)',
  'Sometimes (a few times a month)',
  'Frequently (weekly)',
];

export const SHARING_STYLES = [
  'Happy to share everything',
  'Fine sharing some things if asked',
  'I prefer to keep my stuff separate',
  'Absolutely not - everything stays separate',
];

export const SOCIAL_ENERGIES = [
  'Best friends - lets hang out all the time',
  'Friendly - eat meals together sometimes',
  'Cordial - we coexist respectfully',
  'Independent - I keep to myself',
];

export const CONFLICT_STYLES = [
  'I address it right away, face to face',
  'I bring it up calmly after thinking it over',
  'I prefer to text/message about it',
  'I tend to avoid confrontation',
];
