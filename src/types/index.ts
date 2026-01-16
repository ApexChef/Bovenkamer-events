// Bovenkamer Winterproef Types

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'participant' | 'admin' | 'quizmaster';
  auth_code?: string;
  total_points: number;
  registration_points: number;
  prediction_points: number;
  quiz_points: number;
  game_points: number;
  created_at: string;
  updated_at: string;
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
  // Step 1
  name: string;
  email: string;
  birthYear: number | null;
  hasPartner: boolean;
  partnerName: string;
  dietaryRequirements: string;

  // Step 2
  primarySkill: string;
  additionalSkills: string;
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
