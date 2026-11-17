// Nigerian states + relationship intents + site constants for MeetAm.
// Imported by the browse feed, dashboard, and onboarding flows.

export const NIGERIAN_STATES = [
  'Abia',
  'Abuja (FCT)',
  'Adamawa',
  'Akwa Ibom',
  'Anambra',
  'Bauchi',
  'Bayelsa',
  'Benue',
  'Borno',
  'Cross River',
  'Delta',
  'Ebonyi',
  'Ekiti',
  'Enugu',
  'Gombe',
  'Imo',
  'Jigawa',
  'Kaduna',
  'Kano',
  'Katsina',
  'Kebbi',
  'Kogi',
  'Kwara',
  'Lagos',
  'Nasarawa',
  'Niger',
  'Ogun',
  'Ondo',
  'Osun',
  'Oyo',
  'Plateau',
  'Rivers',
  'Sokoto',
  'Taraba',
  'Yobe',
  'Zamfara',
];

export const STATE_LOOKUP = Object.fromEntries(
  NIGERIAN_STATES.map((s) => [s.toLowerCase().replace(/\s+/g, ' '), s])
);

// Relationship intents. `defaultIntentValues` is the filter default that
// matches the product spec (Serious Relationship, Marriage, Friends,
// Casual Dating).
export const INTENTS = [
  { value: 'serious_relationship', label: 'Serious Relationship' },
  { value: 'marriage', label: 'Marriage' },
  { value: 'friends', label: 'Friends' },
  { value: 'casual_dating', label: 'Casual Dating' },
];

export const INTENT_LOOKUP = Object.fromEntries(
  INTENTS.map((i) => [i.value, i.label])
);

export const DEFAULT_INTENT_VALUES = ['serious_relationship', 'marriage'];

export const PUBLIC_PROFILE_FIELDS = [
  'id',
  'display_name',
  'age',
  'gender',
  'intent',
  'state',
  'area',
  'tribe',
  'religion',
  'occupation',
  'height',
  'body_type',
  'about_me',
  'looking_for',
  'is_active',
  'is_featured',
  'featured_until',
  'created_at',
];

export const SUPPORT_WHATSAPP = 'https://wa.me/2348012345678';

export const PAYSTACK_BUNDLES = [
  { credits: 1, amountNgn: 1000, label: '1 Credit — ₦1,000' },
  { credits: 3, amountNgn: 2800, label: '3 Credits — ₦2,800' },
  { credits: 5, amountNgn: 4500, label: '5 Credits — ₦4,500' },
  { credits: 10, amountNgn: 8500, label: '10 Credits — ₦8,500' },
];
