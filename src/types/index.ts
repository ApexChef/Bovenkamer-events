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
  is_active: boolean;
  deleted_at?: string;
  deleted_by?: string;
  deletion_reason?: string;
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

// User Management Types (US-017)

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  role: 'participant' | 'admin' | 'quizmaster';
  registrationStatus: 'pending' | 'approved' | 'rejected' | 'cancelled';
  emailVerified: boolean;
  isActive: boolean;
  totalPoints: number;
  lastLoginAt?: string;
  createdAt: string;
}

export interface PointsLedgerEntry {
  id: string;
  userId: string;
  source: 'registration' | 'prediction' | 'quiz' | 'game' | 'bonus';
  points: number;
  description: string;
  createdAt: string;
}

export interface AdminUserDetail extends User {
  registrationData?: Registration;
  pointsHistory: PointsLedgerEntry[];
  deletedByUser?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  pendingUsers: number;
  approvedUsers: number;
  adminUsers: number;
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

// Protein distribution (percentages that sum to 100%)
// Renamed from "MeatDistribution" as it includes fish and vegetarian options
export interface MeatDistribution {
  pork: number;       // percentage: varkensvlees
  beef: number;       // percentage: rundvlees
  chicken: number;    // percentage: kip
  game: number;       // percentage: wild
  fish: number;       // percentage: vis & schaaldieren
  vegetarian: number; // percentage: vegetarisch
}

export const DEFAULT_MEAT_DISTRIBUTION: MeatDistribution = {
  pork: 20,
  beef: 20,
  chicken: 20,
  game: 10,
  fish: 15,
  vegetarian: 15,
};

// Drink distribution (percentages that sum to 100%)
export interface DrinkDistribution {
  softDrinks: number; // percentage
  wine: number;       // percentage
  beer: number;       // percentage
}

export const DEFAULT_DRINK_DISTRIBUTION: DrinkDistribution = {
  softDrinks: 0,
  wine: 0,
  beer: 0,
};

// Food & Drink preferences (non-percentage items)
export interface FoodPreferences {
  veggies: number;    // 0-5: groentes & salades
  sauces: number;     // 0-5: mayo/ketchup → chimichurri
}

export const DEFAULT_FOOD_PREFERENCES: FoodPreferences = {
  veggies: 3,
  sauces: 3,
};

// Food & Drink Preferences (separate table)
export type PersonType = 'self' | 'partner';

export interface FoodDrinkPreference {
  id?: string;
  userId: string;
  personType: PersonType;
  // Food
  dietaryRequirements: string;
  meatDistribution: MeatDistribution;
  veggiesPreference: number;
  saucesPreference: number;
  // Drinks
  startsWithBubbles: boolean | null;
  bubbleType: 'champagne' | 'prosecco' | null;
  drinkDistribution: DrinkDistribution;
  softDrinkPreference: string | null;
  softDrinkOther: string;
  waterPreference: 'sparkling' | 'flat' | null;
  winePreference: number | null;
  beerType: 'pils' | 'speciaal' | null;
  // Timestamps
  createdAt?: string;
  updatedAt?: string;
}

export const DEFAULT_FOOD_DRINK_PREFERENCE: Omit<FoodDrinkPreference, 'id' | 'userId' | 'personType' | 'createdAt' | 'updatedAt'> = {
  dietaryRequirements: '',
  meatDistribution: DEFAULT_MEAT_DISTRIBUTION,
  veggiesPreference: 3,
  saucesPreference: 3,
  startsWithBubbles: null,
  bubbleType: null,
  drinkDistribution: DEFAULT_DRINK_DISTRIBUTION,
  softDrinkPreference: null,
  softDrinkOther: '',
  waterPreference: null,
  winePreference: null,
  beerType: null,
};

// Form state types
export interface RegistrationFormData {
  // Step 0 (Auth)
  pin?: string;

  // Basic (minimal registration)
  firstName: string;
  lastName: string;
  name: string; // Computed: firstName + lastName (for backward compatibility)
  email: string;

  // Personal section
  birthDate: string; // YYYY-MM-DD format
  birthYear: number | null; // Legacy, keep for compatibility
  gender: string;
  selfConfidence: number; // 1-10
  hasPartner: boolean;
  partnerFirstName: string;
  partnerLastName: string;
  partnerName: string; // Computed: partnerFirstName + partnerLastName (for backward compatibility)

  // Food & Drinks section
  dietaryRequirements: string;
  partnerDietaryRequirements: string;
  meatDistribution: MeatDistribution;
  drinkDistribution: DrinkDistribution;
  foodPreferences: FoodPreferences; // veggies & sauces only
  startsWithBubbles: boolean | null; // null = not answered, true = yes, false = no
  bubbleType: 'champagne' | 'prosecco' | null; // if startsWithBubbles is true
  softDrinkPreference: string | null; // cola, sinas, spa rood, overige
  softDrinkOther: string; // free text if overige selected
  waterPreference: 'sparkling' | 'flat' | null; // bruisend of plat

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

// JKV Join years (1980-2023)
// Members must be 40+ to join Bovenkamer, so earliest realistic join year is ~1980
export const JKV_JOIN_YEARS = Array.from({ length: 15 }, (_, i) => 2005 + i) as readonly number[];

// JKV Exit years (2020-2025)
// Bovenkamer exists since 2023, so all members must have exited JKV by then
// Minimum exit year is 2020 (realistic for this age group), maximum is 2025
export const JKV_EXIT_YEARS = Array.from({ length: 6 }, (_, i) => 2020 + i) as readonly number[];

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
