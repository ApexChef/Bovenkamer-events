// Bovenkamer Winterproef Types

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
  lastToLeave?: string;
  loudestLaugher?: string;
  longestStoryTeller?: string;
  somethingBurned?: boolean;
  outsideTemp?: number;
  lastGuestTime?: string;
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

  // Step 1
  name: string;
  email: string;
  birthYear: number | null;
  hasPartner: boolean;
  partnerName: string;
  dietaryRequirements: string;

  // Step 2 - Skills (8 categories)
  skills: SkillSelections;
  additionalSkills: string;

  // Step 2 - Music
  musicDecade: string;
  musicGenre: string;

  // Step 3
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

export const BIRTH_YEARS = [1980, 1981, 1982, 1983, 1984, 1985, 1986] as const;
