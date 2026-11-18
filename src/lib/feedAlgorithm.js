/**
 * MeetAm Feed Ranking Algorithm
 * ─────────────────────────────
 * Pure client-side scoring that runs after Supabase returns profiles.
 * Profiles are scored and sorted before rendering — no extra DB calls needed.
 *
 * Scoring signals (additive):
 *  +100  Boosted profile (is_featured + featured_until valid)
 *  + 40  Same Nigerian state as viewer
 *  + 30  Compatible relationship intent
 *  + 25  Same tribe / ethnicity
 *  + 20  Profile completeness (bio, occupation, interests, handles, photo)
 *  + 15  New member (joined within 7 days)
 *  + 10  Has WhatsApp number set
 *  -  5  Already unlocked by viewer (de-prioritise – they've connected)
 */

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/** Which intents are considered "compatible" with each other */
const COMPATIBLE_INTENTS = {
  serious_relationship: ['serious_relationship', 'marriage'],
  marriage: ['marriage', 'serious_relationship'],
  casual_dating: ['casual_dating', 'friends'],
  friends: ['friends', 'casual_dating'],
};

/**
 * @param {object} profile     – A single profile row from Supabase
 * @param {object} viewerMeta  – { state, tribe, intent } of the logged-in user
 * @param {Set}    unlockedSet – Set of profile IDs the viewer has already unlocked
 * @returns {number} score
 */
export function scoreProfile(profile, viewerMeta, unlockedSet) {
  let score = 0;

  // 1. Boost (paid feature – always surfaces first)
  if (
    profile.is_featured &&
    profile.featured_until &&
    new Date(profile.featured_until) > new Date()
  ) {
    score += 100;
  }

  // 2. Same state → local discovery
  if (
    viewerMeta.state &&
    (profile.state || profile.location_state) &&
    (profile.state || profile.location_state)
      .toLowerCase()
      .trim() === viewerMeta.state.toLowerCase().trim()
  ) {
    score += 40;
  }

  // 3. Compatible intent
  if (viewerMeta.intent && profile.intent) {
    const compat = COMPATIBLE_INTENTS[viewerMeta.intent] || [];
    if (compat.includes(profile.intent)) {
      score += 30;
    }
  }

  // 4. Same tribe
  if (
    viewerMeta.tribe &&
    profile.tribe &&
    profile.tribe.toLowerCase().trim() === viewerMeta.tribe.toLowerCase().trim()
  ) {
    score += 25;
  }

  // 5. Profile completeness (max +20, each filled field = +4)
  const completenessFields = [
    profile.about_me || profile.bio,
    profile.occupation,
    profile.interests?.length > 0,
    profile.whatsapp_number,
    profile.height,
  ];
  score += completenessFields.filter(Boolean).length * 4;

  // 6. New member (joined within 7 days)
  if (profile.created_at) {
    const age = Date.now() - new Date(profile.created_at).getTime();
    if (age < SEVEN_DAYS_MS) score += 15;
  }

  // 7. Has WhatsApp → actually useful to unlock
  if (profile.whatsapp_number) score += 10;

  // 8. Already unlocked → slight de-prioritise
  if (unlockedSet.has(profile.id)) score -= 5;

  return score;
}

/**
 * Sort an array of profiles by descending rank score.
 * Profiles with equal scores preserve their original Supabase order
 * (which is already: featured → newest).
 *
 * @param {object[]} profiles
 * @param {object}   viewerMeta  – { state, tribe, intent }
 * @param {string[]} unlockedIds – array of already-unlocked profile IDs
 * @returns {object[]} sorted profiles with _score attached (for debugging)
 */
export function rankProfiles(profiles, viewerMeta = {}, unlockedIds = []) {
  const unlockedSet = new Set(unlockedIds);
  return [...profiles]
    .map((p) => ({ ...p, _score: scoreProfile(p, viewerMeta, unlockedSet) }))
    .sort((a, b) => b._score - a._score);
}
