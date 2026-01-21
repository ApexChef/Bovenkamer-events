// Bovenkamer Winterproef Types

// Feature Toggle Types
export type FeatureKey =
  | 'show_countdown'
  | 'show_ai_assignment'
  | 'show_leaderboard_preview'
  | 'show_burger_game'
  | 'show_predictions'
  | 'show_live_ranking';

export interface FeatureToggle {
  feature_key: FeatureKey;
  display_name: string;
  description: string;
  is_enabled: boolean;
  updated_at: string;
}

export interface FeatureFlags {
  show_countdown: boolean;
  show_ai_assignment: boolean;
  show_leaderboard_preview: boolean;
  show_burger_game: boolean;
  show_predictions: boolean;
  show_live_ranking: boolean;
}

export const DEFAULT_FEATURES: FeatureFlags = {
  show_countdown: true,
  show_ai_assignment: true,
  show_leaderboard_preview: true,
  show_burger_game: false, // Hidden by default - enable closer to event
  show_predictions: true,
  show_live_ranking: false, // Hidden by default - enable when event starts
};

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'participant' | 'admin' | 'quizmaster';
  auth_code?: string;
  email_verified: boolean;
  registration_status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  rejection_reason?: string;
  approved_at?: string;
  approved_by?: string;
  blocked_features: string[];
  last_login_at?: string;
  total_points: number;
  registration_points: number;
  prediction_points: number;
  quiz_points: number;
  game_points: number;
  created_at: string;
  updated_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'participant' | 'admin' | 'quizmaster';
  emailVerified: boolean;
  registrationStatus: 'pending' | 'approved' | 'rejected' | 'cancelled';
  blockedFeatures: string[];
}

export interface AuthCache {
  user: AuthUser;
  pinHash: string;
  cachedAt: number;
  expiresAt: number;
}

export interface ExpectedParticipant {
  id: string;
  name: string;
  email_hint?: string;
  is_registered: boolean;
}

export interface QuizAnswers {
  guiltyPleasureSong?: string;
  bestConcert?: string;
  movieByHeart?: string;
  secretSeries?: string;
  weirdestFood?: string;
  signatureDish?: string;
  foodRefusal?: string;
  childhoodNickname?: string;
  childhoodDream?: string;
  firstCar?: string;
  hiddenTalent?: string;
  irrationalFear?: string;
  bucketList?: string;
  bestJKMoment?: string;
  longestKnownMember?: string;
}

export interface AIAssignment {
  officialTitle: string;
  task: string;
  reasoning: string;
  warningLevel: 'GROEN' | 'GEEL' | 'ORANJE' | 'ROOD';
  specialPrivilege: string;
}

export interface Predictions {
  wineBottles?: number;
  beerCrates?: number;
  meatKilos?: number;
  firstSleeper?: string;
  spontaneousSinger?: string;
  firstToLeave?: string;      // Wie vertrekt als eerste?
  lastToLeave?: string;       // Wie gaat als laatste naar huis?
  loudestLaugher?: string;
  longestStoryTeller?: string;
  somethingBurned?: boolean;
  outsideTemp?: number;
  lastGuestTime?: number;     // Slider value: 0=19:00, 22=06:00 (half-hour increments)
}

export interface Registration {
  id: string;
  user_id: string;

  // Step 1
  name: string;
  email: string;
  birth_year: number;
  has_partner: boolean;
  partner_name?: string;
  dietary_requirements?: string;

  // Step 2
  primary_skill: string;
  additional_skills?: string;
  music_decade: '80s' | '90s' | '00s' | '10s';
  music_genre: string;

  // Step 3
  quiz_answers: QuizAnswers;

  // AI Assignment
  ai_assignment?: AIAssignment;

  // Predictions
  predictions: Predictions;

  // Status
  is_complete: boolean;
  current_step: number;

  // Meta
  created_at: string;
  updated_at: string;
}

export interface QuizQuestion {
  id: string;
  type: 'multiple_choice' | 'ranking' | 'estimate' | 'true_false' | 'open_voted';
  category: string;
  question: string;
  correct_answer: string;
  options?: string[];
  related_user_id?: string;
  point_value: number;
  time_limit: number;
  is_active: boolean;
  sort_order?: number;
  created_at: string;
}

export interface QuizSession {
  id: string;
  status: 'lobby' | 'active' | 'paused' | 'finished';
  current_question_index: number;
  question_ids: string[];
  created_by: string;
  created_at: string;
  started_at?: string;
  ended_at?: string;
}

export interface QuizPlayer {
  id: string;
  session_id: string;
  user_id: string;
  display_name: string;
  score: number;
  streak: number;
  joined_at: string;
}

export interface QuizAnswer {
  id: string;
  player_id: string;
  question_id: string;
  answer: string;
  is_correct: boolean;
  response_time_ms: number;
  points_earned: number;
  answered_at: string;
}

