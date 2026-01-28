import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { RegistrationFormData, QuizAnswers, AIAssignment, Predictions, AuthUser, AuthCache, SkillSelections, SkillCategoryKey } from '@/types';

// Profile sections for progressive registration
export interface ProfileSections {
  basic: boolean;        // Name, email (always true after minimal registration)
  personal: boolean;     // Birth date, gender, selfConfidence, partner
  foodDrinks: boolean;   // Dietary requirements, food & drink preferences
  skills: boolean;       // Primary + additional skills
  music: boolean;        // Music decade, genre
  jkvHistorie: boolean;  // JKV join/exit years, Bovenkamer join year
  borrelStats: boolean;  // Borrel attendance 2025 & planning 2026
  quiz: boolean;         // Quiz answers
}

// Points per section
// Note: foodDrinks removed - now separate page at /eten-drinken (not part of profile points)
export const SECTION_POINTS = {
  basic: 10,
  personal: 50,
  skills: 40,
  music: 20,
  jkvHistorie: 30,
  borrelStats: 30,
  quiz: 80,
} as const;

export const TOTAL_PROFILE_POINTS = Object.values(SECTION_POINTS).reduce((a, b) => a + b, 0);

// Attendance data for event confirmation
export interface AttendanceData {
  confirmed: boolean | null;       // null = not answered, true = coming, false = not coming
  bringingPlusOne: boolean | null; // null = not answered
  plusOneName: string;
  declineReason: string | null;
  customDeclineReason: string;
}

interface RegistrationState {
  // Form data
  formData: RegistrationFormData;
  currentStep: number;
  isSubmitting: boolean;
  isComplete: boolean;

  // Profile completion tracking
  completedSections: ProfileSections;

  // Attendance confirmation
  attendance: AttendanceData;

  // AI Assignment result
  aiAssignment: AIAssignment | null;

  // User session (simple auth)
  userId: string | null;
  authCode: string | null;

  // Hydration status
  _hasHydrated: boolean;

  // Actions
  setFormData: (data: Partial<RegistrationFormData>) => void;
  setQuizAnswer: (key: keyof QuizAnswers, value: string) => void;
  setSkill: (category: SkillCategoryKey, value: string) => void;
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setSubmitting: (isSubmitting: boolean) => void;
  setComplete: (isComplete: boolean) => void;
  setAIAssignment: (assignment: AIAssignment) => void;
  setUser: (userId: string, authCode: string) => void;
  setHasHydrated: (state: boolean) => void;
  markSectionComplete: (section: keyof ProfileSections) => void;
  setCompletedSections: (sections: Partial<ProfileSections>) => void;
  getProfileCompletion: () => { percentage: number; points: number; completedSections: string[] };
  setAttendance: (data: Partial<AttendanceData>) => void;
  reset: () => void;
}

const initialSkills: SkillSelections = {
  food_prep: '',
  bbq_grill: '',
  drinks: '',
  entertainment: '',
  atmosphere: '',
  social: '',
  cleanup: '',
  documentation: '',
};

const initialFormData: RegistrationFormData = {
  pin: '',
  firstName: '',
  lastName: '',
  name: '', // Computed
  email: '',
  // Personal
  birthDate: '',
  birthYear: null,
  gender: '',
  selfConfidence: 5,
  hasPartner: false,
  partnerFirstName: '',
  partnerLastName: '',
  partnerName: '', // Computed
  // Food & Drinks
  dietaryRequirements: '',
  partnerDietaryRequirements: '',
  meatDistribution: {
    pork: 20,
    beef: 20,
    chicken: 20,
    game: 10,
    fish: 15,
    vegetarian: 15,
  },
  drinkDistribution: {
    softDrinks: 20,
    wine: 40,
    beer: 40,
  },
  foodPreferences: {
    veggies: 3,
    sauces: 3,
  },
  startsWithBubbles: null,
  bubbleType: null,
  softDrinkPreference: null,
  softDrinkOther: '',
  waterPreference: null,
  // Skills (8 categories)
  skills: initialSkills,
  additionalSkills: '',
  // Music
  musicDecade: '',
  musicGenre: '',
  // JKV Historie
  jkvJoinYear: null,
  jkvExitYear: null,
  bovenkamerJoinYear: null,
  // Borrel Stats
  borrelCount2025: 0,
  borrelPlanning2026: 0,
  // Quiz
  quizAnswers: {},
};

const initialCompletedSections: ProfileSections = {
  basic: false,
  personal: false,
  foodDrinks: false,
  skills: false,
  music: false,
  jkvHistorie: false,
  borrelStats: false,
  quiz: false,
};

