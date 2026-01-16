'use client';

import { motion } from 'framer-motion';

interface Step {
  number: number;
  title: string;
}

interface ProgressStepsProps {
  steps: Step[];
  currentStep: number;
}

export function ProgressSteps({ steps, currentStep }: ProgressStepsProps) {
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center flex-1">
            {/* Step circle */}
            <div className="relative flex flex-col items-center">
              <motion.div
                initial={false}
                animate={{
                  backgroundColor:
                    step.number <= currentStep ? '#D4AF37' : 'transparent',
                  borderColor:
                    step.number <= currentStep ? '#D4AF37' : 'rgba(212, 175, 55, 0.3)',
                }}
                className="w-10 h-10 rounded-full border-2 flex items-center justify-center transition-colors"
              >
                {step.number < currentStep ? (
                  <svg
                    className="w-5 h-5 text-dark-wood"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <span
                    className={`font-semibold ${
                      step.number === currentStep ? 'text-dark-wood' : 'text-gold/50'
                    }`}
                  >
                    {step.number}
                  </span>
                )}
              </motion.div>
              <span
                className={`absolute -bottom-6 text-xs font-medium whitespace-nowrap ${
                  step.number <= currentStep ? 'text-gold' : 'text-cream/40'
                }`}
              >
                {step.title}
              </span>
            </div>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div className="flex-1 h-0.5 mx-4">
                <motion.div
                  initial={false}
                  animate={{
                    width: step.number < currentStep ? '100%' : '0%',
                  }}
                  transition={{ duration: 0.3 }}
                  className="h-full bg-gold"
                  style={{ maxWidth: '100%' }}
                />
                <div className="h-full bg-gold/20 -mt-0.5" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