export interface Rating {
  id: string;
  user_id: string;
  location_rating: number;
  hospitality_rating: number;
  fire_quality_rating: number;
  parking_rating: number;
  overall_rating: number;
  best_aspect?: string;
  improvement_suggestion?: string;
  is_worthy: boolean;
  worthy_explanation?: string;
  created_at: string;
}

// Form state types
export interface RegistrationFormData {
  // Step 0 (Auth)
  pin?: string;

  // Basic (minimal registration)
  name: string;
  email: string;

  // Personal section
  birthDate: string; // YYYY-MM-DD format
  birthYear: number | null; // Legacy, keep for compatibility
  gender: string;
  selfConfidence: number; // 1-10
  hasPartner: boolean;
  partnerName: string;
  dietaryRequirements: string;

  // Skills section (8 categories)
  skills: SkillSelections;
  additionalSkills: string;

  // Music section
  musicDecade: string;
  musicGenre: string;

  // JKV Historie section
  jkvJoinYear: number | null;
  jkvExitYear: number | string | null; // number or 'nog_actief'
  bovenkamerJoinYear: number | null; // Calculated from jkvExitYear

  // Borrel Stats section
  borrelCount2025: number; // How many borrels attended in 2025 (0-10)
  borrelPlanning2026: number; // How many borrels planning to attend in 2026 (0-10)

  // Quiz section
  quizAnswers: QuizAnswers;
}

// Skill options
export const SKILL_OPTIONS = [
  { value: 'cooking', label: 'Koken', description: 'Ik ben een meesterchef' },
  { value: 'bbq', label: 'BBQ-en', description: 'Vlees is mijn passie' },
  { value: 'wine', label: 'Wijn selecteren', description: 'Sommelier in hart en nieren' },
  { value: 'beer', label: 'Bier tappen', description: 'Foutloos schuim' },
  { value: 'dishes', label: 'Afwassen', description: 'Ik hou van schoon' },
  { value: 'fire', label: 'Vuur maken', description: 'Pyromaan in ruste' },
  { value: 'dj', label: 'DJ-en', description: 'Ik bepaal de playlist' },
  { value: 'conversation', label: 'Gesprekken leiden', description: 'Ik praat graag' },
  { value: 'nothing', label: 'Niks', description: 'Ik ben er gewoon' },
  { value: 'organizing', label: 'Organiseren', description: 'Alles onder controle' },
  { value: 'photos', label: "Foto's maken", description: 'Influencer-niveau' },
] as const;

// Skill categories for US-001
export const SKILL_CATEGORIES = {
  food_prep: {
    label: 'Eten bereiden',
    icon: '🍳',
    options: [
      { value: 'cooking', label: 'Koken' },
      { value: 'salads', label: 'Salades maken' },
      { value: 'cutting', label: 'Snijden & voorbereiden' },
      { value: 'marinating', label: 'Marineren' },
      { value: 'nothing', label: 'Niks' },
    ],
  },
  bbq_grill: {
    label: 'BBQ & Grill',
    icon: '🔥',
    options: [
      { value: 'meat', label: 'Vlees grillen' },
      { value: 'fish', label: 'Vis grillen' },
      { value: 'veggie', label: 'Vegetarisch' },
      { value: 'fire_watch', label: 'Vuur bewaken' },
      { value: 'nothing', label: 'Niks' },
    ],
  },
  drinks: {
    label: 'Dranken',
    icon: '🍷',
    options: [
      { value: 'wine', label: 'Wijn selecteren' },
      { value: 'beer', label: 'Bier tappen' },
      { value: 'cocktails', label: 'Cocktails mixen' },
      { value: 'coffee', label: 'Koffie & thee' },
      { value: 'nothing', label: 'Niks' },
    ],
  },
  entertainment: {
    label: 'Entertainment',
    icon: '🎵',
    options: [
      { value: 'dj', label: 'DJ-en / Muziek' },
      { value: 'games', label: 'Spelletjes organiseren' },
      { value: 'karaoke', label: 'Karaoke' },
      { value: 'stories', label: 'Verhalen vertellen' },
      { value: 'nothing', label: 'Niks' },
    ],
  },
  atmosphere: {
    label: 'Sfeer',
    icon: '✨',
    options: [
      { value: 'fire', label: 'Vuur maken & onderhouden' },
      { value: 'decoration', label: 'Decoratie' },
      { value: 'lighting', label: 'Verlichting' },
      { value: 'comfort', label: 'Zitplekken regelen' },
      { value: 'nothing', label: 'Niks' },
    ],
  },
  social: {
    label: 'Sociaal',
    icon: '💬',
    options: [
      { value: 'conversation', label: 'Gesprekken leiden' },
      { value: 'introducing', label: 'Mensen voorstellen' },
      { value: 'host', label: 'Gastheer/vrouw' },
      { value: 'mediator', label: 'Bemiddelaar' },
      { value: 'nothing', label: 'Niks' },
    ],
  },
  cleanup: {
    label: 'Opruimen',
    icon: '🧹',
    options: [
      { value: 'dishes', label: 'Afwassen' },
      { value: 'tidying', label: 'Opruimen' },
      { value: 'garbage', label: 'Afval verwerken' },
      { value: 'organizing', label: 'Organiseren' },
      { value: 'nothing', label: 'Niks' },
    ],
  },
  documentation: {
    label: 'Documentatie',
    icon: '📸',
    options: [
      { value: 'photos', label: "Foto's maken" },
      { value: 'video', label: 'Video opnemen' },
      { value: 'social_media', label: 'Social media' },
      { value: 'memories', label: 'Herinneringen vastleggen' },
      { value: 'nothing', label: 'Niks' },
    ],
  },
} as const;

