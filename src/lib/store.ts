import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { RegistrationFormData, QuizAnswers, AIAssignment, Predictions, AuthUser, AuthCache } from '@/types';

interface RegistrationState {
  // Form data
  formData: RegistrationFormData;
  currentStep: number;
  isSubmitting: boolean;
  isComplete: boolean;

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
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setSubmitting: (isSubmitting: boolean) => void;
  setComplete: (isComplete: boolean) => void;
  setAIAssignment: (assignment: AIAssignment) => void;
  setUser: (userId: string, authCode: string) => void;
  setHasHydrated: (state: boolean) => void;
  reset: () => void;
}

const initialFormData: RegistrationFormData = {
  pin: '',
  name: '',
  email: '',
  birthYear: null,
  hasPartner: false,
  partnerName: '',
  dietaryRequirements: '',
  primarySkill: '',
  additionalSkills: '',
  musicDecade: '',
  musicGenre: '',
  quizAnswers: {},
};

export const useRegistrationStore = create<RegistrationState>()(
  persist(
    (set) => ({
      formData: initialFormData,
      currentStep: 0,
      isSubmitting: false,
      isComplete: false,
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

      setCurrentStep: (step) => set({ currentStep: step }),

      nextStep: () =>
        set((state) => ({ currentStep: Math.min(state.currentStep + 1, 5) })),

      prevStep: () =>
        set((state) => ({ currentStep: Math.max(state.currentStep - 1, 0) })),

      setSubmitting: (isSubmitting) => set({ isSubmitting }),

      setComplete: (isComplete) => set({ isComplete }),

      setAIAssignment: (assignment) => set({ aiAssignment: assignment }),

      setUser: (userId, authCode) => set({ userId, authCode }),

      setHasHydrated: (state) => set({ _hasHydrated: state }),

      reset: () =>
        set({
          formData: initialFormData,
          currentStep: 1,
          isSubmitting: false,
          isComplete: false,
          aiAssignment: null,
        }),
    }),
    {
      name: 'bovenkamer-registration',
      partialize: (state) => ({
        formData: state.formData,
        currentStep: state.currentStep,
        isComplete: state.isComplete,
        aiAssignment: state.aiAssignment,
        userId: state.userId,
        authCode: state.authCode,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

// Predictions store
interface PredictionsState {
  predictions: Predictions;
  isSubmitted: boolean;
  setPrediction: <K extends keyof Predictions>(key: K, value: Predictions[K]) => void;
  setSubmitted: (submitted: boolean) => void;
  reset: () => void;
}

export const usePredictionsStore = create<PredictionsState>()(
  persist(
    (set) => ({
      predictions: {},
      isSubmitted: false,

      setPrediction: (key, value) =>
        set((state) => ({
          predictions: { ...state.predictions, [key]: value },
        })),

      setSubmitted: (submitted) => set({ isSubmitted: submitted }),

      reset: () => set({ predictions: {}, isSubmitted: false }),
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

  // Actions
  login: (user: AuthUser, token: string, pinHash: string) => void;
  logout: () => void;
  updateUser: (user: Partial<AuthUser>) => void;
  checkSession: () => Promise<boolean>;
  setCheckingAuth: (checking: boolean) => void;
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

      login: async (user, token, pinHash) => {
        const expiresAt = Date.now() + (CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
        const cache: AuthCache = {
          user,
          pinHash,
          cachedAt: Date.now(),
          expiresAt,
        };

        set({
          currentUser: user,
          isAuthenticated: true,
          authToken: token,
        });

        // Store in localStorage for cache validation
        localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
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
    }),
    {
      name: 'bovenkamer-auth',
      partialize: (state) => ({
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
        authToken: state.authToken,
      }),
    }
  )
);