const initialAttendance: AttendanceData = {
  confirmed: null,
  bringingPlusOne: null,
  plusOneName: '',
  declineReason: null,
  customDeclineReason: '',
};

export const useRegistrationStore = create<RegistrationState>()(
  persist(
    (set, get) => ({
      formData: initialFormData,
      currentStep: 0,
      isSubmitting: false,
      isComplete: false,
      completedSections: initialCompletedSections,
      attendance: initialAttendance,
      aiAssignment: null,
      userId: null,
      authCode: null,
      _hasHydrated: false,

      setFormData: (data) =>
        set((state) => ({
          formData: { ...state.formData, ...data },
        })),

      setQuizAnswer: (key, value) =>
        set((state) => ({
          formData: {
            ...state.formData,
            quizAnswers: { ...state.formData.quizAnswers, [key]: value },
          },
        })),

      setSkill: (category, value) =>
        set((state) => ({
          formData: {
            ...state.formData,
            skills: { ...state.formData.skills, [category]: value },
          },
        })),

      setCurrentStep: (step) => set({ currentStep: step }),

      nextStep: () =>
        set((state) => ({ currentStep: Math.min(state.currentStep + 1, 5) })),

      prevStep: () =>
        set((state) => ({ currentStep: Math.max(state.currentStep - 1, 0) })),

      setSubmitting: (isSubmitting) => set({ isSubmitting }),

      setComplete: (isComplete) => set({ isComplete }),

      setAIAssignment: (assignment) => set({ aiAssignment: assignment }),

      setAttendance: (data) =>
        set((state) => ({
          attendance: { ...state.attendance, ...data },
        })),

      setUser: (userId, authCode) => set({ userId, authCode }),

      setHasHydrated: (state) => set({ _hasHydrated: state }),

      markSectionComplete: (section) =>
        set((state) => ({
          completedSections: { ...state.completedSections, [section]: true },
        })),

      setCompletedSections: (sections) =>
        set((state) => ({
          completedSections: { ...state.completedSections, ...sections },
        })),

      getProfileCompletion: () => {
        const state = get();
        const completed = state.completedSections;
        const completedSections: string[] = [];
        let points = 0;

        if (completed.basic) {
          completedSections.push('basic');
          points += SECTION_POINTS.basic;
        }
        if (completed.personal) {
          completedSections.push('personal');
          points += SECTION_POINTS.personal;
        }
        // foodDrinks removed - now separate page at /eten-drinken
        if (completed.skills) {
          completedSections.push('skills');
          points += SECTION_POINTS.skills;
        }
        if (completed.music) {
          completedSections.push('music');
          points += SECTION_POINTS.music;
        }
        if (completed.jkvHistorie) {
          completedSections.push('jkvHistorie');
          points += SECTION_POINTS.jkvHistorie;
        }
        if (completed.borrelStats) {
          completedSections.push('borrelStats');
          points += SECTION_POINTS.borrelStats;
        }
        if (completed.quiz) {
          completedSections.push('quiz');
          points += SECTION_POINTS.quiz;
        }

        const percentage = Math.round((points / TOTAL_PROFILE_POINTS) * 100);

        return { percentage, points, completedSections };
      },

      reset: () =>
        set({
          formData: initialFormData,
          currentStep: 1,
          isSubmitting: false,
          isComplete: false,
          completedSections: initialCompletedSections,
          attendance: initialAttendance,
          aiAssignment: null,
        }),
    }),
    {
      name: 'bovenkamer-registration',
      partialize: (state) => ({
        formData: state.formData,
        currentStep: state.currentStep,
        isComplete: state.isComplete,
        completedSections: state.completedSections,
        attendance: state.attendance,
        aiAssignment: state.aiAssignment,
        userId: state.userId,
        authCode: state.authCode,
      }),
      // Deep merge to handle new fields added to nested objects
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<RegistrationState>;
        return {
          ...currentState,
          ...persisted,
          // Deep merge formData to preserve new fields
          formData: {
            ...currentState.formData,
            ...(persisted.formData || {}),
            // Ensure skills is properly merged
            skills: {
              ...currentState.formData.skills,
              ...(persisted.formData?.skills || {}),
            },
            quizAnswers: {
              ...currentState.formData.quizAnswers,
              ...(persisted.formData?.quizAnswers || {}),
            },
          },
          // Deep merge completedSections to add new fields
          completedSections: {
            ...currentState.completedSections,
            ...(persisted.completedSections || {}),
          },
          // Deep merge attendance
          attendance: {
            ...currentState.attendance,
            ...(persisted.attendance || {}),
          },
        };
      },
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

// Event start time - predictions are locked after this
export const EVENT_START = new Date('2026-01-31T16:00:00');

// Predictions store
interface PredictionsState {
  predictions: Predictions;
  isDraft: boolean;        // true = saved as draft, can still edit
  isSubmitted: boolean;    // true = definitively submitted
  setPrediction: <K extends keyof Predictions>(key: K, value: Predictions[K]) => void;
  saveDraft: () => void;
  submitFinal: () => void;
  canEdit: () => boolean;  // false after event starts
  reset: () => void;
}

export const usePredictionsStore = create<PredictionsState>()(
  persist(
    (set, get) => ({
      predictions: {},
      isDraft: false,
      isSubmitted: false,

      setPrediction: (key, value) =>
        set((state) => ({
          predictions: { ...state.predictions, [key]: value },
        })),

      saveDraft: () => set({ isDraft: true }),

      submitFinal: () => set({ isSubmitted: true, isDraft: false }),

      canEdit: () => {
        const state = get();
        const now = new Date();
        // Cannot edit if event has started or already submitted
        if (now >= EVENT_START || state.isSubmitted) {
          return false;
        }
        return true;
      },

      reset: () => set({ predictions: {}, isDraft: false, isSubmitted: false }),
    }),
    {
      name: 'bovenkamer-predictions',
    }
  )
);

// Auth store with localStorage caching (30-day expiry)
interface AuthState {
  currentUser: AuthUser | null;
  isAuthenticated: boolean;
  isCheckingAuth: boolean;
  authToken: string | null;
  _hasHydrated: boolean;

  // Actions
  login: (user: AuthUser, token: string, pinHash: string) => void;
  logout: () => void;
  updateUser: (user: Partial<AuthUser>) => void;
  checkSession: () => Promise<boolean>;
  setCheckingAuth: (checking: boolean) => void;
  setHasHydrated: (state: boolean) => void;
}

const CACHE_EXPIRY_DAYS = 30;
const CACHE_KEY = 'bovenkamer-auth-cache';

// Helper to compute PIN hash (simple client-side hash for cache validation)
const hashPIN = async (pin: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Helper to check if cache is valid
const isCacheValid = (cache: AuthCache | null): boolean => {
  if (!cache) return false;
  return Date.now() < cache.expiresAt;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      isAuthenticated: false,
      isCheckingAuth: false,
      authToken: null,
      _hasHydrated: false,

      login: (user, token, pinHash) => {
        const expiresAt = Date.now() + (CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
        const cache: AuthCache = {
          user,
          pinHash,
          cachedAt: Date.now(),
          expiresAt,
        };

        // Store in localStorage for cache validation FIRST
        // This ensures the cache is available before state update triggers re-renders
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));

        set({
          currentUser: user,
          isAuthenticated: true,
          authToken: token,
        });
      },

      logout: () => {
        set({
          currentUser: null,
          isAuthenticated: false,
          authToken: null,
        });
        localStorage.removeItem(CACHE_KEY);
      },

      updateUser: (updates) => {
        const current = get().currentUser;
        if (current) {
          const updatedUser = { ...current, ...updates };
          set({ currentUser: updatedUser });

          // Update cache
          const cacheStr = localStorage.getItem(CACHE_KEY);
          if (cacheStr) {
            try {
              const cache: AuthCache = JSON.parse(cacheStr);
              cache.user = updatedUser;
              localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
            } catch (e) {
              console.error('Failed to update auth cache:', e);
            }
          }
        }
      },

      checkSession: async () => {
        set({ isCheckingAuth: true });

        try {
          // Check localStorage cache first
          const cacheStr = localStorage.getItem(CACHE_KEY);
          if (!cacheStr) {
            set({ isCheckingAuth: false });
            return false;
          }

          const cache: AuthCache = JSON.parse(cacheStr);

          // Check if cache is expired
          if (!isCacheValid(cache)) {
            localStorage.removeItem(CACHE_KEY);
            set({ isCheckingAuth: false, isAuthenticated: false, currentUser: null });
            return false;
          }

          // Cache is valid - trust it and restore session
          set({
            currentUser: cache.user,
            isAuthenticated: true,
            isCheckingAuth: false,
          });
          return true;
        } catch (error) {
          console.error('Session check failed:', error);
          set({ isCheckingAuth: false });
          return false;
        }
      },

      setCheckingAuth: (checking) => set({ isCheckingAuth: checking }),

      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: 'bovenkamer-auth',
      partialize: (state) => ({
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
        authToken: state.authToken,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