export type SkillCategoryKey = keyof typeof SKILL_CATEGORIES;

export interface SkillSelections {
  food_prep: string;
  bbq_grill: string;
  drinks: string;
  entertainment: string;
  atmosphere: string;
  social: string;
  cleanup: string;
  documentation: string;
}

export const MUSIC_DECADES = [
  { value: '80s', label: "80's", description: 'Synthpop en power ballads' },
  { value: '90s', label: "90's", description: 'Grunge, dance en eurodance' },
  { value: '00s', label: "00's", description: 'Pop-punk en R&B' },
  { value: '10s', label: "10's", description: 'EDM en streaming hits' },
] as const;

export const MUSIC_GENRES = [
  { value: 'pop', label: 'Pop' },
  { value: 'rock', label: 'Rock' },
  { value: 'dance', label: 'Dance / Electronic' },
  { value: 'hiphop', label: 'Hip-Hop / R&B' },
  { value: 'dutch', label: 'Nederlandstalig' },
  { value: 'metal', label: 'Metal / Hard Rock' },
  { value: 'jazz', label: 'Jazz / Blues' },
  { value: 'classical', label: 'Klassiek' },
  { value: 'country', label: 'Country / Folk' },
  { value: 'reggae', label: 'Reggae / Ska' },
] as const;

export const BIRTH_YEARS = Array.from({ length: 30 }, (_, i) => 1960 + i) as readonly number[];

// Gender options
export const GENDER_OPTIONS = [
  { value: 'man', label: 'Man' },
  { value: 'vrouw', label: 'Vrouw' },
  { value: 'anders', label: 'Anders' },
  { value: 'zeg_ik_niet', label: 'Zeg ik niet' },
] as const;

// JKV Join years (1990-2025)
export const JKV_JOIN_YEARS = Array.from({ length: 36 }, (_, i) => 1990 + i) as readonly number[];

// JKV Exit years (2000-2030 + "Nog actief")
export const JKV_EXIT_YEARS = Array.from({ length: 31 }, (_, i) => 2000 + i) as readonly number[];
export const JKV_STILL_ACTIVE = 'nog_actief' as const;

// Borrel dates 2025 (past - "geweest" tracking)
export const BORRELS_2025 = [
  { date: '2025-01-23', label: '23 januari 2025' },
  { date: '2025-02-27', label: '27 februari 2025' },
  { date: '2025-03-27', label: '27 maart 2025' },
  { date: '2025-04-24', label: '24 april 2025' },
  { date: '2025-05-22', label: '22 mei 2025' },
  { date: '2025-06-26', label: '26 juni 2025' },
  // juli vervalt
  { date: '2025-08-28', label: '28 augustus 2025' },
  { date: '2025-09-25', label: '25 september 2025' },
  { date: '2025-10-23', label: '23 oktober 2025' },
  { date: '2025-11-27', label: '27 november 2025' },
  // december vervalt
] as const;

// Borrel dates 2026 (future - "planning" tracking)
export const BORRELS_2026 = [
  { date: '2026-01-22', label: '22 januari 2026' },
  { date: '2026-02-26', label: '26 februari 2026' },
  { date: '2026-03-26', label: '26 maart 2026' },
  { date: '2026-04-23', label: '23 april 2026', note: 'Meivakantie' },
  { date: '2026-05-28', label: '28 mei 2026' },
  { date: '2026-06-25', label: '25 juni 2026' },
  // juli vervalt
  { date: '2026-08-27', label: '27 augustus 2026' },
  { date: '2026-09-24', label: '24 september 2026' },
  { date: '2026-10-22', label: '22 oktober 2026', note: 'Herfstvakantie' },
  { date: '2026-11-26', label: '26 november 2026' },
  // december vervalt
] as const;
