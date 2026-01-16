import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { RegistrationFormData, QuizAnswers, AIAssignment, Predictions } from '@/types';

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
  reset: () => void;
}

const initialFormData: RegistrationFormData = {
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
      currentStep: 1,
      isSubmitting: false,
      isComplete: false,
      aiAssignment: null,
      userId: null,
      authCode: null,

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
        set((state) => ({ currentStep: Math.min(state.currentStep + 1, 4) })),

      prevStep: () =>
        set((state) => ({ currentStep: Math.max(state.currentStep - 1, 1) })),

      setSubmitting: (isSubmitting) => set({ isSubmitting }),

      setComplete: (isComplete) => set({ isComplete }),

      setAIAssignment: (assignment) => set({ aiAssignment: assignment }),

      setUser: (userId, authCode) => set({ userId, authCode }),

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
