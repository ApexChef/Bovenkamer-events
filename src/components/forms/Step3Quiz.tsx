'use client';

import { useRegistrationStore } from '@/lib/store';
import { Input, Button, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui';
import { QuizAnswers } from '@/types';
import { motion } from 'framer-motion';

interface QuizQuestion {
  key: keyof QuizAnswers;
  question: string;
  category: string;
  placeholder: string;
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  // Muziek
  {
    key: 'guiltyPleasureSong',
    question: 'Wat is je guilty pleasure nummer?',
    category: 'Muziek',
    placeholder: 'Bijv. Barbie Girl - Aqua',
  },
  {
    key: 'bestConcert',
    question: 'Welk concert was je beste ooit?',
    category: 'Muziek',
    placeholder: 'Artiest en locatie',
  },
  // Entertainment
  {
    key: 'movieByHeart',
    question: 'Welke film kun je woord-voor-woord meezeggen?',
    category: 'Entertainment',
    placeholder: 'Bijv. The Big Lebowski',
  },
  {
    key: 'secretSeries',
    question: 'Welke serie heb je stiekem gebinged?',
    category: 'Entertainment',
    placeholder: 'Je geheime tv-schande',
  },
  // Eten
  {
    key: 'weirdestFood',
    question: 'Wat is het raarste dat je ooit gegeten hebt?',
    category: 'Eten',
    placeholder: 'Hoe exotischer, hoe beter',
  },
  {
    key: 'signatureDish',
    question: 'Wat is je signature gerecht?',
    category: 'Eten',
    placeholder: 'Waar ben je (zogenaamd) goed in?',
  },
  {
    key: 'foodRefusal',
    question: 'Wat weiger je te eten?',
    category: 'Eten',
    placeholder: 'Absolute no-go',
  },
  // Jeugd
  {
    key: 'childhoodNickname',
    question: 'Wat was je bijnaam vroeger?',
    category: 'Jeugd',
    placeholder: 'Hoe noemden ze je?',
  },
  {
    key: 'childhoodDream',
    question: 'Wat wilde je worden als kind?',
    category: 'Jeugd',
    placeholder: 'Dromen uit je jeugd',
  },
  {
    key: 'firstCar',
    question: 'Wat was je eerste auto?',
    category: 'Jeugd',
    placeholder: 'Merk en type',
  },
  // Random
  {
    key: 'hiddenTalent',
    question: 'Wat is je verborgen talent?',
    category: 'Random',
    placeholder: 'Iets wat niemand weet',
  },
  {
    key: 'irrationalFear',
    question: 'Waar ben je irrationeel bang voor?',
    category: 'Random',
    placeholder: 'Je geheime angst',
  },
  {
    key: 'bucketList',
    question: 'Wat staat nog op je bucketlist?',
    category: 'Random',
    placeholder: 'Nog te doen voor je dood',
  },
  // Bovenkamer
  {
    key: 'bestJKMoment',
    question: 'Wat was je beste JK-moment?',
    category: 'Bovenkamer',
    placeholder: 'Memorabel Junior Kamer moment',
  },
  {
    key: 'longestKnownMember',
    question: 'Wie hier ken je het langst?',
    category: 'Bovenkamer',
    placeholder: 'Naam van een mede-Bovenkamer lid',
  },
];

// Group questions by category
const groupedQuestions = QUIZ_QUESTIONS.reduce((acc, q) => {
  if (!acc[q.category]) acc[q.category] = [];
  acc[q.category].push(q);
  return acc;
}, {} as Record<string, QuizQuestion[]>);

export function Step3Quiz() {
  const { formData, setQuizAnswer, prevStep, nextStep, isSubmitting, setSubmitting } = useRegistrationStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Move to AI assignment step
      nextStep();
    } finally {
      setSubmitting(false);
    }
  };

  // Require at least 5 questions answered
  const answeredCount = Object.values(formData.quizAnswers).filter(
    (v) => v && v.trim() !== ''
  ).length;
  const isValid = answeredCount >= 5;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Vragen voor de Quiz</CardTitle>
          <CardDescription>
            Uw antwoorden worden gebruikt om quiz-vragen te genereren.
            <br />
            <span className="text-gold">Beantwoord minimaal 5 vragen.</span>
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-8">
            {Object.entries(groupedQuestions).map(([category, questions]) => (
              <div key={category}>
                <h4 className="text-gold font-semibold uppercase tracking-wider text-sm mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-gold rounded-full" />
                  {category}
                </h4>
                <div className="space-y-4">
                  {questions.map((q) => (
                    <Input
                      key={q.key}
                      label={q.question}
                      placeholder={q.placeholder}
                      value={formData.quizAnswers[q.key] || ''}
                      onChange={(e) => setQuizAnswer(q.key, e.target.value)}
                    />
                  ))}
                </div>
              </div>
            ))}

            <div className="bg-gold/10 border border-gold/30 rounded-lg p-4">
              <p className="text-cream/70 text-sm">
                <span className="text-gold font-semibold">{answeredCount}</span> van minimaal{' '}
                <span className="text-gold font-semibold">5</span> vragen beantwoord
              </p>
              <div className="mt-2 h-2 bg-dark-wood rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((answeredCount / 5) * 100, 100)}%` }}
                  className="h-full bg-gold"
                />
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button type="button" variant="ghost" onClick={prevStep}>
              Vorige stap
            </Button>
            <Button type="submit" disabled={!isValid} isLoading={isSubmitting}>
              Verzenden & Toewijzing Ontvangen
            </Button>
          </CardFooter>
        </form>
      </Card>
    </motion.div>
  );
}
