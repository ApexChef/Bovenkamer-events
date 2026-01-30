// Bovenkamer Winterproef Types

// Feature Toggle Types
export type FeatureKey =
  | 'show_countdown'
  | 'show_ai_assignment'
  | 'show_leaderboard_preview'
  | 'show_burger_game'
  | 'show_predictions'
  | 'show_live_ranking'
  | 'show_prediction_evaluation'
  | 'show_ratings';

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
  show_prediction_evaluation: boolean;
  show_ratings: boolean;
}

export const DEFAULT_FEATURES: FeatureFlags = {
  show_countdown: true,
  show_ai_assignment: true,
  show_leaderboard_preview: true,
  show_burger_game: false,
  show_predictions: true,
  show_live_ranking: false,
  show_prediction_evaluation: false,
  show_ratings: false,
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

// =============================================================================
// F&B REPORT TYPES (US-014)
// =============================================================================

/**
 * Individual person's food & drink preferences (normalized from database)
 * Used in F&B report for both participants ('self') and partners
 */
export interface PersonPreference {
  name: string;
  personType: 'self' | 'partner';
  userId: string; // For grouping with partner

  // Food preferences
  dietaryRequirements: string | null;
  meatDistribution: MeatDistribution;
  veggiesPreference: number; // 0-5
  saucesPreference: number; // 0-5

  // Drink preferences
  startsWithBubbles: boolean | null;
  bubbleType: 'champagne' | 'prosecco' | null;
  drinkDistribution: DrinkDistribution;
  softDrinkPreference: string | null;
  softDrinkOther: string;
  waterPreference: 'sparkling' | 'flat' | null;
  winePreference: number | null; // 0-100 (0=red, 100=white)
  beerType: 'pils' | 'speciaal' | null;
}

/**
 * Complete F&B report data structure returned by API
 */
export interface FBReportData {
  timestamp: string; // ISO 8601 format
  completionStatus: {
    completed: number; // Users who filled preferences
    totalParticipants: number; // Total active participants
    totalPersons: number; // Participants + partners
    missingParticipants: string[]; // Names of participants who haven't filled preferences
  };
  persons: PersonPreference[]; // Combined self + partner preferences
}

/**
 * Meat category type
 */
export type MeatCategory = 'pork' | 'beef' | 'chicken' | 'game' | 'fish' | 'vegetarian';

/**
 * Statistics for a single meat category
 */
export interface MeatCategoryStat {
  weightedCount: number; // Persons weighted by percentage (e.g., 0.3 + 0.5 = 0.8)
  percentage: number; // Overall percentage across all persons
  kg: number; // Estimated kilograms based on portion size
}

/**
 * Aggregated meat/fish statistics for entire group
 */
export interface MeatStats {
  totalPersons: number;
  totalKg: number; // Total kilograms of all meat/fish
  categories: Record<MeatCategory, MeatCategoryStat>;
}

/**
 * Wine statistics
 */
export interface WineStats {
  totalDrinkers: number; // Weighted count of wine drinkers
  bottles: number; // Total wine bottles needed
  red: {
    bottles: number;
    percentage: number;
  };
  white: {
    bottles: number;
    percentage: number;
  };
}

/**
 * Beer statistics
 */
export interface BeerStats {
  totalDrinkers: number; // Weighted count of beer drinkers
  bottles: number; // Total beer bottles needed
  crates: number; // Number of 24-bottle crates
  pils: {
    count: number; // Number of persons preferring pils
    percentage: number;
  };
  speciaal: {
    count: number; // Number of persons preferring speciaal
    percentage: number;
  };
}

/**
 * Soft drink statistics
 */
export interface SoftDrinkStats {
  totalDrinkers: number; // Weighted count of soft drink drinkers
  breakdown: Record<string, number>; // {cola: 5, sinas: 3, ...}
}

/**
 * Water preference statistics
 */
export interface WaterStats {
  sparkling: number; // Number preferring sparkling
  flat: number; // Number preferring flat
}

/**
 * Bubbles/Aperitif statistics
 */
export interface BubblesStats {
  total: number; // Total persons starting with bubbles
  champagne: {
    count: number; // Number preferring champagne
    bottles: number; // Champagne bottles needed
  };
  prosecco: {
    count: number; // Number preferring prosecco
    bottles: number; // Prosecco bottles needed
  };
}

/**
 * Combined drink statistics
 */
export interface DrinkStats {
  wine: WineStats;
  beer: BeerStats;
  softDrinks: SoftDrinkStats;
  water: WaterStats;
  bubbles: BubblesStats;
}

/**
 * Person with dietary requirements
 */
export interface DietaryPerson {
  name: string;
  isPartner: boolean;
}

/**
 * Grouped dietary requirements by category
 */
export interface DietaryGroups {
  allergies: Array<DietaryPerson & { details: string }>;
  vegetarian: DietaryPerson[];
  vegan: DietaryPerson[];
  other: Array<DietaryPerson & { details: string }>;
}

/**
 * Excel/CSV export row format (flattened data)
 */
export interface FBExportRow {
  Naam: string;
  Type: 'Deelnemer' | 'Partner';
  Dieet: string;
  'Varkensvlees %': number;
  'Rundvlees %': number;
  'Kip %': number;
  'Wild %': number;
  'Vis %': number;
  'Vegetarisch %': number;
  'Groenten (1-5)': number;
  'Sauzen (1-5)': number;
  'Start met bubbels': string;
  'Bubbel type': string;
  'Frisdrank %': number;
  'Wijn %': number;
  'Bier %': number;
  'Wijn voorkeur': string;
  'Bier type': string;
  'Frisdrank keuze': string;
  'Water voorkeur': string;
}

// =============================================================================
// FIELD OPTION TYPES (shared between forms)
// =============================================================================

/**
 * Options for slider-type questions
 */
export interface SliderOptions {
  type: 'slider';
  min: number;
  max: number;
  unit: string;
  hint?: string;
  default?: number;
}

/**
 * Options for select_participant type
 */
export interface SelectParticipantOptions {
  type: 'select_participant';
}

/**
 * Options for boolean (yes/no) questions
 */
export interface BooleanOptions {
  type: 'boolean';
  trueLabel?: string;
  falseLabel?: string;
  trueEmoji?: string;
  falseEmoji?: string;
}

/**
 * Options for time selection questions
 */
export interface TimeOptions {
  type: 'time';
  minHour: number;
  maxHour: number;
  default?: number;
}

/**
 * Options for select with custom choices
 */
export interface SelectOptionsOptions {
  type: 'select_options';
  choices: SelectChoice[];
}

/**
 * Individual choice for select_options type
 */
export interface SelectChoice {
  value: string;
  label: string;
  emoji?: string;
}

// =============================================================================
// DYNAMIC FORM TYPES (US-020)
// =============================================================================

/**
 * All field types supported by the form system.
 * Includes US-019 types (slider, select_participant, boolean, time, select_options)
 * and US-020 types (star_rating, text_short, text_long, checkbox_group, radio_group).
 */
export type FormFieldType =
  | 'slider'
  | 'select_participant'
  | 'boolean'
  | 'time'
  | 'select_options'
  | 'star_rating'
  | 'text_short'
  | 'text_long'
  | 'checkbox_group'
  | 'radio_group';

// New option types for US-020

export interface StarRatingOptions {
  type: 'star_rating';
  maxStars: number;
  default?: number;
}

export interface TextShortOptions {
  type: 'text_short';
  maxLength?: number;
}

export interface TextLongOptions {
  type: 'text_long';
  maxLength?: number;
  rows?: number;
}

export interface CheckboxGroupOptions {
  type: 'checkbox_group';
  choices: SelectChoice[];
}

export interface RadioGroupOptions {
  type: 'radio_group';
  choices: SelectChoice[];
}

/**
 * Discriminated union of all field option types.
 * Use type guards below to narrow based on field_type.
 */
export type FormFieldOptions =
  | SliderOptions
  | SelectParticipantOptions
  | BooleanOptions
  | TimeOptions
  | SelectOptionsOptions
  | StarRatingOptions
  | TextShortOptions
  | TextLongOptions
  | CheckboxGroupOptions
  | RadioGroupOptions;

// --- Entity Types ---

export interface FormDefinition {
  id: string;
  key: string;
  name: string;
  description?: string;
  active_version_id?: string;
  created_at: string;
  updated_at: string;
}

export interface FormVersion {
  id: string;
  form_definition_id: string;
  version_number: number;
  is_published: boolean;
  published_at?: string;
  changelog?: string;
  created_at: string;
  updated_at: string;
}

export interface FormSection {
  id: string;
  form_version_id: string;
  key: string;
  label: string;
  description?: string;
  icon?: string;
  type: 'step' | 'section';
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FormField {
  id: string;
  form_section_id: string;
  key: string;
  label: string;
  description?: string;
  placeholder?: string;
  field_type: FormFieldType;
  options: FormFieldOptions;
  is_required: boolean;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FormResponse {
  id: string;
  user_id: string;
  form_version_id: string;
  status: 'draft' | 'submitted';
  submitted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface FormFieldResponse {
  id: string;
  form_response_id: string;
  form_field_id: string;
  text?: string;
  number?: number;
  boolean?: boolean;
  json?: unknown;
  participant_id?: string;
  created_at: string;
  updated_at: string;
}

// --- API Types ---

/**
 * Complete form structure as returned by GET /api/forms/[key]
 */
export interface FormStructure {
  definition: FormDefinition;
  version: FormVersion;
  sections: FormSectionWithFields[];
}

export interface FormSectionWithFields extends FormSection {
  fields: FormField[];
}

/**
 * Request body for POST /api/forms/[key]/respond
 */
export interface SubmitFormRequest {
  answers: Record<string, unknown>;
}

/**
 * Response from form submission
 */
export interface SubmitFormResult {
  success: boolean;
  response_id: string;
  message: string;
}

/**
 * User's existing response as returned by GET /api/forms/[key]/response
 */
export interface UserFormResponse {
  response: FormResponse;
  answers: Record<string, unknown>;
}

// --- Type Guards ---

export function isStarRatingOptions(options: FormFieldOptions): options is StarRatingOptions {
  return (options as StarRatingOptions).type === 'star_rating';
}

export function isTextShortOptions(options: FormFieldOptions): options is TextShortOptions {
  return (options as TextShortOptions).type === 'text_short';
}

export function isTextLongOptions(options: FormFieldOptions): options is TextLongOptions {
  return (options as TextLongOptions).type === 'text_long';
}

export function isCheckboxGroupOptions(options: FormFieldOptions): options is CheckboxGroupOptions {
  return (options as CheckboxGroupOptions).type === 'checkbox_group';
}

export function isRadioGroupOptions(options: FormFieldOptions): options is RadioGroupOptions {
  return (options as RadioGroupOptions).type === 'radio_group';
}

export function isSliderFieldOptions(options: FormFieldOptions): options is SliderOptions {
  return (options as SliderOptions).type === 'slider';
}

export function isBooleanFieldOptions(options: FormFieldOptions): options is BooleanOptions {
  return (options as BooleanOptions).type === 'boolean';
}

export function isTimeFieldOptions(options: FormFieldOptions): options is TimeOptions {
  return (options as TimeOptions).type === 'time';
}

export function isSelectOptionsFieldOptions(options: FormFieldOptions): options is SelectOptionsOptions {
  return (options as SelectOptionsOptions).type === 'select_options';
}

export function isSelectParticipantFieldOptions(options: FormFieldOptions): options is SelectParticipantOptions {
  return (options as SelectParticipantOptions).type === 'select_participant';
}

// =============================================================================
// MENU & SHOPPING LIST TYPES (US-014 v2)
// =============================================================================

/**
 * Event entity
 */
export interface MenuEvent {
  id: string;
  name: string;
  eventType: 'bbq' | 'diner' | 'lunch' | 'borrel' | 'receptie' | 'overig';
  eventDate: string | null; // ISO date string
  totalPersons: number | null;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  notes: string | null;
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
}

/**
 * Event with course count (for list view)
 */
export interface EventWithCourseCount extends MenuEvent {
  courseCount: number;
}

/**
 * Event course entity
 */
export interface EventCourse {
  id: string;
  eventId: string;
  name: string;
  sortOrder: number;
  gramsPerPerson: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Menu item entity
 */
export interface MenuItem {
  id: string;
  courseId: string;
  name: string;
  itemType: 'protein' | 'side' | 'fixed';
  category: string | null;
  yieldPercentage: number; // 0-100
  wasteDescription: string | null;
  unitWeightGrams: number | null;
  unitLabel: string | null;
  roundingGrams: number | null;
  distributionPercentage: number | null; // Protein only
  gramsPerPerson: number | null; // Fixed only
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Event course with menu items
 */
export interface EventCourseWithItems extends EventCourse {
  menuItems: MenuItem[];
}

/**
 * Event with full details (courses and items)
 */
export interface EventWithDetails extends MenuEvent {
  courses: EventCourseWithItems[];
}

/**
 * Shopping list item (calculated result)
 */
export interface ShoppingListItem {
  menuItemId: string;
  name: string;
  itemType: 'protein' | 'side' | 'fixed';
  category: string | null;
  edibleGrams: number;
  brutoGrams: number;
  purchaseQuantity: number;
  purchaseUnits: number | null; // For fixed units (e.g., 13 hamburgers)
  receivedQuantity: number | null; // Actually received (from purchase order lines)
  surplus: number | null; // receivedQuantity - purchaseQuantity (positive = over, negative = short)
  unit: string; // 'g', 'kg', 'stuks', etc.
  unitLabel: string | null;
  calculation: {
    // Common fields
    yieldPercentage: number;
    brutoGrams: number;
    purchaseQuantity: number;

    // Protein-specific
    totalCourseGrams?: number;
    categoryPercentage?: number;
    categoryGrams?: number;
    distributionPercentage?: number;
    itemEdibleGrams?: number;

    // Side-specific
    numberOfSides?: number;
    perItemGrams?: number;

    // Fixed-specific
    gramsPerPerson?: number;
    totalPersons?: number;

    // Unit-specific
    unitWeightGrams?: number | null;
    roundingGrams?: number | null;
    purchaseUnits?: number | null;
  };
}

/**
 * Shopping list for a single course
 */
export interface ShoppingListCourse {
  courseId: string;
  courseName: string;
  gramsPerPerson: number;
  items: ShoppingListItem[];
  subtotal: {
    totalEdibleGrams: number;
    totalBrutoGrams: number;
    totalPurchaseGrams: number;
    totalReceivedGrams: number | null;
    totalSurplusGrams: number | null;
  };
}

/**
 * Meat distribution breakdown for a protein course
 */
export interface MeatDistributionBreakdown {
  courseId: string;
  courseName: string;
  totalCourseGrams: number;
  categories: Array<{
    category: string;
    percentage: number;      // avg distribution %
    gramsNeeded: number;     // percentage × totalCourseGrams
  }>;
}

/**
 * Complete shopping list for an event
 */
export interface ShoppingList {
  courses: ShoppingListCourse[];
  grandTotal: {
    totalEdibleGrams: number;
    totalBrutoGrams: number;
    totalPurchaseGrams: number;
    totalReceivedGrams: number | null;
    totalSurplusGrams: number | null;
  };
}

/**
 * Shopping list API response
 */
export interface ShoppingListResponse {
  event: {
    id: string;
    name: string;
    totalPersons: number;
  };
  averageMeatDistribution: MeatDistribution;
  meatDistributionBreakdown: MeatDistributionBreakdown[];
  courses: ShoppingListCourse[];
  grandTotal: {
    totalEdibleGrams: number;
    totalBrutoGrams: number;
    totalPurchaseGrams: number;
    totalReceivedGrams: number | null;
    totalSurplusGrams: number | null;
  };
}

/**
 * Form data for creating event
 */
export interface CreateEventData {
  name: string;
  eventType: MenuEvent['eventType'];
  eventDate: string | null;
  totalPersons: number | null;
  status: MenuEvent['status'];
  notes: string;
}

/**
 * Form data for creating course
 */
export interface CreateCourseData {
  name: string;
  sortOrder: number;
  gramsPerPerson: number;
  notes: string;
}

/**
 * Form data for creating menu item
 */
export interface CreateMenuItemData {
  name: string;
  itemType: MenuItem['itemType'];
  category: string | null;
  yieldPercentage: number;
  wasteDescription: string;
  unitWeightGrams: number | null;
  unitLabel: string;
  roundingGrams: number | null;
  distributionPercentage: number | null;
  gramsPerPerson: number | null;
  sortOrder: number;
  isActive: boolean;
}

// =============================================================================
// PURCHASE ORDER TYPES (US-014 Phase 3)
// =============================================================================

export type PurchaseOrderStatus = 'draft' | 'ordered' | 'received' | 'invoiced';
export type POLineCategory = 'food' | 'drink' | 'condiment' | 'herb' | 'non_food' | 'other';

/**
 * Purchase order entity
 */
export interface PurchaseOrder {
  id: string;
  eventId: string;
  supplier: string;
  orderDate: string | null;
  expectedDeliveryDate: string | null;
  status: PurchaseOrderStatus;
  invoiceReference: string | null;
  invoiceDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Purchase order with aggregate summary (for list view)
 */
export interface PurchaseOrderSummary extends PurchaseOrder {
  lineCount: number;
  totalPrice: number | null;
  linkedItemCount: number;
  unlinkedItemCount: number;
}

/**
 * Purchase order line entity
 */
export interface PurchaseOrderLine {
  id: string;
  purchaseOrderId: string;
  menuItemId: string | null;
  name: string;
  description: string | null;
  lineCategory: POLineCategory;
  orderedQuantity: number | null;
  receivedQuantity: number | null;
  unitLabel: string | null;
  unitPrice: number | null;
  totalPrice: number | null;
  supplierArticleNr: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * PO line with menu item context (for detail view)
 */
export interface PurchaseOrderLineWithMenuItem extends PurchaseOrderLine {
  menuItemName: string | null;
  menuItemCourse: string | null;
}

/**
 * Full purchase order with all lines
 */
export interface PurchaseOrderWithLines extends PurchaseOrder {
  lines: PurchaseOrderLineWithMenuItem[];
}

/**
 * Form data for creating/updating a purchase order
 */
export interface CreatePurchaseOrderData {
  supplier: string;
  orderDate: string | null;
  expectedDeliveryDate: string | null;
  status: PurchaseOrderStatus;
  invoiceReference: string;
  invoiceDate: string | null;
  notes: string;
}

/**
 * Form data for creating/updating a PO line
 */
export interface CreatePOLineData {
  menuItemId: string | null;
  name: string;
  description: string;
  lineCategory: POLineCategory;
  orderedQuantity: number | null;
  receivedQuantity: number | null;
  unitLabel: string;
  unitPrice: number | null;
  totalPrice: number | null;
  supplierArticleNr: string;
  notes: string;
}

/**
 * Aggregated procurement data per menu item (from PO lines)
 */
export interface MenuItemProcurement {
  menuItemId: string;
  totalReceivedQuantity: number;
  totalOrderedQuantity: number;
  lineCount: number;
  suppliers: string[];
}
